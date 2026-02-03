import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Search,
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  File,
  Download,
  Eye,
  Calendar,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useActiveRole } from "@/hooks/useActiveRole";
import { toast } from "sonner";

interface StaffDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_type: string | null;
  file_size: number;
  target_roles: string[];
  is_active: boolean;
  uploaded_by: string | null;
  uploaded_by_id: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "Training Materials",
  "Procedures",
  "Forms",
  "Policies",
  "Reference",
];

export function StaffDocumentsView() {
  const { user } = useAuthContext();
  const { activeRole } = useActiveRole();
  const canManage = activeRole === "admin" || activeRole === "manager";

  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewDocument, setPreviewDocument] = useState<StaffDocument | null>(null);
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "Reference",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_documents")
      .select("*")
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (!error && data) {
      setDocuments(data as StaffDocument[]);
    }
    setLoading(false);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, categoryFilter]);

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, StaffDocument[]> = {};
    filteredDocuments.forEach((doc) => {
      if (!groups[doc.category]) {
        groups[doc.category] = [];
      }
      groups[doc.category].push(doc);
    });
    return groups;
  }, [filteredDocuments]);

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />;
    
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-destructive" />;
    if (fileType.includes("image")) return <FileImage className="h-4 w-4 text-primary" />;
    if (fileType.includes("video")) return <FileVideo className="h-4 w-4 text-accent-foreground" />;
    if (fileType.includes("sheet") || fileType.includes("excel"))
      return <FileSpreadsheet className="h-4 w-4 text-primary" />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileText className="h-4 w-4 text-primary" />;
    
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const canPreview = (fileType: string | null) => {
    if (!fileType) return false;
    return fileType.includes("pdf") || fileType.includes("image");
  };

  const handleDownload = (doc: StaffDocument) => {
    window.open(doc.file_url, "_blank");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadForm.title) {
        setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title || !user) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}-${uploadForm.title.replace(/\s+/g, "_")}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("staff-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("staff-documents")
        .getPublicUrl(filePath);

      // Create document record
      const { error: insertError } = await supabase
        .from("staff_documents")
        .insert({
          title: uploadForm.title,
          description: uploadForm.description || null,
          category: uploadForm.category,
          file_url: urlData.publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by_id: user.id,
          is_active: true,
        });

      if (insertError) {
        // Clean up uploaded file if insert fails
        await supabase.storage.from("staff-documents").remove([filePath]);
        throw insertError;
      }

      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchDocuments();
    } catch (error: any) {
      toast.error("Failed to upload document: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: StaffDocument) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    try {
      // Extract file path from URL
      const urlParts = doc.file_url.split("/staff-documents/");
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from("staff-documents").remove([filePath]);
      }

      const { error } = await supabase
        .from("staff_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast.success("Document deleted");
      fetchDocuments();
    } catch (error: any) {
      toast.error("Failed to delete document: " + error.message);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({ title: "", description: "", category: "Reference" });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <Card className="rounded-none border flex flex-col flex-1 min-h-0">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
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
            Staff Documents
          </CardTitle>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 rounded-none text-xs"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] rounded-none text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {Object.keys(groupedDocuments).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No documents found
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocuments).map(([category, categoryDocs]) => (
                <div key={category}>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    {category}
                    <Badge variant="secondary" className="rounded-none text-xs">
                      {categoryDocs.length}
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {categoryDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="border p-3 hover:bg-muted/50 transition-colors flex items-start gap-3"
                      >
                        <div className="mt-0.5">{getFileIcon(doc.file_type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(doc.updated_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {canPreview(doc.file_type) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-none"
                              onClick={() => setPreviewDocument(doc)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-none"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-none text-destructive hover:text-destructive"
                              onClick={() => handleDelete(doc)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="rounded-none max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              {previewDocument?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-auto">
            {previewDocument?.file_type?.includes("pdf") ? (
              <iframe
                src={previewDocument.file_url}
                className="w-full h-full border-0"
                title={previewDocument.title}
              />
            ) : previewDocument?.file_type?.includes("image") ? (
              <img
                src={previewDocument.file_url}
                alt={previewDocument.title}
                className="max-w-full h-auto"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">
                  Preview not available for this file type.{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => handleDownload(previewDocument!)}
                  >
                    Download instead
                  </Button>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider font-normal">
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider">File</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="mt-1 block w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:bg-muted file:text-foreground hover:file:bg-muted/80"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Title</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-none text-xs mt-1"
                placeholder="Document title"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Description</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                className="rounded-none text-xs mt-1 resize-none"
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Category</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(val) => setUploadForm(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="rounded-none text-xs mt-1">
                  <SelectValue />
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
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-none text-xs"
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !uploadForm.title}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
