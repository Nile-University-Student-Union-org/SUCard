"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserPlus } from "lucide-react";
import type { StaffMember } from "@/lib/staff/types";
import { type StaffUser } from "@/lib/auth/guards";
import { listStaff } from "./api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StaffTable } from "./staff-table";
import { AddStaffModal } from "./add-staff-modal";
import { EditStaffModal } from "./edit-staff-modal";
import { DisableStaffDialog } from "./disable-staff-dialog";
import { ResetPasswordModal } from "./reset-password-modal";
import { ResetTwoFactorDialog } from "./reset-2fa-dialog";
import { StudentAdmins } from "./student-admins";

interface StaffManagerProps {
  currentUser?: StaffUser;
}

export function StaffManager({ currentUser }: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [statusStaff, setStatusStaff] = useState<StaffMember | null>(null);
  const [resettingPasswordStaff, setResettingPasswordStaff] = useState<StaffMember | null>(null);
  const [resettingTwoFactorStaff, setResettingTwoFactorStaff] = useState<StaffMember | null>(null);

  const fetchStaffList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listStaff();
      setStaff(data.staff || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load staff accounts. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listStaff()
      .then((data) => {
        if (active) {
          setStaff(data.staff || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Failed to load staff accounts. Please try again.";
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStaffAdded = (newStaff: StaffMember) => {
    setStaff((prev) => [newStaff, ...prev.filter((s) => s.id !== newStaff.id)]);
  };

  const handleStaffUpdated = (updatedStaff: StaffMember) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <PageHeader
        title="Staff"
        description="Manage who can sign in to the SU Card admin panel."
        actions={
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            className="normal-case font-bold h-11 px-5 shadow-xs"
          >
            <UserPlus className="size-4 mr-2 stroke-[2.5]" />
            <span>Add staff</span>
          </Button>
        }
      />

      {/* Staff Table / Cards */}
      <StaffTable
        staff={staff}
        currentUserId={currentUser?.id}
        isLoading={isLoading}
        error={error}
        onRetry={fetchStaffList}
        onEdit={(member) => setEditingStaff(member)}
        onToggleStatus={(member) => setStatusStaff(member)}
        onResetPassword={(member) => setResettingPasswordStaff(member)}
        onResetTwoFactor={(member) => setResettingTwoFactorStaff(member)}
      />
      <StudentAdmins />

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onStaffAdded={handleStaffAdded}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        staff={editingStaff}
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        onStaffUpdated={handleStaffUpdated}
      />

      {/* Disable/Enable Staff Dialog */}
      <DisableStaffDialog
        staff={statusStaff}
        isOpen={!!statusStaff}
        onClose={() => setStatusStaff(null)}
        onStaffUpdated={handleStaffUpdated}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        staff={resettingPasswordStaff}
        isOpen={!!resettingPasswordStaff}
        onClose={() => setResettingPasswordStaff(null)}
      />

      {/* Reset 2FA Dialog */}
      <ResetTwoFactorDialog
        staff={resettingTwoFactorStaff}
        isOpen={!!resettingTwoFactorStaff}
        onClose={() => setResettingTwoFactorStaff(null)}
      />
    </div>
  );
}
