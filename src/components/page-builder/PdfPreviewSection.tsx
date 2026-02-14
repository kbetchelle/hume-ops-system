/**
 * PDF Preview Section Component
 * 
 * Displays PDF metadata and provides view/download actions.
 * Used in the page editor for PDF pages.
 */

import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PdfPreviewSectionProps {
  fileUrl: string;
  pageCount: number;
  fileSize: number;
  originalFilename: string;
  onViewPdf?: () => void;
}

export function PdfPreviewSection({
  fileUrl,
  pageCount,
  fileSize,
  originalFilename,
  onViewPdf,
}: PdfPreviewSectionProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="rounded-none">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* PDF Icon */}
          <div className="shrink-0">
            <div className="h-16 w-16 rounded-lg bg-blue-500/10 flex items-center justify-center relative">
              <FileText className="h-8 w-8 text-blue-500" />
              {pageCount && (
                <Badge
                  variant="secondary"
                  className="absolute -bottom-2 text-xs"
                >
                  {pageCount} {pageCount === 1 ? "page" : "pages"}
                </Badge>
              )}
            </div>
          </div>

          {/* PDF Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 truncate">{originalFilename}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">{formatFileSize(fileSize)}</Badge>
              {pageCount && (
                <Badge variant="outline">
                  {pageCount} {pageCount === 1 ? "page" : "pages"}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {onViewPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewPdf}
                  className="rounded-none"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View PDF
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-none"
              >
                <a href={fileUrl} download={originalFilename}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
