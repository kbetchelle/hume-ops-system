import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { selectFrom, insertInto, updateTable, deleteFrom, eq } from "@/lib/dataApi";

interface ResponseTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  "Membership Inquiries",
  "Guest Passes",
  "Facility Questions",
  "Complaints",
  "General",
  "Billing",
  "Classes",
];

export function ResponseTemplatesManager() {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    content: "",
    tags: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<ResponseTemplate>("response_templates", {
      order: { column: "category", ascending: true },
    });

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const handleOpenDialog = (template?: ResponseTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        category: template.category,
        title: template.title,
        content: template.content,
        tags: template.tags.join(", "),
      });
    } else {
      setEditingTemplate(null);
      setFormData({ category: "", title: "", content: "", tags: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.category || !formData.title || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (editingTemplate) {
      const { error } = await updateTable(
        "response_templates",
        {
          category: formData.category,
          title: formData.title,
          content: formData.content,
          tags: tagsArray,
        },
        [eq("id", editingTemplate.id)]
      );

      if (error) {
        toast.error("Failed to update template");
      } else {
        toast.success("Template updated");
        setIsDialogOpen(false);
        fetchTemplates();
      }
    } else {
      const { error } = await insertInto("response_templates", {
        category: formData.category,
        title: formData.title,
        content: formData.content,
        tags: tagsArray,
        is_active: true,
      });

      if (error) {
        toast.error("Failed to create template");
      } else {
        toast.success("Template created");
        setIsDialogOpen(false);
        fetchTemplates();
      }
    }
  };

  const handleToggleActive = async (template: ResponseTemplate) => {
    const { error } = await updateTable(
      "response_templates",
      { is_active: !template.is_active },
      [eq("id", template.id)]
    );

    if (error) {
      toast.error("Failed to update template");
    } else {
      fetchTemplates();
    }
  };

  const handleDelete = async (template: ResponseTemplate) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    const { error } = await deleteFrom("response_templates", [eq("id", template.id)]);

    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      fetchTemplates();
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none border">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-none border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider font-normal">
            Response Templates
          </CardTitle>
          <Button
            size="sm"
            className="rounded-none h-8"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No templates yet
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border p-3 transition-colors ${
                    template.is_active ? "hover:bg-muted/50" : "opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{template.title}</p>
                        <Badge variant="outline" className="rounded-none text-xs">
                          {template.category}
                        </Badge>
                        {!template.is_active && (
                          <Badge variant="secondary" className="rounded-none text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.content}
                      </p>
                      {template.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {template.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] rounded-none"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-none"
                        onClick={() => handleOpenDialog(template)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-none text-destructive"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              {editingTemplate ? "Edit Template" : "Add Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="Template title"
                  className="rounded-none text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Template content..."
                className="rounded-none text-xs min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., membership, pricing, hours"
                className="rounded-none text-xs"
              />
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
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
