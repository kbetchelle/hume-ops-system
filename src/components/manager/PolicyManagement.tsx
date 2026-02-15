import { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  FolderOpen,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePolicies,
  usePolicyCategories,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type ClubPolicy,
  type PolicyCategory,
  type CreatePolicyInput,
  type UpdatePolicyInput,
} from "@/hooks/usePolicies";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function PolicyCreateEditDialog({
  open,
  onOpenChange,
  policy,
  categories,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: ClubPolicy | null;
  categories: PolicyCategory[];
  onDelete?: (id: string) => void;
}) {
  const isEditing = !!policy;
  const [content, setContent] = useState(policy?.content ?? "");
  const [categoryName, setCategoryName] = useState<string | null>(policy?.category ?? null);
  const [tags, setTags] = useState<string[]>(policy?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const createCategoryMutation = useCreateCategory();

  useEffect(() => {
    if (open && policy) {
      setContent(policy.content);
      setCategoryName(policy.category);
      setTags(policy.tags ?? []);
    } else if (open && !policy) {
      setContent("");
      setCategoryName(null);
      setTags([]);
    }
  }, [open, policy]);

  const reset = () => {
    setContent("");
    setCategoryName(null);
    setTags([]);
    setTagInput("");
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCreateNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;
    
    try {
      const newCategory = await createCategoryMutation.mutateAsync({
        name: trimmedName,
      });
      setCategoryName(newCategory.name);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      setShowNewCategoryInput(true);
      setCategoryName(null);
    } else if (value === "none") {
      setCategoryName(null);
      setShowNewCategoryInput(false);
    } else {
      setCategoryName(value);
      setShowNewCategoryInput(false);
    }
  };

  const handleSubmit = async () => {
    // Check if content has meaningful text (strip HTML tags for validation)
    const textOnly = content.replace(/<[^>]*>/g, '').trim();
    if (!textOnly) return;
    
    const input: CreatePolicyInput = {
      content: content,
      category: categoryName,
      tags: tags,
    };
    
    if (isEditing && policy) {
      await updateMutation.mutateAsync({ ...input, id: policy.id });
    } else {
      await createMutation.mutateAsync(input);
    }
    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || createCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl uppercase tracking-widest">
            {isEditing ? "EDIT POLICY SECTION" : "CREATE POLICY SECTION"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="policy-content">Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Policy section content..."
              minHeight="200px"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Category</Label>
            {showNewCategoryInput ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new category name..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateNewCategory();
                    }
                  }}
                />
                <Button onClick={handleCreateNewCategory} disabled={!newCategoryName.trim() || createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName("");
                }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Select value={categoryName ?? "none"} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      Create new category
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags (for search only, not displayed to staff)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tag..."
              />
              <Button type="button" variant="outline" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex !justify-between">
          {isEditing && policy && onDelete ? (
            <Button variant="destructive" size="sm" onClick={() => { onDelete(policy.id); handleClose(); }}>
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Policy Section
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.replace(/<[^>]*>/g, '').trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : "Create"} Policy Section
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryEditDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: PolicyCategory | null;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");

  const updateMutation = useUpdateCategory();

  useEffect(() => {
    if (open && category) {
      setName(category.name);
      setDescription(category.description ?? "");
    }
  }, [open, category]);

  const reset = () => {
    setName("");
    setDescription("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category) return;
    await updateMutation.mutateAsync({
      id: category.id,
      name: name.trim(),
      description: description.trim() || null,
    });
    handleClose();
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Input
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PolicyManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ClubPolicy | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PolicyCategory | null>(null);
  const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const { data: policies, isLoading: policiesLoading } = usePolicies(false);
  const { data: categories, isLoading: categoriesLoading } = usePolicyCategories(false);
  const deletePolicyMutation = useDeletePolicy();
  const deleteCategoryMutation = useDeleteCategory();

  const activeCategories = useMemo(() => (categories ?? []).filter((c) => c.is_active), [categories]);

  const filteredPolicies = useMemo(() => {
    let list = policies ?? [];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.content ?? "").toLowerCase().includes(term) ||
          (p.category ?? "").toLowerCase().includes(term) ||
          (p.tags ?? []).some((tag) => tag.toLowerCase().includes(term))
      );
    }
    return list;
  }, [policies, searchTerm]);

  const policiesByCategory = useMemo(() => {
    const grouped = filteredPolicies.reduce(
      (acc, policy) => {
        const cat = policy.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(policy);
        return acc;
      },
      {} as Record<string, ClubPolicy[]>
    );
    return grouped;
  }, [filteredPolicies]);

  const handleEditPolicy = (policy: ClubPolicy) => {
    setEditingPolicy(policy);
    setPolicyDialogOpen(true);
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyDialogOpen(true);
  };

  const handleEditCategory = (category: PolicyCategory) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeletePolicy = async () => {
    if (deletePolicyId) {
      await deletePolicyMutation.mutateAsync(deletePolicyId);
      setDeletePolicyId(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (deleteCategoryId) {
      await deleteCategoryMutation.mutateAsync(deleteCategoryId);
      setDeleteCategoryId(null);
    }
  };

  const getCategoryInfo = (categoryName: string) => {
    return activeCategories.find((c) => c.name === categoryName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Policy Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage policy sections organized by category.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies and tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreatePolicy}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy Section
        </Button>
      </div>

      {policiesLoading || categoriesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(policiesByCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No policies match your search." : "No policies found."}
            </p>
            <Button variant="outline" className="mt-4" onClick={handleCreatePolicy}>
              Create your first policy section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.entries(policiesByCategory).map(([categoryName, categoryPolicies]) =>
            categoryPolicies.map((policy) => (
              <Card
                key={policy.id}
                className={cn("cursor-pointer hover:border-primary/50 transition-colors", !policy.is_active && "opacity-60")}
                onClick={() => handleEditPolicy(policy)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {policy.category || "Uncategorized"}
                      </span>
                      {!policy.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {(policy.tags ?? []).length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {(policy.tags ?? []).length} tag{(policy.tags ?? []).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div 
                      className="text-sm text-foreground prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: policy.content }}
                    />
                  </div>
                  <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <PolicyCreateEditDialog
        open={policyDialogOpen}
        onOpenChange={setPolicyDialogOpen}
        policy={editingPolicy}
        categories={activeCategories}
        onDelete={(id) => setDeletePolicyId(id)}
      />
      <CategoryEditDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
      />

      <AlertDialog open={!!deletePolicyId} onOpenChange={() => setDeletePolicyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete policy section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the policy section. Staff will no longer see it. You can reactivate it later by editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePolicy} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the category. Policies in this category will keep their category name but the category will no longer appear in management.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
