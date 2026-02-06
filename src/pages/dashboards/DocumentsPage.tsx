import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStaffDocuments } from "@/hooks/useStaffDocuments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

export default function DocumentsPage() {
  const { user } = useAuthContext();
  const { data: roles = [] } = useUserRoles(user?.id);
  const userRoles = roles.map((r) => r.role);
  const { data: documents = [], isLoading } = useStaffDocuments(userRoles);

  return (
    <DashboardLayout title="Documents">
      <div className="p-4 md:p-8 max-w-3xl">
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-6">
          Staff Documents
        </h2>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : documents.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No documents available.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    {doc.title}
                  </CardTitle>
                  {doc.description && (
                    <CardDescription className="text-xs">{doc.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    asChild
                  >
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Open
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
