import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, RotateCcw, Check, X, Loader2, WifiOff } from "lucide-react";
import { compressPhoto, generatePhotoFilename } from "@/lib/compressPhoto";
import { supabase } from "@/integrations/supabase/client";

interface PhotoUploadProps {
  isOpen: boolean;
  onSave: (photoUrl: string) => void;
  onCancel: () => void;
  storageBucket?: string;
  storagePath?: string;
  title?: string;
}

interface UploadState {
  status: "idle" | "capturing" | "previewing" | "uploading" | "success" | "error" | "offline";
  preview: string | null;
  error: string | null;
}

export function PhotoUpload({
  isOpen,
  onSave,
  onCancel,
  storageBucket = "checklist-photos",
  storagePath = "checklist",
  title = "Take Photo",
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    status: "idle",
    preview: null,
    error: null,
  });
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setState({ status: "idle", preview: null, error: null });
    setCompressedFile(null);
    onCancel();
  }, [onCancel]);

  // Trigger camera capture
  const handleCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ status: "capturing", preview: null, error: null });

    try {
      // Compress the photo
      const compressed = await compressPhoto(file);
      
      setState({
        status: "previewing",
        preview: compressed.dataUrl,
        error: null,
      });
      setCompressedFile(compressed.blob);
      
      console.log(`[PhotoUpload] Compressed: ${compressed.originalSize} → ${compressed.compressedSize} bytes (${compressed.format})`);
    } catch (error) {
      console.error("[PhotoUpload] Compression failed:", error);
      setState({
        status: "error",
        preview: null,
        error: "Failed to process photo. Please try again.",
      });
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  }, []);

  // Retake photo
  const handleRetake = useCallback(() => {
    setState({ status: "idle", preview: null, error: null });
    setCompressedFile(null);
    fileInputRef.current?.click();
  }, []);

  // Upload photo to Supabase storage
  const handleUpload = useCallback(async () => {
    if (!compressedFile) return;

    // Check if online
    if (!navigator.onLine) {
      setState(prev => ({
        ...prev,
        status: "offline",
        error: "Photo saved offline - will upload when connection is restored",
      }));
      
      // Store in IndexedDB for later sync
      try {
        const { savePendingUpload } = await import("@/lib/offlineDb");
        const filename = generatePhotoFilename(compressedFile.type.includes("webp") ? "webp" : "jpeg");
        
        await savePendingUpload({
          type: 'photo',
          dataUrl: state.preview!,
          storageBucket,
          storagePath,
          filename,
          mimeType: compressedFile.type,
        });
        
        // Return the preview data URL as temporary URL for immediate display
        onSave(state.preview!);
      } catch (offlineError) {
        console.error("[PhotoUpload] Failed to queue offline:", offlineError);
        // Still return preview for offline use
        onSave(state.preview!);
      }
      return;
    }

    setState(prev => ({ ...prev, status: "uploading", error: null }));

    try {
      // Generate unique filename
      const filename = generatePhotoFilename(compressedFile.type.includes("webp") ? "webp" : "jpeg");
      const filePath = `${storagePath}/${filename}`;

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, compressedFile, {
          contentType: compressedFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(data.path);

      setState({ status: "success", preview: state.preview, error: null });
      onSave(urlData.publicUrl);
    } catch (error) {
      console.error("[PhotoUpload] Upload failed:", error);
      setState({
        status: "error",
        preview: state.preview,
        error: "Failed to upload photo. Please try again.",
      });
    }
  }, [compressedFile, state.preview, storageBucket, storagePath, onSave]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Preview or capture area */}
          <div className="w-full aspect-square max-h-[300px] border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
            {state.preview ? (
              <img
                src={state.preview}
                alt="Photo preview"
                className="w-full h-full object-contain"
              />
            ) : state.status === "capturing" ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-12 w-12" />
                <span className="text-sm">Tap to take photo</span>
              </div>
            )}
          </div>

          {/* Status messages */}
          {state.status === "offline" && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <WifiOff className="h-4 w-4" />
              <span>{state.error}</span>
            </div>
          )}

          {state.status === "error" && state.error && (
            <p className="text-sm text-destructive text-center">{state.error}</p>
          )}

          {state.status === "uploading" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {!state.preview ? (
            // Initial state - show capture button
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCapture}
                className="gap-1"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
            </>
          ) : (
            // Preview state - show retake and save
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetake}
                disabled={state.status === "uploading"}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={state.status === "uploading"}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={state.status === "uploading"}
                  className="gap-1"
                >
                  {state.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PhotoUpload;
