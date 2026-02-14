/**
 * PDF Upload Utility
 * 
 * Handles validation, text extraction, and upload of PDF files to Supabase Storage.
 * Follows the same pattern as pageImageUpload.ts for consistency.
 */

import { supabase } from '@/integrations/supabase/client';
import { extractPdfMetadata } from './extractPdfText';

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB limit

export interface PdfUploadResult {
  fileUrl: string;           // Public URL of the uploaded PDF
  filePath: string;          // Storage path (for deletion/replacement)
  fileSize: number;          // File size in bytes
  originalFilename: string;  // Original filename from upload
  pageCount: number;         // Number of pages in the PDF
  searchText: string;        // Extracted text for search indexing
}

/**
 * Upload a PDF file to Supabase Storage and extract metadata
 * 
 * @param file - The PDF file to upload
 * @returns Promise with upload result and extracted metadata
 * @throws Error if validation fails or upload fails
 * 
 * @example
 * try {
 *   const result = await uploadPdf(file);
 *   console.log(`Uploaded ${result.originalFilename} (${result.pageCount} pages)`);
 * } catch (error) {
 *   console.error('Upload failed:', error.message);
 * }
 */
export async function uploadPdf(file: File): Promise<PdfUploadResult> {
  // 1. Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('File must be a PDF');
  }
  
  // 2. Validate file size (10 MB max)
  if (file.size > MAX_PDF_SIZE) {
    throw new Error('PDF must be under 10 MB');
  }
  
  // 3. Extract text and page count (this may take a few seconds for large PDFs)
  const { text, pageCount } = await extractPdfMetadata(file);
  
  // 4. Generate unique storage path
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filePath = `pdfs/${timestamp}-${random}.pdf`;
  
  // 5. Upload to Supabase Storage (resource-page-assets bucket)
  const { data, error } = await supabase.storage
    .from('resource-page-assets')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    });
  
  if (error) throw error;
  
  // 6. Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from('resource-page-assets')
    .getPublicUrl(data.path);
  
  return {
    fileUrl: urlData.publicUrl,
    filePath: data.path,
    fileSize: file.size,
    originalFilename: file.name,
    pageCount,
    searchText: text,
  };
}
