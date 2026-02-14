import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResourcePage } from "@/hooks/useStaffResources";
import { useResourcePageFolders } from "@/hooks/useResourcePageFolders";
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";
import { format } from "date-fns";

export function ResourcePagesTab({
  pages,
  isLoading,
  searchTerm,
}: {
  pages: ResourcePage[];
  isLoading: boolean;
  searchTerm: string;
}) {
  const navigate = useNavigate();
  const { data: folders = [] } = useResourcePageFolders();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extract all unique tags from pages
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    pages.forEach((page) => {
      page.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [pages]);

  // Filter pages by folder, tags, and search term
  const filtered = useMemo(() => {
    let list = pages;

    // Filter by folder
    if (selectedFolderId && selectedFolderId !== "all") {
      if (selectedFolderId === "unfiled") {
        list = list.filter((p) => !p.folder_id);
      } else {
        list = list.filter((p) => p.folder_id === selectedFolderId);
      }
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      list = list.filter((p) =>
        selectedTags.some((tag) => p.tags.includes(tag))
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.search_text && p.search_text.toLowerCase().includes(q)) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return list;
  }, [pages, selectedFolderId, selectedTags, searchTerm]);

  const pageIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const { data: pageFlagsMap } = useActiveResourceFlags("resource_page", pageIds);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return undefined;
    return folders.find((f) => f.id === folderId)?.name;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="space-y-3">
        {/* Folder Filters */}
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFolderId === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setSelectedFolderId("all")}
            >
              All Pages
            </Button>
            <Button
              variant={selectedFolderId === "unfiled" ? "default" : "outline"}
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setSelectedFolderId("unfiled")}
            >
              Unfiled
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "default" : "outline"}
                size="sm"
                className="rounded-none text-xs"
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                {folder.name}
              </Button>
            ))}
          </div>
        )}

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">
              Tags:
            </span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="rounded-none text-xs cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedTags.length > 0
                ? "No pages match your filters."
                : "No resource pages assigned to your role yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((page) => {
            const folderName = getFolderName(page.folder_id);
            const hasPendingFlag = pageFlagsMap?.has(page.id) ?? false;

            return (
              <ResourceFlagContextMenu
                key={page.id}
                resourceType="resource_page"
                resourceId={page.id}
                resourceLabel={page.title}
                hasPendingFlag={hasPendingFlag}
              >
                <Card
                  data-resource-id={page.id}
                  className="rounded-none overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/resources/pages/${page.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    {page.cover_image_url && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={page.cover_image_url}
                          alt={page.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <div>
                        <h3 className="font-medium line-clamp-2 mb-2">
                          {page.title}
                        </h3>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1">
                          {hasPendingFlag && <UnderReviewBadge />}
                          {folderName && (
                            <Badge
                              variant="secondary"
                              className="rounded-none text-[10px]"
                            >
                              <FolderOpen className="h-3 w-3 mr-1" />
                              {folderName}
                            </Badge>
                          )}
                          {page.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-none text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {page.tags.length > 2 && (
                            <Badge
                              variant="outline"
                              className="rounded-none text-[10px]"
                            >
                              +{page.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="text-xs text-muted-foreground">
                        {page.updated_at &&
                          format(new Date(page.updated_at), "MMM d, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ResourceFlagContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
