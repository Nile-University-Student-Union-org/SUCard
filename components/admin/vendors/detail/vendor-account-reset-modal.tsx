"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Check,
  Copy,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { resetVendorAccountPassword } from "../api";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "cn";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [resetCompletedPassword, setResetCompletedPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setGeneralError(null);
    setResetCompletedPassword(null);
    setIsCopied(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = "New password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resetVendorAccountPassword(account.id, password);
      setResetCompletedPassword(password);
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Failed to reset password"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!account || !resetCompletedPassword) return;
    const creds = [
      `SU Card — Password Reset for ${account.name}`,
      `Email: ${account.email}`,
      `New Password: ${resetCompletedPassword}`,
      `Sign-in: ${window.location.origin}${account.role === "cashier" ? "/scan" : "/vendor"}`,
    ].join("\n");

    const ok = await copyToClipboard(creds);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Reset Password — ${account?.name || ""}`}
      maxWidth="md"
    >
      {resetCompletedPassword ? (
        <div className="space-y-5 animate-in fade-in-0 duration-200">
          <ModalBody className="space-y-4">
            {/* Success Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  Password Reset Successfully
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Existing sessions for {account?.name} have been terminated.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
              <div className="text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-bold text-foreground">{account?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono text-foreground">{account?.email}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">New Password</span>
                  <span className="font-mono font-bold text-brand dark:text-brand-soft text-sm">
                    {resetCompletedPassword}
                  </span>
                </div>
              </div>

              {/* Copy Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCredentials}
                className="w-full h-11 min-h-[44px] rounded-xl font-bold text-xs normal-case border-border hover:bg-muted"
              >
                {isCopied ? (
                  <>
                    <Check className="size-4 mr-1.5 text-emerald-600 dark:text-emerald-400 animate-icon-morph" />
                    <span className="text-emerald-700 dark:text-emerald-300">
                      Password copied to clipboard!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-1.5" />
                    <span>Copy updated login credentials</span>
                  </>
                )}
              </Button>
            </div>

            {/* Next Steps */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-brand dark:text-brand-soft" />
                <span>Next steps</span>
              </p>
              <p>
                Share this password with the staff member securely. They will need to sign in again on all register devices with their new credentials.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              className="w-full sm:w-auto h-11 min-h-[44px] px-6 normal-case font-bold"
            >
              <span>Done</span>
            </Button>
          </ModalFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            {generalError && (
              <Alert variant="destructive" title="Unable to reset password">
                {generalError}
              </Alert>
            )}

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p className="text-foreground font-semibold">
                Resetting credentials for {account?.name} ({account?.email})
              </p>
              <p className="text-[11px] leading-relaxed">
                Setting a new password will terminate all existing active device sessions across registers and dashboards.
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="reset-pwd"
                className="text-xs font-semibold text-foreground"
              >
                New Password <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="reset-pwd"
                type="password"
                placeholder="Enter at least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                className={cn(
                  "h-11 min-h-[44px] rounded-xl",
                  fieldErrors.password && "border-rose-500 focus-visible:ring-rose-500"
                )}
              />
              {fieldErrors.password && (
                <p className="text-xs text-rose-500 font-semibold">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="reset-pwd-confirm"
                className="text-xs font-semibold text-foreground"
              >
                Confirm Password <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="reset-pwd-confirm"
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                className={cn(
                  "h-11 min-h-[44px] rounded-xl",
                  fieldErrors.confirmPassword &&
                    "border-rose-500 focus-visible:ring-rose-500"
                )}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-rose-500 font-semibold">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <PasswordStrengthMeter
              password={password}
              confirmPassword={confirmPassword}
            />
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="normal-case font-semibold h-11 min-h-[44px]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingText="Resetting…"
              className="normal-case font-bold h-11 min-h-[44px] px-5"
            >
              <KeyRound className="size-4 mr-1.5" />
              <span>Reset password</span>
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
