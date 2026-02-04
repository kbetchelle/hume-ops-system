/**
 * Photo compression utility for checklist uploads
 * Compresses images to ~200KB for optimal storage and upload speed
 */

export interface CompressPhotoOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg";
}

export interface CompressedPhoto {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  format: string;
}

const DEFAULT_OPTIONS: Required<CompressPhotoOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.75,
  format: "webp",
};

/**
 * Check if WebP is supported by the browser
 */
function isWebPSupported(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

/**
 * Load an image from a File or Blob
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    // Landscape
    const newWidth = Math.min(width, maxWidth);
    const newHeight = Math.round(newWidth / aspectRatio);
    if (newHeight > maxHeight) {
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight,
      };
    }
    return { width: newWidth, height: newHeight };
  } else {
    // Portrait or square
    const newHeight = Math.min(height, maxHeight);
    const newWidth = Math.round(newHeight * aspectRatio);
    if (newWidth > maxWidth) {
      return {
        width: maxWidth,
        height: Math.round(maxWidth / aspectRatio),
      };
    }
    return { width: newWidth, height: newHeight };
  }
}

/**
 * Convert canvas to blob with format fallback
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Compress a photo file for upload
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed photo data
 * 
 * @example
 * const file = event.target.files[0];
 * const compressed = await compressPhoto(file);
 * console.log(`Reduced from ${compressed.originalSize} to ${compressed.compressedSize} bytes`);
 */
export async function compressPhoto(
  file: File | Blob,
  options: CompressPhotoOptions = {}
): Promise<CompressedPhoto> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Load the image
  const img = await loadImage(file);

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidth,
    opts.maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Use better image smoothing for quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the image
  ctx.drawImage(img, 0, 0, width, height);

  // Determine output format
  let format = opts.format === "webp" && isWebPSupported() ? "webp" : "jpeg";
  let mimeType = format === "webp" ? "image/webp" : "image/jpeg";

  // Convert to blob
  let blob = await canvasToBlob(canvas, mimeType, opts.quality);

  // If WebP is too large, fall back to JPEG
  if (format === "webp" && blob.size > 250000) {
    format = "jpeg";
    mimeType = "image/jpeg";
    blob = await canvasToBlob(canvas, mimeType, opts.quality);
  }

  // If still too large, reduce quality further
  let currentQuality = opts.quality;
  while (blob.size > 250000 && currentQuality > 0.3) {
    currentQuality -= 0.1;
    blob = await canvasToBlob(canvas, mimeType, currentQuality);
  }

  // Create data URL
  const dataUrl = canvas.toDataURL(mimeType, currentQuality);

  return {
    blob,
    dataUrl,
    width,
    height,
    originalSize,
    compressedSize: blob.size,
    format,
  };
}

/**
 * Get file extension for compressed photo format
 */
export function getPhotoExtension(format: string): string {
  return format === "webp" ? "webp" : "jpg";
}

/**
 * Generate a unique filename for photo upload
 */
export function generatePhotoFilename(format: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getPhotoExtension(format);
  return `${timestamp}-${random}.${extension}`;
}

export default compressPhoto;
