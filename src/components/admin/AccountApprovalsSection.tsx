import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { usePendingApprovals, useApproveAccount, useRejectAccount } from "@/hooks/useAccountApproval";
import { AppRole, PendingApproval, ROLES } from "@/types/roles";
import { cn } from "@/lib/utils";

export function AccountApprovalsSection() {
  const { data: approvals = [], isLoading } = usePendingApprovals();
  const approveAccount = useApproveAccount();
  const rejectAccount = useRejectAccount();

  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApproveClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    // Pre-select suggested roles or requested roles
    const rolesToSelect = approval.suggested_roles.length > 0
      ? approval.suggested_roles
      : approval.requested_roles;
    setSelectedRoles(rolesToSelect);
    setApprovalNotes("");
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApproval || selectedRoles.length === 0) return;

    await approveAccount.mutateAsync({
      userId: selectedApproval.user_id,
      approvedRoles: selectedRoles,
      notes: approvalNotes || undefined,
    });

    setApproveDialogOpen(false);
    setSelectedApproval(null);
  };

  const handleReject = async () => {
    if (!selectedApproval || !rejectionReason.trim()) return;

    await rejectAccount.mutateAsync({
      userId: selectedApproval.user_id,
      reason: rejectionReason.trim(),
    });

    setRejectDialogOpen(false);
    setSelectedApproval(null);
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm uppercase tracking-wider">
                Pending Approvals
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Review and approve new account requests
              </CardDescription>
            </div>
            {approvals.length > 0 && (
              <Badge variant="secondary" className="rounded-none">
                {approvals.length} Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No pending approvals</p>
              <p className="text-xs text-muted-foreground mt-1">
                All accounts have been reviewed
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div
                    key={approval.user_id}
                    className="p-4 border rounded-none hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* User Info */}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {approval.full_name || "No name provided"}
                          </span>
                          {approval.sling_matched && (
                            <Badge variant="default" className="rounded-none text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Sling Match
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {approval.email}
                        </div>

                        {/* Requested Roles */}
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-1">
                            Requested:
                          </span>
                          {approval.requested_roles.length > 0 ? (
                            approval.requested_roles.map((role, idx) => {
                              const roleInfo = ROLES.find(r => r.value === role);
                              return (
                                <Badge key={idx} variant="outline" className="rounded-none text-[10px]">
                                  {roleInfo?.label || role}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>

                        {/* Suggested Roles (if Sling matched) */}
                        {approval.sling_matched && approval.suggested_roles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground mr-1">
                              Suggested:
                            </span>
                            {approval.suggested_roles.map((role, idx) => {
                              const roleInfo = ROLES.find(r => r.value === role);
                              return (
                                <Badge key={idx} variant="secondary" className="rounded-none text-[10px]">
                                  {roleInfo?.label || role}
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        {/* Signup Date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Signed up {format(new Date(approval.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveClick(approval)}
                          disabled={approveAccount.isPending || rejectAccount.isPending}
                          className="rounded-none"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(approval)}
                          disabled={approveAccount.isPending || rejectAccount.isPending}
                          className="rounded-none"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              Approve Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select roles and add optional notes for {selectedApproval?.full_name || selectedApproval?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Account Info */}
            <div className="p-4 border rounded-none bg-muted/30">
              <div className="text-xs space-y-1">
                <div><strong>Email:</strong> {selectedApproval?.email}</div>
                <div><strong>Name:</strong> {selectedApproval?.full_name || "Not provided"}</div>
                {selectedApproval?.sling_matched && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Matched with employee records</span>
                  </div>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">
                Assign Roles
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <div
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 border cursor-pointer transition-colors",
                      selectedRoles.includes(role.value)
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{role.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {role.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedRoles.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Please select at least one role</span>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] uppercase tracking-wider">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="rounded-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={approveAccount.isPending}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveAccount.isPending || selectedRoles.length === 0}
              className="rounded-none"
            >
              {approveAccount.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Approving
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-2" />
                  Approve Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              Reject Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a reason for rejecting {selectedApproval?.full_name || selectedApproval?.email}'s account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning */}
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-none">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  This user will be notified that their account was rejected.
                  They will not be able to access the system.
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-[10px] uppercase tracking-wider">
                Reason for Rejection *
              </Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this account is being rejected..."
                className="rounded-none"
                rows={4}
              />
              {!rejectionReason.trim() && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Reason is required</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectAccount.isPending}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectAccount.isPending || !rejectionReason.trim()}
              className="rounded-none"
            >
              {rejectAccount.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Rejecting
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-2" />
                  Reject Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
