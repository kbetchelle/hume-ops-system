import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
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
import { Search, Copy, Sparkles, Check, Plus, Pencil, Trash2, Settings, AlertTriangle, GripVertical, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { selectFrom, insertInto, updateTable, deleteFrom, eq, inArray } from "@/lib/dataApi";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  category_order: number;
  updated_at: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
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

// TemplateList component for rendering templates within a category
interface TemplateListProps {
  templates: ResponseTemplate[];
  editMode: boolean;
  canEdit: boolean;
  isAdminOrManager: boolean;
  copiedId: string | null;
  handleCopy: (template: ResponseTemplate) => void;
  handleOpenDialog: (template: ResponseTemplate) => void;
  handleMarkOutdated: (template: ResponseTemplate) => void;
  handleClearOutdated: (template: ResponseTemplate) => void;
  handleToggleActive: (template: ResponseTemplate) => void;
  handleDelete: (template: ResponseTemplate) => void;
}

function TemplateList({
  templates,
  editMode,
  canEdit,
  isAdminOrManager,
  copiedId,
  handleCopy,
  handleOpenDialog,
  handleMarkOutdated,
  handleClearOutdated,
  handleToggleActive,
  handleDelete,
}: TemplateListProps) {
  return (
    <div className="space-y-3 pt-2">
      {templates.map((template) => (
        <div
          key={template.id}
          className={`border p-3 transition-colors ${
            template.is_outdated 
              ? "border-warning bg-warning/10" 
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
                  <Badge variant="outline" className="rounded-none text-xs border-warning text-warning">
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
                      className="h-8 rounded-none text-warning"
                      title="Mark as outdated"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearOutdated(template)}
                      className="h-8 rounded-none text-primary"
                      title="Undo outdated status"
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
            <div className="mt-2 p-2 bg-warning/10 border border-warning/30 text-xs text-warning-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Marked out of date by {template.marked_outdated_by_name} on {format(new Date(template.marked_outdated_at), "MMM d, yyyy")}
            </div>
          )}
          
          <div 
            className="text-xs text-muted-foreground mt-2 prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
        </div>
      ))}
    </div>
  );
}

// SortableCategoryItem component for drag-and-drop category reordering
interface SortableCategoryItemProps extends Omit<TemplateListProps, 'templates'> {
  category: string;
  categoryTemplates: ResponseTemplate[];
  onRenameCategory: (oldName: string, newName: string) => void;
}

function SortableCategoryItem({
  category,
  categoryTemplates,
  editMode,
  canEdit,
  isAdminOrManager,
  copiedId,
  handleCopy,
  handleOpenDialog,
  handleMarkOutdated,
  handleClearOutdated,
  handleToggleActive,
  handleDelete,
  onRenameCategory,
}: SortableCategoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const handleSaveRename = () => {
    if (editedName.trim() && editedName !== category) {
      onRenameCategory(category, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setEditedName(category);
      setIsEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={category} className="border-b">
        <div className="flex items-center">
          {editMode && isAdminOrManager && (
            <button
              className="p-2 cursor-grab hover:bg-muted/50 touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {isEditing && isAdminOrManager ? (
            <div className="flex items-center gap-2 py-2 flex-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                className="rounded-none text-xs uppercase tracking-wider h-8"
                autoFocus
              />
            </div>
          ) : (
            <AccordionTrigger className="text-xs uppercase tracking-wider hover:no-underline py-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-normal">
                  ({categoryTemplates.length})
                </span>
                <span>{category}</span>
              </div>
              {editMode && isAdminOrManager && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="ml-2 p-1 hover:bg-muted/50"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </AccordionTrigger>
          )}
        </div>
        <AccordionContent>
          <TemplateList 
            templates={categoryTemplates}
            editMode={editMode}
            canEdit={canEdit}
            isAdminOrManager={isAdminOrManager}
            copiedId={copiedId}
            handleCopy={handleCopy}
            handleOpenDialog={handleOpenDialog}
            handleMarkOutdated={handleMarkOutdated}
            handleClearOutdated={handleClearOutdated}
            handleToggleActive={handleToggleActive}
            handleDelete={handleDelete}
          />
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

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
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    content: "",
    tags: "",
  });

  const { activeRole } = useActiveRole();
  const { user } = useAuth();
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  
  // Any authenticated user can edit templates
  const canEdit = !!user;
  // Only admins/managers can delete or toggle active status
  const isAdminOrManager = activeRole === "admin" || activeRole === "manager";

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    // Fetch active templates for users
    const { data, error } = await selectFrom<ResponseTemplate>("response_templates", {
      filters: [eq("is_active", true)],
      order: [{ column: "category_order", ascending: true }, { column: "category", ascending: true }],
    });

    if (!error && data) {
      setTemplates(data);
    }

    // Fetch all templates for editing mode
    const { data: allData } = await selectFrom<ResponseTemplate>("response_templates", {
      order: [{ column: "category_order", ascending: true }, { column: "category", ascending: true }],
    });
    if (allData) {
      setAllTemplates(allData);
      // Build category order from templates
      const orderedCats: string[] = [];
      const catOrderMap = new Map<string, number>();
      allData.forEach((t) => {
        if (!catOrderMap.has(t.category)) {
          catOrderMap.set(t.category, t.category_order || 0);
        }
      });
      const sortedCats = [...catOrderMap.entries()].sort((a, b) => a[1] - b[1]);
      sortedCats.forEach(([cat]) => orderedCats.push(cat));
      setCategoryOrder(orderedCats);
    }

    setLoading(false);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map((t) => t.category))];
    // Sort by category_order
    return cats.sort((a, b) => {
      const orderA = categoryOrder.indexOf(a);
      const orderB = categoryOrder.indexOf(b);
      if (orderA === -1 && orderB === -1) return a.localeCompare(b);
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    });
  }, [templates, categoryOrder]);

  // All available categories (merge hardcoded + database categories)
  const allAvailableCategories = useMemo(() => {
    const dbCategories = [...new Set(allTemplates.map(t => t.category))];
    const merged = [...new Set([...CATEGORIES, ...dbCategories])];
    return merged.sort((a, b) => a.localeCompare(b));
  }, [allTemplates]);

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

  // Get ordered category list for display
  const orderedCategoryList = useMemo(() => {
    const cats = Object.keys(groupedTemplates);
    return cats.sort((a, b) => {
      const orderA = categoryOrder.indexOf(a);
      const orderB = categoryOrder.indexOf(b);
      if (orderA === -1 && orderB === -1) return a.localeCompare(b);
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    });
  }, [groupedTemplates, categoryOrder]);

  // Handle drag end for category reordering
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = orderedCategoryList.indexOf(active.id as string);
    const newIndex = orderedCategoryList.indexOf(over.id as string);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = arrayMove(orderedCategoryList, oldIndex, newIndex);
    setCategoryOrder(newOrder);
    
    // Update all templates with new category_order values
    const updates: Promise<unknown>[] = [];
    newOrder.forEach((cat, index) => {
      const templatesInCat = allTemplates.filter(t => t.category === cat);
      const templateIds = templatesInCat.map(t => t.id);
      if (templateIds.length > 0) {
        updates.push(
          updateTable("response_templates", { category_order: index }, [inArray("id", templateIds)])
        );
      }
    });
    
    await Promise.all(updates);
    toast.success("Category order updated");
  }, [orderedCategoryList, allTemplates]);

  // Handle category rename
  const handleRenameCategory = useCallback(async (oldName: string, newName: string) => {
    if (oldName === newName) return;
    
    // Update all templates in this category
    const templatesInCat = allTemplates.filter(t => t.category === oldName);
    const templateIds = templatesInCat.map(t => t.id);
    
    if (templateIds.length > 0) {
      const { error } = await updateTable(
        "response_templates",
        { category: newName },
        [inArray("id", templateIds)]
      );
      
      if (error) {
        toast.error("Failed to rename category");
        return;
      }
    }
    
    // Update local category order
    setCategoryOrder(prev => prev.map(c => c === oldName ? newName : c));
    
    toast.success("Category renamed");
    fetchTemplates();
  }, [allTemplates]);

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    
    // Check if category already exists
    const existingCategories = [...new Set(allTemplates.map(t => t.category.toLowerCase()))];
    if (existingCategories.includes(newCategoryName.trim().toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    
    // Create a placeholder template in the new category
    const { error } = await insertInto("response_templates", {
      category: newCategoryName.trim(),
      title: "New Template",
      content: "Add your template content here...",
      tags: [],
      is_active: true,
      category_order: categoryOrder.length,
    });
    
    if (error) {
      toast.error("Failed to create category");
      return;
    }
    
    toast.success("Category created");
    setNewCategoryName("");
    setIsCategoryDialogOpen(false);
    fetchTemplates();
  };

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

    // Get user's profile for updated_by_name
    let updatedByName: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();
      updatedByName = profile?.full_name || profile?.email || null;
    }

    if (editingTemplate) {
      const { error } = await updateTable(
        "response_templates",
        {
          category: formData.category,
          title: formData.title,
          content: formData.content,
          tags: tagsArray,
          updated_by: user?.id || null,
          updated_by_name: updatedByName,
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
        updated_by: user?.id || null,
        updated_by_name: updatedByName,
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
              {editMode && isAdminOrManager && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none h-8"
                  onClick={() => setIsCategoryDialogOpen(true)}
                >
                  <FolderPlus className="h-3 w-3 mr-1" />
                  Category
                </Button>
              )}
              {editMode && (
                <Button
                  size="sm"
                  className="rounded-none h-8"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Template
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
                ) : editMode && isAdminOrManager ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext
                      items={orderedCategoryList}
                      strategy={verticalListSortingStrategy}
                    >
                      <Accordion type="single" collapsible className="w-full">
                        {orderedCategoryList.map((category) => {
                          const categoryTemplates = groupedTemplates[category];
                          if (!categoryTemplates) return null;
                          return (
                            <SortableCategoryItem
                              key={category}
                              category={category}
                              categoryTemplates={categoryTemplates}
                              editMode={editMode}
                              canEdit={canEdit}
                              isAdminOrManager={isAdminOrManager}
                              copiedId={copiedId}
                              handleCopy={handleCopy}
                              handleOpenDialog={handleOpenDialog}
                              handleMarkOutdated={handleMarkOutdated}
                              handleClearOutdated={handleClearOutdated}
                              handleToggleActive={handleToggleActive}
                              handleDelete={handleDelete}
                              onRenameCategory={handleRenameCategory}
                            />
                          );
                        })}
                      </Accordion>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {orderedCategoryList.map((category) => {
                      const categoryTemplates = groupedTemplates[category];
                      if (!categoryTemplates) return null;
                      return (
                        <AccordionItem key={category} value={category} className="border-b">
                          <AccordionTrigger className="text-xs uppercase tracking-wider hover:no-underline py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-normal">
                                ({categoryTemplates.length})
                              </span>
                              <span>{category}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <TemplateList 
                              templates={categoryTemplates}
                              editMode={editMode}
                              canEdit={canEdit}
                              isAdminOrManager={isAdminOrManager}
                              copiedId={copiedId}
                              handleCopy={handleCopy}
                              handleOpenDialog={handleOpenDialog}
                              handleMarkOutdated={handleMarkOutdated}
                              handleClearOutdated={handleClearOutdated}
                              handleToggleActive={handleToggleActive}
                              handleDelete={handleDelete}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
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
                  <div 
                    className="text-xs mt-3 border-t pt-3 prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
                    dangerouslySetInnerHTML={{ __html: suggestedTemplate.content }}
                  />
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
                  <SelectContent className="rounded-none max-h-[300px]">
                    {allAvailableCategories.map((cat) => (
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
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Template content..."
                minHeight="200px"
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

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Add New Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Category Name *</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Special Offers"
                className="rounded-none text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
              />
              <p className="text-[10px] text-muted-foreground">
                A placeholder template will be created in this category.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewCategoryName("");
                setIsCategoryDialogOpen(false);
              }}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} className="rounded-none">
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
