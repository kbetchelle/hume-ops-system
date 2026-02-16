/**
 * usePdfTextExtraction Hook
 * 
 * React hook for extracting text from PDF files with progress tracking
 * and error handling. Used during PDF upload to populate search_text column.
 */

import { useMutation } from "@tanstack/react-query";
import { extractPdfText, getPdfPageCount, getPdfInfo } from "@/lib/pdfUtils";

export interface PdfTextExtractionResult {
  text: string;
  pageCount: number;
  characterCount: number;
  extractionTimeMs: number;
}

/**
 * Hook for extracting text from a PDF file
 * Provides mutation with progress tracking and error handling
 * 
 * @example
 * const extractMutation = usePdfTextExtraction();
 * 
 * const handleExtract = async (file: File) => {
 *   const result = await extractMutation.mutateAsync(file);
 *   console.log(`Extracted ${result.characterCount} characters`);
 * };
 */
export function usePdfTextExtraction() {
  return useMutation({
    mutationFn: async (file: File): Promise<PdfTextExtractionResult> => {
      const startTime = performance.now();
      
      // Extract text and page count in parallel
      const [text, pageCount] = await Promise.all([
        extractPdfText(file),
        getPdfPageCount(file),
      ]);
      
      const endTime = performance.now();
      
      return {
        text,
        pageCount,
        characterCount: text.length,
        extractionTimeMs: Math.round(endTime - startTime),
      };
    },
  });
}

/**
 * Hook for getting comprehensive PDF information
 * Extracts text, metadata, and file info in one call
 * 
 * @example
 * const infMutation = usePdfInfo();
 * 
 * const handleAnalyze = async (file: File) => {
 *   const info = await infoMutation.mutateAsync(file);
 *   console.log(`${info.fileName}: ${info.pageCount} pages, ${info.metadata.title}`);
 * };
 */
export function usePdfInfo() {
  return useMutation({
    mutationFn: async (file: File) => {
      const [text, info] = await Promise.all([
        extractPdfText(file),
        getPdfInfo(file),
      ]);
      
      return {
        ...info,
        searchText: text,
        characterCount: text.length,
      };
    },
  });
}

/**
 * Hook for validating PDF files before upload
 * Checks file type, size, and readability
 * 
 * @example
 * const validateMutation = usePdfValidation();
 * 
 * const handleValidate = async (file: File) => {
 *   try {
 *     const result = await validateMutation.mutateAsync({ 
 *       file, 
 *       maxSizeMB: 50 
 *     });
 *     console.log(`Valid PDF: ${result.pageCount} pages`);
 *   } catch (error) {
 *     console.error('Invalid PDF:', error.message);
 *   }
 * };
 */
export function usePdfValidation() {
  return useMutation({
    mutationFn: async ({ 
      file, 
      maxSizeMB = 50 
    }: { 
      file: File; 
      maxSizeMB?: number 
    }) => {
      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('File must be a PDF');
      }
      
      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`PDF must be under ${maxSizeMB} MB`);
      }
      
      // Validate PDF is readable and get page count
      const pageCount = await getPdfPageCount(file);
      if (pageCount === 0) {
        throw new Error('PDF has no pages or could not be read');
      }
      
      return {
        valid: true,
        pageCount,
        fileSize: file.size,
        fileName: file.name,
      };
    },
  });
}
