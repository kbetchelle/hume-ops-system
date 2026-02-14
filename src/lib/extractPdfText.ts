/**
 * PDF Text Extraction Utility
 * 
 * Extracts text content and metadata from PDF files using pdf.js.
 * Used for search indexing and page count metadata.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker source (required by pdf.js)
// The worker handles PDF parsing in a separate thread to avoid blocking the UI
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PdfMetadata {
  text: string;       // All extracted text concatenated (for search_text column)
  pageCount: number;  // Total number of pages in the PDF
}

/**
 * Extract text content and metadata from a PDF file
 * 
 * @param file - The PDF file to extract from
 * @returns Promise with text content and page count
 * 
 * @example
 * const file = event.target.files[0];
 * const { text, pageCount } = await extractPdfMetadata(file);
 * console.log(`Extracted ${text.length} characters from ${pageCount} pages`);
 */
export async function extractPdfMetadata(file: File): Promise<PdfMetadata> {
  // Load the PDF file into memory
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  
  // Extract text from each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Combine all text items from the page
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    textParts.push(pageText);
  }
  
  return {
    text: textParts.join('\n'),
    pageCount: pdf.numPages,
  };
}
