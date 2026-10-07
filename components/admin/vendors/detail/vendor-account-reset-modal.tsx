"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { resetVendorAccountPassword } from "../api";
import type { VendorAccountDto } from "@/lib/vendors/types";

interface VendorAccountResetModalProps {
  account: VendorAccountDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorAccountResetModal({
  account,
  isOpen,
  onClose,
}: VendorAccountResetModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await resetVendorAccountPassword(account.id, password);
      toast.success(`Password reset for ${account.name}`);
      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          resetForm();
          onClose();
        }
      }}
      title={`Reset Password — ${account?.name || ""}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && (
            <Alert variant="destructive" title="Error">
              {error}
            </Alert>
          )}

          <p className="text-xs text-muted-foreground">
            Set a new temporary or permanent password for <strong>{account?.email}</strong>. Existing sessions will be terminated.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="reset-pwd" className="text-xs font-bold uppercase tracking-wider">
              New Password <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="reset-pwd"
              type="password"
              required
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-pwd-confirm" className="text-xs font-bold uppercase tracking-wider">
              Confirm Password <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="reset-pwd-confirm"
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <PasswordStrengthMeter
            password={password}
            confirmPassword={confirmPassword}
          />
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="normal-case font-bold h-11 px-5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Resetting…</span>
              </>
            ) : (
              <span>Reset password</span>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
