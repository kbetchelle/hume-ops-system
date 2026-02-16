/**
 * PDF Utilities
 * 
 * Functions for extracting text, getting page counts, and generating thumbnails
 * from PDF files. Uses pdfjs-dist (Mozilla's PDF.js) for all PDF operations.
 * 
 * Key Functions:
 * - extractPdfText: Extract all text from PDF for full-text search
 * - getPdfPageCount: Get number of pages in PDF
 * - generatePdfThumbnail: Create thumbnail image from first page
 * - getPdfMetadata: Extract PDF metadata (title, author, etc.)
 */

import * as pdfjsLib from 'pdfjs-dist';
import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// ============================================================================
// Configuration
// ============================================================================

// Configure PDF.js worker
// Uses CDN for worker file (alternative: self-host for better offline support)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ============================================================================
// Type Definitions
// ============================================================================

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PdfInfo {
  pageCount: number;
  metadata: PdfMetadata;
  fileSize: number;
  fileName: string;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  extractedPages: number;
  hasErrors: boolean;
  errors: string[];
}

// ============================================================================
// Core PDF Loading Function
// ============================================================================

/**
 * Load PDF document from File object
 * Internal helper used by other functions
 */
async function loadPdfDocument(file: File): Promise<PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  return await loadingTask.promise;
}

// ============================================================================
// Text Extraction
// ============================================================================

/**
 * Extract all text from a PDF file for full-text search indexing
 * 
 * @param file - PDF file to extract text from
 * @param options - Extraction options
 * @returns Plain text extracted from all pages, separated by newlines
 * 
 * @example
 * const text = await extractPdfText(pdfFile);
 * // Store text in database search_text column
 * await supabase.from('resource_pages').update({ search_text: text })
 */
export async function extractPdfText(
  file: File,
  options: {
    maxPages?: number; // Limit extraction to first N pages (for very large PDFs)
    includePageNumbers?: boolean; // Include "Page X:" markers in text
  } = {}
): Promise<string> {
  const { maxPages, includePageNumbers = false } = options;

  try {
    const pdf = await loadPdfDocument(file);
    const pagesToExtract = maxPages ? Math.min(pdf.numPages, maxPages) : pdf.numPages;
    
    let fullText = '';
    
    for (let i = 1; i <= pagesToExtract; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Add page number marker if requested
        if (includePageNumbers && pagesToExtract > 1) {
          fullText += `\n--- Page ${i} ---\n`;
        }
        
        // Extract text items and join them
        const pageText = textContent.items
          .map((item: any) => {
            // item.str contains the actual text
            return item.str || '';
          })
          .join(' ');
        
        fullText += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        // Continue with next page even if one fails
        fullText += `[Error extracting page ${i}]\n\n`;
      }
    }
    
    // Clean up the text
    fullText = fullText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit to max 2 newlines
      .trim();
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    // Return empty string on error so upload doesn't fail
    // Search just won't work for this PDF
    return '';
  }
}

/**
 * Extract text with detailed error reporting
 * Useful for debugging text extraction issues
 */
export async function extractPdfTextDetailed(
  file: File
): Promise<PdfExtractionResult> {
  const result: PdfExtractionResult = {
    text: '',
    pageCount: 0,
    extractedPages: 0,
    hasErrors: false,
    errors: [],
  };

  try {
    const pdf = await loadPdfDocument(file);
    result.pageCount = pdf.numPages;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        
        fullText += pageText + '\n\n';
        result.extractedPages++;
      } catch (pageError) {
        result.hasErrors = true;
        result.errors.push(`Page ${i}: ${pageError}`);
      }
    }
    
    result.text = fullText.trim();
  } catch (error) {
    result.hasErrors = true;
    result.errors.push(`Document loading: ${error}`);
  }

  return result;
}

// ============================================================================
// Page Count
// ============================================================================

