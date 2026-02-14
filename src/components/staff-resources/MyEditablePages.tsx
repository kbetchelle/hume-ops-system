import { useNavigate } from "react-router-dom";
import { Pencil, Loader2, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyEditablePages } from "@/hooks/useResourcePageEditors";

export function MyEditablePages() {
  const navigate = useNavigate();
  const { data: editablePages = [], isLoading } = useMyEditablePages();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (editablePages.length === 0) {
    return (
      <div className="text-center py-8">
        <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No pages assigned for editing yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {editablePages.map((editAccess: any) => {
        const page = editAccess.page;
        if (!page) return null;

        return (
          <Card
            key={page.id}
            className="rounded-none cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => navigate(`/dashboard/resources/pages/${page.id}/edit`)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{page.title}</h4>
                    <Badge variant="secondary" className="rounded-none text-[9px] shrink-0">
                      Editor Access
                    </Badge>
                  </div>
                  {page.tags && page.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {page.tags.slice(0, 2).map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="rounded-none text-[9px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {page.tags.length > 2 && (
                        <Badge variant="outline" className="rounded-none text-[9px]">
                          +{page.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/resources/pages/${page.id}/edit`);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
