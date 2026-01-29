import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { selectFrom, eq } from "@/lib/dataApi";

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
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewDocument, setPreviewDocument] = useState<StaffDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await selectFrom<StaffDocument>("staff_documents", {
      filters: [eq("is_active", true)],
      order: { column: "title", ascending: true },
    });

    if (!error && data) {
      setDocuments(data);
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
    if (bytes === 0) return "—";
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

  if (loading) {
    return (
      <Card className="rounded-none border">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider font-normal">
            Staff Documents
          </CardTitle>
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
    </>
  );
}
