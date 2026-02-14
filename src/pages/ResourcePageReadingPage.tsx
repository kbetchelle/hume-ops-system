import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageRenderer } from "@/components/page-builder/PageRenderer";
import { useResourcePage } from "@/hooks/useStaffResources";
import { useResourcePageFolders } from "@/hooks/useResourcePageFolders";
import { useRecordPageRead } from "@/hooks/useRecordPageRead";
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";
import { format } from "date-fns";

export function ResourcePageReadingPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const { data: page, isLoading } = useResourcePage(pageId);
  const { data: folders = [] } = useResourcePageFolders();
  const { data: pageFlagsMap } = useActiveResourceFlags("resource_page", pageId ? [pageId] : []);

  // Auto-record read receipt after 3-5 seconds
  useRecordPageRead(pageId);

  const handleBack = () => {
    navigate("/dashboard/resources/pages");
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
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
                {hasPendingFlag && <UnderReviewBadge />}
                {page.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-none text-xs"
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
          <div className="mb-8 rounded overflow-hidden">
            <img
              src={page.cover_image_url}
              alt={page.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {page.content_json ? (
          <PageRenderer content={page.content_json} />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No content available
          </p>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Last updated {format(new Date(page.updated_at), "MMMM d, yyyy")}
          </p>
        </div>
      </div>
    </div>
  );
}
