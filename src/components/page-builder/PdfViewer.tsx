/**
 * PDF Viewer Component
 * 
 * In-app PDF viewer using pdf.js for rendering PDF pages.
 * Features: page navigation, zoom controls, responsive canvas rendering.
 */

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker (same as in extractPdfText.ts)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  fileUrl: string;
  className?: string;
}

export function PdfViewer({ fileUrl, className }: PdfViewerProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasData, setCanvasData] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;

    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;

        if (!isMounted) return;

        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load PDF:', err);
        if (isMounted) {
          setError('Failed to load PDF file');
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      if (pdf) {
        pdf.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup uses pdf from closure; adding pdf would retrigger effect after load
  }, [fileUrl]);

  // Render current page
  useEffect(() => {
    if (!pdf) return;

    let isMounted = true;

    async function renderPage() {
      try {
        const page = await pdf.getPage(currentPage);
        
        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          setError('Failed to get canvas context');
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        if (!isMounted) return;

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL();
        setCanvasData(dataUrl);
      } catch (err: any) {
        console.error('Failed to render page:', err);
        if (isMounted) {
          setError('Failed to render page');
        }
      }
    }

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdf, currentPage, scale]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const handleFitToWidth = () => {
    setScale(1.5);
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="rounded-none"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border border-border">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="rounded-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className="rounded-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="rounded-none"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="rounded-none"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFitToWidth}
            className="rounded-none"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Fit
          </Button>
        </div>
      </div>

      {/* PDF Page */}
      <div className="flex justify-center bg-muted/20 p-8 rounded-lg border border-border overflow-auto">
        {canvasData ? (
          <img
            src={canvasData}
            alt={`Page ${currentPage}`}
            className="max-w-full h-auto shadow-lg"
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
