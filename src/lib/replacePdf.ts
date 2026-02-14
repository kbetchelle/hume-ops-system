/**
 * PDF Replacement Utility
 * 
 * Handles replacing an existing PDF file while preserving metadata and read receipts.
 * Uses upload-then-delete strategy to prevent data loss if upload fails.
 */

import { supabase } from '@/integrations/supabase/client';
import { uploadPdf } from './uploadPdf';
import type { PdfUploadResult } from './uploadPdf';
export type { PdfUploadResult } from './uploadPdf';

/**
 * Replace an existing PDF file with a new one
 * 
 * This function uploads the new file first, then deletes the old one only if
 * the upload succeeds. This prevents data loss if the upload fails.
 * 
 * @param newFile - The new PDF file to upload
 * @param oldFilePath - Storage path of the old file to delete
 * @returns Promise with upload result for the new file
 * @throws Error if upload fails (old file remains untouched)
 * 
 * @example
 * try {
 *   const result = await replacePdf(newFile, page.pdf_file_path);
 *   // Update page record with result.fileUrl, result.filePath, etc.
 * } catch (error) {
 *   console.error('Replace failed:', error.message);
 *   // Old file is still intact
 * }
 */
export async function replacePdf(
  newFile: File,
  oldFilePath: string
): Promise<PdfUploadResult> {
  // 1. Upload the new file first (ensures success before deleting old file)
  const result = await uploadPdf(newFile);
  
  // 2. Delete the old file from storage (only after successful upload)
  if (oldFilePath) {
    const { error } = await supabase.storage
      .from('resource-page-assets')
      .remove([oldFilePath]);
    
    // Note: We don't throw if deletion fails - the new file is already uploaded
    // and the old file will just be orphaned (can be cleaned up later)
    if (error) {
      console.warn('Failed to delete old PDF file:', error);
    }
  }
  
  return result;
}
