"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  KeyRound,
  Key,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  STAFF_PASSWORD_MIN,
  STAFF_PASSWORD_MAX,
  type StaffMember,
} from "@/lib/staff/types";
import { resetStaffPassword, ApiError } from "./api";
import { generateSecurePassword } from "./utils";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyToClipboard } from "@/lib/clipboard";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(STAFF_PASSWORD_MIN, `Password must be at least ${STAFF_PASSWORD_MIN} characters`)
    .max(STAFF_PASSWORD_MAX, `Password cannot exceed ${STAFF_PASSWORD_MAX} characters`),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({
  staff,
  isOpen,
  onClose,
}: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccessPassword, setResetSuccessPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const currentPassword = useWatch({ control, name: "password" }) || "";

  if (!staff) return null;

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword(16);
    setValue("password", pwd, { shouldValidate: true });
    copyToClipboard(pwd).catch(() => {});
    toast.info("Password generated & copied to clipboard");
  };

  const handleCopyCredentials = async () => {
    if (!resetSuccessPassword) return;
    const text = `Staff Member: ${staff.name}\nEmail: ${staff.email}\nNew Password: ${resetSuccessPassword}`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    reset({ password: "" });
    setResetSuccessPassword(null);
    setSubmitError(null);
    setIsCopied(false);
    onClose();
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await resetStaffPassword(staff.id, values);
      setResetSuccessPassword(values.password);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to reset password";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={resetSuccessPassword ? "Password Reset Complete" : `Reset Password — ${staff.name}`}
      icon={<KeyRound className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="md"
    >
      {resetSuccessPassword ? (
        /* One-time Credentials Success Pane */
        <>
          <ModalBody className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span>Password Successfully Reset</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                {staff.name} has been signed out everywhere. Make sure to copy their new password now and share it securely.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-zinc-700">
                <span className="text-ash dark:text-zinc-400 font-sans font-bold">Account:</span>
                <span className="text-charcoal dark:text-white font-sans font-bold">{staff.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-ash dark:text-zinc-400 font-sans font-bold">New Password:</span>
                <span className="text-brand dark:text-brand-soft font-bold select-all bg-white dark:bg-zinc-900 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                  {resetSuccessPassword}
                </span>
              </div>
            </div>

            {/* Next Step Info */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">Next steps:</p>
              <p className="text-[11px] leading-relaxed">
                Provide these temporary credentials to {staff.name}. They will be asked to complete two-factor authentication when signing back in.
              </p>
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyCredentials}
              className="normal-case text-xs font-bold h-11 min-h-[44px] px-4"
            >
              {isCopied ? (
                <>
                  <Check className="size-4 mr-1.5 text-emerald-600 animate-icon-morph" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-1.5" />
                  Copy new credentials
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleModalClose}
              className="normal-case text-xs font-bold h-11 min-h-[44px] px-6"
            >
              Done
            </Button>
          </ModalFooter>
        </>
      ) : (
        /* Reset Password Input Form */
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ModalBody className="space-y-4">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <p className="text-xs text-ash dark:text-zinc-400 leading-relaxed font-medium">
              Setting a new password will immediately terminate all active sessions for <strong className="text-charcoal dark:text-white">{staff.email}</strong>.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="reset-staff-password" className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-brand dark:text-brand-soft hover:underline inline-flex items-center gap-1 cursor-pointer select-none min-h-[32px] px-1"
                >
                  <Key className="size-3.5" />
                  <span>Generate strong password</span>
                </button>
              </div>

              <Input
                id="reset-staff-password"
                type="password"
                placeholder="••••••••••••"
                disabled={isSubmitting}
                showPasswordToggle
                error={errors.password?.message}
                {...register("password")}
              />

              <PasswordStrengthMeter
                password={currentPassword}
                showMatch={false}
              />
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="normal-case font-semibold h-11 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              loading={isSubmitting}
              loadingText="Resetting password…"
              className="normal-case font-bold h-11 min-h-[44px]"
            >
              Reset password
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
