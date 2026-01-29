import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { selectFrom, insertInto, updateTable, deleteFrom, eq } from "@/lib/dataApi";

interface QuickLink {
  id: string;
  category: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const CATEGORIES = [
  "Booking Systems",
  "Member Lookup",
  "Internal Tools",
  "Emergency",
  "External Resources",
];

const ICONS = [
  "calendar",
  "clock",
  "users",
  "building",
  "alert-triangle",
  "link",
  "file-text",
  "mail",
  "phone",
  "settings",
];

export function QuickLinksManager() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    url: "",
    icon: "link",
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<QuickLink>("quick_links", {
      order: { column: "sort_order", ascending: true },
    });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const handleOpenDialog = (link?: QuickLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        category: link.category,
        title: link.title,
        url: link.url,
        icon: link.icon || "link",
      });
    } else {
      setEditingLink(null);
      setFormData({ category: "", title: "", url: "", icon: "link" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.category || !formData.title || !formData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingLink) {
      const { error } = await updateTable(
        "quick_links",
        {
          category: formData.category,
          title: formData.title,
          url: formData.url,
          icon: formData.icon,
        },
        [eq("id", editingLink.id)]
      );

      if (error) {
        toast.error("Failed to update link");
      } else {
        toast.success("Link updated");
        setIsDialogOpen(false);
        fetchLinks();
      }
    } else {
      const maxSortOrder = Math.max(...links.map((l) => l.sort_order), 0);
      const { error } = await insertInto("quick_links", {
        category: formData.category,
        title: formData.title,
        url: formData.url,
        icon: formData.icon,
        sort_order: maxSortOrder + 1,
        is_active: true,
      });

      if (error) {
        toast.error("Failed to create link");
      } else {
        toast.success("Link created");
        setIsDialogOpen(false);
        fetchLinks();
      }
    }
  };

  const handleDelete = async (link: QuickLink) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    const { error } = await deleteFrom("quick_links", [eq("id", link.id)]);

    if (error) {
      toast.error("Failed to delete link");
    } else {
      toast.success("Link deleted");
      fetchLinks();
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none border">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-none border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider font-normal">
            Quick Links
          </CardTitle>
          <Button
            size="sm"
            className="rounded-none h-8"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Link
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No quick links yet
            </p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="border p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{link.title}</p>
                      <Badge variant="outline" className="rounded-none text-xs">
                        {link.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-none"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-none"
                      onClick={() => handleOpenDialog(link)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-none text-destructive"
                      onClick={() => handleDelete(link)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              {editingLink ? "Edit Link" : "Add Link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="rounded-none text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Link title"
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">URL *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="rounded-none text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(v) => setFormData({ ...formData, icon: v })}
              >
                <SelectTrigger className="rounded-none text-xs">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon} className="text-xs">
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-none">
              {editingLink ? "Save Changes" : "Create Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
