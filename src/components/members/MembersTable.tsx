import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Search, Plus, RefreshCw, Loader2, MoreVertical, UserPlus, UserMinus, User } from "lucide-react";
import { Member, useClients, useSyncClients } from "@/hooks/useClients";
import { useTrainerAssignments, TrainerAssignment } from "@/hooks/useTrainerAssignments";
import { MemberNoteDialog } from "./MemberNoteDialog";
import { TrainerAssignmentDialog } from "@/components/trainers/TrainerAssignmentDialog";
import { format } from "date-fns";

const stageColors: Record<string, string> = {
  lead: "bg-muted text-muted-foreground",
  prospect: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  churned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface MembersTableProps {
  showSyncButton?: boolean;
  showTrainerAssignment?: boolean;
}

export function MembersTable({ 
  showSyncButton = false,
  showTrainerAssignment = false,
}: MembersTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [assignMember, setAssignMember] = useState<Member | null>(null);
  const [unassignDialog, setUnassignDialog] = useState<{
    assignment: TrainerAssignment;
    memberName: string;
  } | null>(null);

  const { data: members = [], isLoading, error } = useClients({
    search: search.length >= 2 ? search : undefined,
    lifecycleStage: stageFilter !== "all" ? stageFilter : undefined,
  });

  const syncMutation = useSyncClients();
  
  const {
    assignments,
    trainers,
    assignMember: handleAssign,
    unassignMember,
    isAssigning,
    isUnassigning,
  } = useTrainerAssignments();

  // Create a map of member ID to assignment for quick lookup
  const memberAssignmentMap = new Map<string, TrainerAssignment>();
  assignments.forEach((a) => {
    memberAssignmentMap.set(a.member_id, a);
  });

  // Create a map of trainer ID to trainer info
  const trainerMap = new Map(trainers.map((t) => [t.user_id, t]));

  // Filter members by trainer if selected
  const filteredMembers = members.filter((member) => {
    if (trainerFilter === "all") return true;
    if (trainerFilter === "unassigned") {
      return !memberAssignmentMap.has(member.id);
    }
    const assignment = memberAssignmentMap.get(member.id);
    return assignment?.trainer_user_id === trainerFilter;
  });

  const getInitials = (member: Member) => {
    if (member.client_name) {
      const parts = member.client_name.split(" ");
      return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase() || "?";
    }
    return member.client_email[0].toUpperCase();
  };

  const getTrainerName = (trainerId: string) => {
    const trainer = trainerMap.get(trainerId);
    return trainer?.full_name || trainer?.email || "Unknown";
  };

  const handleUnassign = async () => {
    if (!unassignDialog) return;
    await unassignMember(unassignDialog.assignment.id);
    setUnassignDialog(null);
  };

  // Transform member for TrainerAssignmentDialog
  const transformMemberForDialog = (member: Member | null) => {
    if (!member) return null;
    return {
      id: member.id,
      full_name: member.client_name,
      email: member.client_email,
    };
  };

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Failed to load members. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lifecycle Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>

        {showTrainerAssignment && trainers.length > 0 && (
          <Select value={trainerFilter} onValueChange={setTrainerFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Trainer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.user_id} value={trainer.user_id}>
                  {trainer.full_name || trainer.email} ({trainer.assignment_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showSyncButton && (
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Members
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No members found.</p>
          {showSyncButton && (
            <p className="text-sm mt-2">
              Click "Sync Members" to fetch member data from the external system.
            </p>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stage</TableHead>
                {showTrainerAssignment && <TableHead>Trainer</TableHead>}
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const assignment = memberAssignmentMap.get(member.id);
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {member.client_name || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.client_email}
                    </TableCell>
                    <TableCell>
                      {member.lifecycle_stage && (
                        <Badge
                          variant="secondary"
                          className={stageColors[member.lifecycle_stage] || ""}
                        >
                          {member.lifecycle_stage.toUpperCase()}
                        </Badge>
                      )}
                    </TableCell>
                    {showTrainerAssignment && (
                      <TableCell>
                        {assignment ? (
                          <Badge variant="outline" className="gap-1">
                            <User className="h-3 w-3" />
                            {getTrainerName(assignment.trainer_user_id)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {member.created_at
                        ? format(new Date(member.created_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {showTrainerAssignment ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setAssignMember(member)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              {assignment ? "Reassign Trainer" : "Assign Trainer"}
                            </DropdownMenuItem>
                            {assignment && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setUnassignDialog({
                                    assignment,
                                    memberName: member.client_name || member.client_email,
                                  })
                                }
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Unassign Trainer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Note
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Note Dialog */}
      <MemberNoteDialog
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />

      {/* Trainer Assignment Dialog */}
      <TrainerAssignmentDialog
        open={!!assignMember}
        onOpenChange={(open) => !open && setAssignMember(null)}
        member={transformMemberForDialog(assignMember)}
        trainers={trainers}
        currentTrainerId={
          assignMember ? memberAssignmentMap.get(assignMember.id)?.trainer_user_id : undefined
        }
        onAssign={async (trainerId, memberId, notes) => {
          // If already assigned, unassign first
          const existingAssignment = memberAssignmentMap.get(memberId);
          if (existingAssignment) {
            await unassignMember(existingAssignment.id);
          }
          await handleAssign({ trainerId, memberId, notes });
        }}
        isAssigning={isAssigning}
      />

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={!!unassignDialog} onOpenChange={(open) => !open && setUnassignDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Trainer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the trainer assignment for {unassignDialog?.memberName}?
              The trainer will no longer see this member in their client list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassign}
              disabled={isUnassigning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnassigning ? "Unassigning..." : "Unassign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