/**
 * Get the number of pages in a PDF
 * 
 * @param file - PDF file to count pages
 * @returns Number of pages, or 0 on error
 * 
 * @example
 * const pageCount = await getPdfPageCount(pdfFile);
 * await supabase.from('resource_pages').update({ pdf_page_count: pageCount })
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const pdf = await loadPdfDocument(file);
    return pdf.numPages;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return 0;
  }
}

// ============================================================================
// Thumbnail Generation
// ============================================================================

/**
 * Generate a thumbnail image from the first page of a PDF
 * 
 * @param file - PDF file to generate thumbnail from
 * @param options - Thumbnail generation options
 * @returns Data URL of thumbnail image (JPEG), or empty string on error
 * 
 * @example
 * const thumbnail = await generatePdfThumbnail(pdfFile, { scale: 0.3 });
 * await supabase.from('resource_pages').update({ cover_image_url: thumbnail })
 */
export async function generatePdfThumbnail(
  file: File,
  options: {
    scale?: number; // Scale factor for thumbnail (0.1 - 1.0, default: 0.5)
    quality?: number; // JPEG quality (0.1 - 1.0, default: 0.7)
    pageNumber?: number; // Page to use for thumbnail (default: 1)
  } = {}
): Promise<string> {
  const { scale = 0.5, quality = 0.7, pageNumber = 1 } = options;

  try {
    const pdf = await loadPdfDocument(file);
    
    // Ensure page number is valid
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`);
    }
    
    const page = await pdf.getPage(pageNumber);
    
    // Get viewport with specified scale
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render page to canvas
    await page.render({ 
      canvasContext: context, 
      viewport 
    }).promise;
    
    // Convert to JPEG data URL
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return '';
  }
}

// ============================================================================
// Metadata Extraction
// ============================================================================

/**
 * Extract metadata from PDF file
 * 
 * @param file - PDF file to extract metadata from
 * @returns PDF metadata object
 * 
 * @example
 * const metadata = await getPdfMetadata(pdfFile);
 * console.log(`Title: ${metadata.title}, Author: ${metadata.author}`);
 */
export async function getPdfMetadata(file: File): Promise<PdfMetadata> {
  try {
    const pdf = await loadPdfDocument(file);
    const metadata = await pdf.getMetadata();
    
    const info = metadata.info as any;
    
    return {
      title: info?.Title || undefined,
      author: info?.Author || undefined,
      subject: info?.Subject || undefined,
      keywords: info?.Keywords || undefined,
      creator: info?.Creator || undefined,
      producer: info?.Producer || undefined,
      creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    return {};
  }
}

/**
 * Get comprehensive PDF information
 * 
 * @param file - PDF file to analyze
 * @returns Complete PDF information including metadata, page count, and file info
 * 
 * @example
 * const info = await getPdfInfo(pdfFile);
 * console.log(`${info.fileName}: ${info.pageCount} pages, ${info.fileSize} bytes`);
 */
export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const [pageCount, metadata] = await Promise.all([
    getPdfPageCount(file),
    getPdfMetadata(file),
  ]);

  return {
    pageCount,
    metadata,
    fileSize: file.size,
    fileName: file.name,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a file is a valid PDF
 * 
 * @param file - File to validate
 * @returns True if file is a valid PDF
 * 
 * @example
 * if (!await isValidPdf(file)) {
 *   throw new Error('Invalid PDF file');
 * }
 */
export async function isValidPdf(file: File): Promise<boolean> {
  try {
    await loadPdfDocument(file);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate PDF and get basic info in one call
 * 
 * @param file - File to validate
 * @returns Validation result with page count, or null if invalid
 */
export async function validatePdf(
  file: File
): Promise<{ valid: true; pageCount: number } | { valid: false; error: string }> {
  try {
    const pageCount = await getPdfPageCount(file);
    if (pageCount === 0) {
      return { valid: false, error: 'PDF has no pages or could not be read' };
    }
    return { valid: true, pageCount };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.3 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file size is within limits
 * 
 * @param file - File to check
 * @param maxSizeMB - Maximum size in megabytes (default: 50)
 * @returns True if file is within size limit
 */
export function isWithinSizeLimit(file: File, maxSizeMB: number = 50): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}
