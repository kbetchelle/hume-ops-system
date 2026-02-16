/**
 * PdfViewerWithFlags
 * 
 * Enhanced PDF viewer component that displays PDFs inline with support for:
 * - Page-by-page navigation
 * - Zoom controls
 * - Flagging specific pages
 * - Highlighting pages with existing flags
 * - Download functionality
 */

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Flag,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Import react-pdf styles
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

interface PdfViewerWithFlagsProps {
  pdfUrl: string;
  pageId: string;
  fileName?: string;
  onFlagPage?: (pageNumber: number) => void;
  className?: string;
}

interface PageFlag {
  id: string;
  flagged_page_number: number | null;
  flagged_page_context: string | null;
  note: string;
  flagged_by_name: string;
  created_at: string;
  status: string;
}

export function PdfViewerWithFlags({
  pdfUrl,
  pageId,
  fileName,
  onFlagPage,
  className,
}: PdfViewerWithFlagsProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flags for this PDF
  const { data: flags = [] } = useQuery({
    queryKey: ["pdf-page-flags", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_outdated_flags")
        .select("*")
        .eq("resource_id", pageId)
        .eq("resource_type", "resource_page")
        .eq("status", "pending");

      if (error) throw error;
      return (data || []) as PageFlag[];
    },
  });

  // Get flags for current page
  const currentPageFlags = flags.filter(
    (f) => f.flagged_page_number === pageNumber || f.flagged_page_number === null
  );

  // Get pages that have flags
  const flaggedPages = new Set(
    flags
      .filter((f) => f.flagged_page_number !== null)
      .map((f) => f.flagged_page_number as number)
  );

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF. Please try again.");
    setIsLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName || "document.pdf";
    link.click();
  };

  const handleFlagPage = () => {
    if (onFlagPage) {
      onFlagPage(pageNumber);
    }
  };

  // Reset to page 1 when PDF URL changes
  useEffect(() => {
    setPageNumber(1);
    setIsLoading(true);
  }, [pdfUrl]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-muted/30">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[120px] justify-center">
            <span className="text-sm font-medium">
              Page {pageNumber} of {numPages || "..."}
            </span>
            {flaggedPages.has(pageNumber) && (
              <Badge variant="destructive" className="gap-1">
                <Flag className="h-3 w-3" />
                Flagged
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 2.0}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onFlagPage && (
            <Button
              variant={currentPageFlags.length > 0 ? "destructive" : "outline"}
              size="sm"
              onClick={handleFlagPage}
              className="gap-2"
            >
              <Flag className="h-4 w-4" />
              {currentPageFlags.length > 0 ? "Flagged" : "Flag Page"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Flags Alert */}
      {currentPageFlags.length > 0 && (
        <div className="p-4 border-b bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                This page has {currentPageFlags.length} active flag{currentPageFlags.length !== 1 ? "s" : ""}
              </p>
              {currentPageFlags.map((flag) => (
                <Card key={flag.id} className="bg-white dark:bg-gray-900">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{flag.note}</p>
                        {flag.flagged_page_context && (
                          <p className="text-xs text-muted-foreground mt-1 italic border-l-2 border-muted pl-2">
                            "{flag.flagged_page_context}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Flagged by {flag.flagged_by_name} •{" "}
                          {new Date(flag.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
        {error ? (
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-sm font-medium mb-2">Error Loading PDF</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            }
            error={
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                  <p className="text-sm font-medium mb-2">Failed to Load PDF</p>
                  <p className="text-xs text-muted-foreground">
                    The PDF file could not be loaded. It may be corrupted or incompatible.
                  </p>
                </CardContent>
              </Card>
            }
            className="shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
              error={
                <Card className="max-w-md">
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
                    <p className="text-sm">Failed to load page {pageNumber}</p>
                  </CardContent>
                </Card>
              }
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="border border-border"
            />
          </Document>
        )}
      </div>

      {/* Page Thumbnails (if many pages) */}
      {numPages > 3 && (
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center gap-2 overflow-x-auto">
            <p className="text-xs text-muted-foreground whitespace-nowrap mr-2">
              Jump to:
            </p>
            {Array.from({ length: Math.min(numPages, 20) }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                variant={n === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => setPageNumber(n)}
                className={cn(
                  "min-w-[40px]",
                  flaggedPages.has(n) && "border-destructive text-destructive"
                )}
              >
                {n}
                {flaggedPages.has(n) && <Flag className="h-3 w-3 ml-1" />}
              </Button>
            ))}
            {numPages > 20 && (
              <span className="text-xs text-muted-foreground">
                +{numPages - 20} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
