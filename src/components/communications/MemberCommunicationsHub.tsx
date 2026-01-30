import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Mail,
  StickyNote,
  Phone,
  Plus,
  FileText,
  Trash2,
  Edit,
  Loader2,
  Users,
} from "lucide-react";
import { useClients, Member } from "@/hooks/useClients";
import {
  useMemberTimeline,
  useEmailTemplates,
  useDeleteEmailTemplate,
  useAddCommunication,
} from "@/hooks/useMemberCommunications";
import { useAuth } from "@/hooks/useAuth";
import { MemberTimeline } from "./MemberTimeline";
import { EmailComposeDialog } from "./EmailComposeDialog";
import { EmailTemplateDialog } from "./EmailTemplateDialog";
import { MemberNoteDialog } from "@/components/members/MemberNoteDialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailTemplate } from "@/hooks/useMemberCommunications";

const stageColors: Record<string, string> = {
  lead: "bg-zinc-100 text-zinc-800",
  prospect: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  churned: "bg-red-100 text-red-800",
};

export default function MemberCommunicationsHub() {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [callNotes, setCallNotes] = useState("");

  const { user } = useAuth();
  const { data: members = [], isLoading: membersLoading } = useClients({ search });
  const { data: timeline = [], isLoading: timelineLoading } = useMemberTimeline(
    selectedMember?.id || ""
  );
  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplates();
  const deleteTemplate = useDeleteEmailTemplate();
  const addCommunication = useAddCommunication();

  const handleLogCall = async () => {
    if (!selectedMember || !user || !callNotes.trim()) return;

    await addCommunication.mutateAsync({
      memberId: selectedMember.id,
      userId: user.id,
      communicationType: "call",
      content: callNotes.trim(),
    });

    setCallNotes("");
    setCallLogOpen(false);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (deleteTemplateId) {
      await deleteTemplate.mutateAsync(deleteTemplateId);
      setDeleteTemplateId(null);
    }
  };

  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
  };

  return (
    <DashboardLayout title="Member Communications">
      <div className="space-y-8">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Member List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Select Member</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {membersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : members.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No members found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {members.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                              selectedMember?.id === member.id
                                ? "bg-muted"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {member.client_name || "No name"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.client_email}
                                </p>
                              </div>
                              {member.lifecycle_stage && (
                                <Badge
                                  variant="secondary"
                                  className={`shrink-0 text-[10px] ${
                                    stageColors[member.lifecycle_stage] || ""
                                  }`}
                                >
                                  {member.lifecycle_stage.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Member Details & Timeline */}
              <Card className="lg:col-span-2">
                {selectedMember ? (
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>
                            {selectedMember.client_name || "No name"}
                          </CardTitle>
                          <CardDescription>
                            {selectedMember.client_email}
                            {selectedMember.client_phone && ` • ${selectedMember.client_phone}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCallLogOpen(true)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Log Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNoteDialogOpen(true)}
                          >
                            <StickyNote className="h-4 w-4 mr-1" />
                            Add Note
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setEmailDialogOpen(true)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">
                          Communication Timeline
                        </h4>
                        <MemberTimeline
                          items={timeline}
                          isLoading={timelineLoading}
                        />
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Select a member to view their communications
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Templates</CardTitle>
                    <CardDescription>
                      Create reusable email templates for consistent
                      communications
                    </CardDescription>
                  </div>
                  <Button onClick={() => setTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No email templates yet
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setTemplateDialogOpen(true)}
                    >
                      Create your first template
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            {template.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {template.subject}
                          </TableCell>
                          <TableCell>
                            {template.category && (
                              <Badge variant="secondary">
                                {template.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTemplateId(template.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EmailComposeDialog
        member={selectedMember}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />

      <MemberNoteDialog
        member={selectedMember}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      />

      <EmailTemplateDialog
        template={editingTemplate}
        open={templateDialogOpen}
        onOpenChange={handleCloseTemplateDialog}
      />

      {/* Call Log Dialog */}
      <Dialog open={callLogOpen} onOpenChange={setCallLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Phone Call</DialogTitle>
            <DialogDescription>
              Record notes from your call with{" "}
              {selectedMember?.client_name || selectedMember?.client_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Call notes..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallLogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLogCall}
              disabled={!callNotes.trim() || addCommunication.isPending}
            >
              {addCommunication.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={() => setDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              email template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
