"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import type { StaffMember } from "@/lib/staff/types";
import { resetStaffTwoFactor, ApiError } from "./api";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ResetTwoFactorDialogProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetTwoFactorDialog({
  staff,
  isOpen,
  onClose,
}: ResetTwoFactorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!staff) return null;

  const handleReset = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await resetStaffTwoFactor(staff.id);
      toast.success(`Two-step verification reset for ${staff.name}`);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to reset two-step verification";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          setError(null);
          onClose();
        }
      }}
      title="Reset Two-Step Verification"
      icon={<ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />}
      maxWidth="md"
    >
      <ModalBody className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
            <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Are you sure you want to reset two-step verification for <strong className="font-bold">{staff.name}</strong> ({staff.email})?
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 text-xs space-y-1">
            <p className="font-bold">What happens next:</p>
            <p className="text-amber-800 dark:text-amber-300 font-normal leading-relaxed">
              They&apos;ll have to set up two-step verification again on next sign-in. Their previous authenticator key and backup codes will be immediately revoked.
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
          className="normal-case font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleReset}
          disabled={isSubmitting}
          className="normal-case font-bold bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              <span>Resetting 2FA…</span>
            </>
          ) : (
            <span>Reset 2FA</span>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
