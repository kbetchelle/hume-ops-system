import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Flag, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageRenderer } from "@/components/page-builder/PageRenderer";
import { PdfViewer } from "@/components/page-builder/PdfViewer";
import { useResourcePage } from "@/hooks/useStaffResources";
import { useResourcePageFolders } from "@/hooks/useResourcePageFolders";
import { useRecordPageRead } from "@/hooks/useRecordPageRead";
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";
import { format } from "date-fns";

/**
 * Validates a return path to prevent open redirect attacks.
 * Only allows relative paths within the application that start with /dashboard/
 * @param path - The path to validate
 * @returns The validated path or null if invalid
 */
function isValidReturnPath(path: string | null): string | null {
  if (!path) return null;
  
  // Must be a string
  if (typeof path !== 'string') return null;
  
  // Must start with /dashboard/ (our app's base path)
  if (!path.startsWith('/dashboard/')) return null;
  
  // Must not contain protocol schemes (http://, https://, javascript:, data:, etc.)
  if (path.includes('://') || path.startsWith('javascript:') || path.startsWith('data:')) return null;
  
  // Must not contain backslashes (Windows path traversal)
  if (path.includes('\\')) return null;
  
  // Must not try to navigate to parent directories in a suspicious way
  if (path.includes('../') || path.includes('/..')) return null;
  
  return path;
}

export function ResourcePageReadingPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const { data: page, isLoading } = useResourcePage(pageId);
  const { data: folders = [] } = useResourcePageFolders();
  const { data: pageFlagsMap } = useActiveResourceFlags("resource_page", pageId ? [pageId] : []);

  // Auto-record read receipt after 3-5 seconds
  useRecordPageRead(pageId);

  const handleBack = () => {
    const validReturnPath = isValidReturnPath(returnTo);
    if (validReturnPath) {
      navigate(validReturnPath);
    } else {
      // Fall back to default safe path if returnTo is invalid or missing
      navigate("/dashboard/resources/pages");
    }
  };

  const handleDownloadPDF = () => {
    if (page?.page_type === 'pdf' && page?.pdf_file_url) {
      // For PDF pages, download the actual PDF file
      const link = document.createElement('a');
      link.href = page.pdf_file_url;
      link.download = page.pdf_original_filename || 'document.pdf';
      link.click();
    } else {
      // For builder pages, use browser print (existing behavior)
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <Skeleton className="h-10 w-10 shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Page not found</p>
        <Button onClick={handleBack} className="rounded-none">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pages
        </Button>
      </div>
    );
  }

  const folderName = page.folder_id
    ? folders.find((f) => f.id === page.folder_id)?.name
    : null;
  const hasPendingFlag = pageFlagsMap?.has(page.id) ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Print-only header (hidden on screen, visible in print) */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-semibold mb-2">{page.title}</h1>
        {folderName && (
          <div className="text-sm text-muted-foreground mb-2 breadcrumb">
            Resources › Pages › {folderName}
          </div>
        )}
        {page.tags.length > 0 && (
          <div className="text-xs text-muted-foreground mb-2">
            Tags: {page.tags.join(", ")}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background no-print">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-none shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold mb-2">{page.title}</h1>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 breadcrumb">
                <span>Resources</span>
                <span>›</span>
                <span>Pages</span>
                {folderName && (
                  <>
                    <span>›</span>
                    <span>{folderName}</span>
                  </>
                )}
              </div>

              {/* Tags and badges */}
              <div className="flex flex-wrap gap-1">
                {page.page_type === 'pdf' && (
                  <Badge variant="secondary" className="rounded-none text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileText className="h-3 w-3 mr-1" />
                    PDF · {page.pdf_page_count || 0} pages
                  </Badge>
                )}
                {hasPendingFlag && <UnderReviewBadge />}
                {page.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-none text-xs badge"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="rounded-none"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>

              <ResourceFlagContextMenu
                resourceType="resource_page"
                resourceId={page.id}
                resourceLabel={page.title}
                hasPendingFlag={hasPendingFlag}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag
                </Button>
              </ResourceFlagContextMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {page.cover_image_url && (
          <div className="mb-8 rounded overflow-hidden cover-image">
            <img
              src={page.cover_image_url}
              alt={page.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {page.page_type === 'pdf' ? (
          /* PDF Viewer for PDF pages */
          page.pdf_file_url ? (
            <PdfViewer fileUrl={page.pdf_file_url} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              PDF file not available
            </p>
          )
        ) : (
          /* PageRenderer for builder pages */
          page.content_json ? (
            <PageRenderer content={page.content_json} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No content available
            </p>
          )
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border page-footer">
          <p className="text-xs text-muted-foreground">
            Last updated {format(new Date(page.updated_at), "MMMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}
