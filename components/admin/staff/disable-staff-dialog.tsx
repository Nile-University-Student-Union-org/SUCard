"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { type StaffMember } from "@/lib/staff/types";
import { updateStaff, ApiError } from "./api";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface DisableStaffDialogProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onStaffUpdated: (staff: StaffMember) => void;
}

export function DisableStaffDialog({
  staff,
  isOpen,
  onClose,
  onStaffUpdated,
}: DisableStaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!staff) return null;

  const isDisabling = staff.status === "active";
  const targetStatus = isDisabling ? "disabled" : "active";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await updateStaff(staff.id, { status: targetStatus });
      onStaffUpdated(res.staff);
      toast.success(
        isDisabling
          ? `Staff member ${staff.name} disabled`
          : `Staff member ${staff.name} enabled`
      );
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      variant={isDisabling ? "destructive" : "brand"}
      title={isDisabling ? `Disable ${staff.name}?` : `Enable ${staff.name}?`}
      description={
        isDisabling
          ? `Disabling this account will immediately revoke all active sessions for ${staff.name} (${staff.email}) and block them from signing in to the SU Card admin console.`
          : `Enabling this account will restore administrator access for ${staff.name} (${staff.email}) to sign in to the SU Card admin console.`
      }
      confirmText={
        isDisabling ? "Disable staff member" : "Enable staff member"
      }
      isLoading={isSubmitting}
      cancelText="Cancel"
    />
  );
}
