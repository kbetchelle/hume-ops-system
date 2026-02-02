import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ExternalLink,
  Calendar,
  Clock,
  Users,
  Building,
  AlertTriangle,
  Link2,
  Plus,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { selectFrom, insertInto, updateTable, deleteFrom, eq } from "@/lib/dataApi";
import { useActiveRole } from "@/hooks/useActiveRole";

interface QuickLink {
  id: string;
  category: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  building: <Building className="h-4 w-4" />,
  "alert-triangle": <AlertTriangle className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

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
];

export function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    url: "",
    icon: "link",
  });

  const { activeRole } = useActiveRole();
  const canEdit = activeRole === "admin" || activeRole === "manager";

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<QuickLink>("quick_links", {
      filters: [eq("is_active", true)],
      order: { column: "sort_order", ascending: true },
    });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const groupedLinks = useMemo(() => {
    const groups: Record<string, QuickLink[]> = {};
    links.forEach((link) => {
      if (!groups[link.category]) {
        groups[link.category] = [];
      }
      groups[link.category].push(link);
    });
    return groups;
  }, [links]);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || <Link2 className="h-4 w-4" />;
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
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
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
          {canEdit && (
            <div className="flex items-center gap-2">
              {editMode && (
                <Button
                  size="sm"
                  className="rounded-none h-8"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                className="rounded-none h-8"
                onClick={() => setEditMode(!editMode)}
              >
                <Settings className="h-3 w-3 mr-1" />
                {editMode ? "Done" : "Edit"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(groupedLinks).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {canEdit ? "No quick links configured. Click Edit to add some." : "No quick links configured"}
            </p>
          ) : (
            Object.entries(groupedLinks).map(([category, categoryLinks]) => (
              <div key={category}>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categoryLinks.map((link) => (
                    <div key={link.id} className="relative">
                      <Button
                        variant="outline"
                        className="w-full h-auto py-3 px-4 rounded-none justify-start gap-3 hover:bg-muted/50"
                        onClick={() => window.open(link.url, "_blank")}
                      >
                        {getIcon(link.icon)}
                        <span className="text-xs">{link.title}</span>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                      </Button>
                      {editMode && canEdit && (
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(link);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(link);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
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
                      <div className="flex items-center gap-2">
                        {iconMap[icon]}
                        <span>{icon}</span>
                      </div>
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
