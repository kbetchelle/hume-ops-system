import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Copy, Sparkles, Check, Plus, Pencil, Trash2, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { selectFrom, insertInto, updateTable, deleteFrom, eq } from "@/lib/dataApi";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ResponseTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
  is_outdated: boolean;
  marked_outdated_by: string | null;
  marked_outdated_by_name: string | null;
  marked_outdated_at: string | null;
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
  "3rd Party Partners",
  "Events & Collabs",
  "Member Inquiries",
  "Member Outreach",
  "New Member Offers",
  "Non-Member Inquiries",
  "Tours",
];

export function ResponseTemplatesWithAI() {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<ResponseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inquiry, setInquiry] = useState("");
  const [suggestedTemplate, setSuggestedTemplate] = useState<ResponseTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    content: "",
    tags: "",
  });

  const { activeRole } = useActiveRole();
  const { user } = useAuth();
  
  // Any authenticated user can edit templates
  const canEdit = !!user;
  // Only admins/managers can delete or toggle active status
  const isAdminOrManager = activeRole === "admin" || activeRole === "manager";

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    // Fetch active templates for users
    const { data, error } = await selectFrom<ResponseTemplate>("response_templates", {
      filters: [eq("is_active", true)],
      order: { column: "category", ascending: true },
    });

    if (!error && data) {
      setTemplates(data);
    }

    // Fetch all templates for editing mode
    const { data: allData } = await selectFrom<ResponseTemplate>("response_templates", {
      order: { column: "category", ascending: true },
    });
    if (allData) {
      setAllTemplates(allData);
    }

    setLoading(false);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map((t) => t.category))];
    return cats.sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const source = editMode ? allTemplates : templates;
    return source.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [templates, allTemplates, searchQuery, categoryFilter, editMode]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ResponseTemplate[]> = {};
    filteredTemplates.forEach((t) => {
      if (!groups[t.category]) {
        groups[t.category] = [];
      }
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  const handleCopy = async (template: ResponseTemplate) => {
    await navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const findBestTemplate = () => {
    if (!inquiry.trim()) {
      toast.error("Please enter a member inquiry");
      return;
    }

    const inquiryWords = inquiry.toLowerCase().split(/\s+/);
    let bestMatch: ResponseTemplate | null = null;
    let bestScore = 0;

    templates.forEach((template) => {
      let score = 0;
      const searchableText = `${template.title} ${template.content} ${template.tags.join(" ")}`.toLowerCase();

      inquiryWords.forEach((word) => {
        if (word.length > 2 && searchableText.includes(word)) {
          score += 1;
        }
      });

      // Bonus for tag matches
      template.tags.forEach((tag) => {
        if (inquiry.toLowerCase().includes(tag.toLowerCase())) {
          score += 3;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    });

    if (bestMatch && bestScore > 0) {
      setSuggestedTemplate(bestMatch);
      toast.success("Found a matching template!");
    } else {
      setSuggestedTemplate(null);
      toast.info("No matching template found. Try different keywords.");
    }
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

  const handleMarkOutdated = async (template: ResponseTemplate) => {
    if (!user) return;
    
    // Get user's full name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .single();
    
    const staffName = profile?.full_name || profile?.email || "Unknown";
    const now = new Date().toISOString();
    
    // Update template with outdated info
    const { error: updateError } = await updateTable(
      "response_templates",
      {
        is_outdated: true,
        marked_outdated_by: user.id,
        marked_outdated_by_name: staffName,
        marked_outdated_at: now,
      },
      [eq("id", template.id)]
    );

    if (updateError) {
      toast.error("Failed to mark template as outdated");
      return;
    }

    // Create notification for managers
    const { error: notifyError } = await insertInto("template_outdated_notifications", {
      template_id: template.id,
      marked_by_user_id: user.id,
      marked_by_name: staffName,
    });

    if (notifyError) {
      console.error("Failed to create notification:", notifyError);
    }

    toast.success("Template marked as outdated. Manager has been notified.");
    fetchTemplates();
  };

  const handleClearOutdated = async (template: ResponseTemplate) => {
    const { error } = await updateTable(
      "response_templates",
      {
        is_outdated: false,
        marked_outdated_by: null,
        marked_outdated_by_name: null,
        marked_outdated_at: null,
      },
      [eq("id", template.id)]
    );

    if (error) {
      toast.error("Failed to clear outdated status");
    } else {
      toast.success("Outdated status cleared");
      fetchTemplates();
    }
  };

  if (loading) {
    return (
      <Card className="rounded-none border flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-none border flex-1 flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider font-normal">
            Response Templates
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
        <CardContent className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="browse" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="browse" className="rounded-none text-xs">
                Browse Templates
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-none text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Suggester
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-4 space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 rounded-none text-xs"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] rounded-none text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                {Object.keys(groupedTemplates).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {canEdit && editMode ? "No templates yet. Click Add to create one." : "No templates found"}
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                      <AccordionItem key={category} value={category} className="border-b">
                        <AccordionTrigger className="text-xs uppercase tracking-wider hover:no-underline py-3">
                          {category}
                          <Badge variant="secondary" className="ml-2 rounded-none text-xs">
                            {categoryTemplates.length}
                          </Badge>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {categoryTemplates.map((template) => (
                              <div
                                key={template.id}
                                className={`border p-3 transition-colors ${
                                  template.is_outdated 
                                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" 
                                    : template.is_active 
                                      ? "hover:bg-muted/50" 
                                      : "opacity-50 bg-muted/20"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-xs font-medium">{template.title}</h4>
                                      {!template.is_active && (
                                        <Badge variant="secondary" className="rounded-none text-xs">
                                          Inactive
                                        </Badge>
                                      )}
                                      {template.is_outdated && (
                                        <Badge variant="outline" className="rounded-none text-xs border-amber-500 text-amber-600">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Outdated
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {template.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="text-[10px] rounded-none"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {editMode && canEdit ? (
                                      <>
                                        {!template.is_outdated ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMarkOutdated(template)}
                                            className="h-8 rounded-none text-amber-600"
                                            title="Mark as outdated"
                                          >
                                            <AlertTriangle className="h-3 w-3" />
                                          </Button>
                                        ) : isAdminOrManager && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleClearOutdated(template)}
                                            className="h-8 rounded-none text-green-600"
                                            title="Clear outdated status"
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                        )}
                                        {isAdminOrManager && (
                                          <Switch
                                            checked={template.is_active}
                                            onCheckedChange={() => handleToggleActive(template)}
                                          />
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenDialog(template)}
                                          className="h-8 rounded-none"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        {isAdminOrManager && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(template)}
                                            className="h-8 rounded-none text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(template)}
                                        className="h-8 rounded-none"
                                      >
                                        {copiedId === template.id ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Outdated warning message */}
                                {template.is_outdated && template.marked_outdated_by_name && template.marked_outdated_at && (
                                  <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200">
                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                    Marked out of date by {template.marked_outdated_by_name} on {format(new Date(template.marked_outdated_at), "MMM d, yyyy")}
                                  </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                  {template.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="mt-4 space-y-4 flex-1">
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">
                  Paste the member's inquiry below
                </label>
                <Textarea
                  placeholder="e.g., Hi, I'm interested in learning about your membership options and pricing..."
                  value={inquiry}
                  onChange={(e) => setInquiry(e.target.value)}
                  className="min-h-[120px] rounded-none text-xs"
                />
                <Button
                  onClick={findBestTemplate}
                  className="w-full rounded-none"
                  disabled={!inquiry.trim()}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Best Template
                </Button>
              </div>

              {suggestedTemplate && (
                <div className="border p-4 bg-primary/5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge className="rounded-none text-xs mb-2">Suggested</Badge>
                      <h4 className="text-xs font-medium">{suggestedTemplate.title}</h4>
                      <p className="text-xs text-muted-foreground">{suggestedTemplate.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(suggestedTemplate)}
                      className="h-8 rounded-none"
                    >
                      {copiedId === suggestedTemplate.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs mt-3 whitespace-pre-wrap border-t pt-3">
                    {suggestedTemplate.content}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
