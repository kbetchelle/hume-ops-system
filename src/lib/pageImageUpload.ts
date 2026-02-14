import { compressPhoto, getPhotoExtension } from "@/lib/compressPhoto";
import { supabase } from "@/integrations/supabase/client";

/**
 * Compress and upload an image to the resource-page-assets storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadPageImage(file: File): Promise<string> {
  // 1. Compress the image (1024px max, ~250KB WebP/JPEG)
  const compressed = await compressPhoto(file);

  // 2. Generate a unique storage path
  const ext = getPhotoExtension(compressed.format);
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const path = `pages/${Date.now()}-${uniqueId}.${ext}`;

  // 3. Upload to resource-page-assets bucket
  const { error: uploadError } = await supabase.storage
    .from("resource-page-assets")
    .upload(path, compressed.blob, {
      contentType: compressed.format === "webp" ? "image/webp" : "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  // 4. Get the public URL
  const { data } = supabase.storage
    .from("resource-page-assets")
    .getPublicUrl(path);

  return data.publicUrl;
}
