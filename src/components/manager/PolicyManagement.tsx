import { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
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
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/hooks/usePolicies";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function PolicyCreateEditDialog({
  open,
  onOpenChange,
  policy,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: ClubPolicy | null;
  categories: PolicyCategory[];
}) {
  const isEditing = !!policy;
  const [title, setTitle] = useState(policy?.title ?? "");
  const [content, setContent] = useState(policy?.content ?? "");
  const [categoryName, setCategoryName] = useState<string | null>(policy?.category ?? null);
  const [sortOrder, setSortOrder] = useState(String(policy?.sort_order ?? 0));

  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();

  const reset = () => {
    setTitle(policy?.title ?? "");
    setContent(policy?.content ?? "");
    setCategoryName(policy?.category ?? null);
    setSortOrder(String(policy?.sort_order ?? 0));
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    const input: CreatePolicyInput = {
      title: title.trim(),
      content: content.trim(),
      category: categoryName,
      sort_order: parseInt(sortOrder, 10) || 0,
    };
    if (isEditing && policy) {
      await updateMutation.mutateAsync({ ...input, id: policy.id });
    } else {
      await createMutation.mutateAsync(input);
    }
    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xs uppercase tracking-widest">
            {isEditing ? "Edit Policy" : "Create Policy"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="policy-title">Title</Label>
            <Input
              id="policy-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Policy title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy-content">Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Policy content..."
              minHeight="200px"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryName ?? "none"} onValueChange={(v) => setCategoryName(v === "none" ? null : v)}>
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
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy-sort">Sort order</Label>
            <Input
              id="policy-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Update" : "Create"} Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryCreateEditDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: PolicyCategory | null;
}) {
  const isEditing = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setSortOrder(String(category?.sort_order ?? 0));
    }
  }, [open, category]);

  const reset = () => {
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setSortOrder(String(category?.sort_order ?? 0));
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (isEditing && category) {
      await updateMutation.mutateAsync({
        id: category.id,
        name: name.trim(),
        description: description.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 0,
      });
    } else {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 0,
      });
    }
    handleClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the category details." : "Add a new policy category."}
          </DialogDescription>
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
          <div className="space-y-2">
            <Label htmlFor="cat-sort">Sort order</Label>
            <Input
              id="cat-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Update" : "Create"} Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PolicyManagement() {
  const [activeTab, setActiveTab] = useState<"policies" | "categories">("policies");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
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
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          (p.content ?? "").toLowerCase().includes(term) ||
          (p.category ?? "").toLowerCase().includes(term)
      );
    }
    return list;
  }, [policies, categoryFilter, searchTerm]);

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

  const handleCreateCategory = () => {
    setEditingCategory(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Policy Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage policies and categories for staff.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "policies" | "categories")}>
        <TabsList>
          <TabsTrigger value="policies" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreatePolicy}>
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Button>
          </div>

          {policiesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPolicies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No policies found.</p>
                <Button variant="outline" className="mt-4" onClick={handleCreatePolicy}>
                  Create your first policy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPolicies.map((policy) => (
                <Card key={policy.id} className={cn(!policy.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{policy.title}</h3>
                          {!policy.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {policy.category && (
                            <Badge variant="outline">{policy.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {policy.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Updated {format(new Date(policy.updated_at), "MMM d, yyyy")}
                          {policy.last_updated_by && ` by ${policy.last_updated_by}`}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPolicy(policy)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {policy.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletePolicyId(policy.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (categories ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No categories yet.</p>
                <Button variant="outline" className="mt-4" onClick={handleCreateCategory}>
                  Create your first category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(categories ?? []).map((category) => (
                <Card key={category.id} className={cn(!category.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{category.name}</h3>
                          {!category.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Sort order: {category.sort_order}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {category.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteCategoryId(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PolicyCreateEditDialog
        open={policyDialogOpen}
        onOpenChange={setPolicyDialogOpen}
        policy={editingPolicy}
        categories={activeCategories}
      />
      <CategoryCreateEditDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
      />

      <AlertDialog open={!!deletePolicyId} onOpenChange={() => setDeletePolicyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the policy. Staff will no longer see it. You can reactivate it later by editing.
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
              This will deactivate the category. Policies in this category will keep their category name but the category will no longer appear in filters.
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
