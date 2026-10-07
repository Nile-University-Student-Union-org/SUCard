"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { type StaffUser } from "@/lib/auth/guards";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "@/lib/staff/types";
import { authClient } from "@/lib/auth/client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(STAFF_PASSWORD_MIN, `New password must be at least ${STAFF_PASSWORD_MIN} characters`)
      .max(STAFF_PASSWORD_MAX, `New password cannot exceed ${STAFF_PASSWORD_MAX} characters`),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface AccountManagerProps {
  user: StaffUser;
}

export function AccountManager({ user }: AccountManagerProps) {
  const { data: session } = authClient.useSession();
  const sessionData = session?.session as { loginMethod?: string } | undefined;
  const isMicrosoftLogin = sessionData?.loginMethod === "microsoft";

  // Change Password State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Regenerate Backup Codes Modal State
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [regenPassword, setRegenPassword] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
  const [areCodesCopied, setAreCodesCopied] = useState(false);
  const [areCodesDownloaded, setAreCodesDownloaded] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) || "";

  const onSubmitPassword = async (values: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setIsSuccess(false);

    try {
      const res = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        setSubmitError(res.error.message || "Failed to update password. Verify your current password.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setIsSuccess(false), 6000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to change password. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateCodesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regenPassword) {
      setRegenError("Please enter your current password");
      return;
    }

    setIsRegenerating(true);
    setRegenError(null);

    try {
      const res = await authClient.twoFactor.generateBackupCodes({
        password: regenPassword,
      });

      if (res.error) {
        setRegenError(res.error.message || "Incorrect password. Please verify and try again.");
        setIsRegenerating(false);
        return;
      }

      const codes = res.data?.backupCodes || [];
      setGeneratedCodes(codes);
      setRegenPassword("");
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Failed to regenerate backup codes.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (!generatedCodes || generatedCodes.length === 0) return;
    const content = `SU Card Admin — Two-Factor Backup Codes\nAccount: ${user.email}\nGenerated: ${new Date().toISOString()}\n\n` +
      generatedCodes.map((code, i) => `${i + 1}. ${code}`).join("\n") +
      `\n\nEach code can only be used once. Store these codes in a secure location.`;

    const ok = await copyToClipboard(content);
    if (ok) {
      setAreCodesCopied(true);
      setTimeout(() => setAreCodesCopied(false), 2500);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!generatedCodes || generatedCodes.length === 0) return;
    const content = `SU Card Admin — Two-Factor Backup Codes\nAccount: ${user.email}\nGenerated: ${new Date().toISOString()}\n\n` +
      generatedCodes.map((code, i) => `${i + 1}. ${code}`).join("\n") +
      `\n\nEach code can only be used once. Store these codes in a secure location.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `su-card-backup-codes-${user.email.split("@")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setAreCodesDownloaded(true);
    setTimeout(() => setAreCodesDownloaded(false), 2500);
  };

  const handleCloseRegenerateModal = () => {
    if (isRegenerating) return;
    setIsRegenerateOpen(false);
    setRegenPassword("");
    setRegenError(null);
    setGeneratedCodes(null);
    setAreCodesCopied(false);
    setAreCodesDownloaded(false);
  };

  const isSuperAdmin = user.role === "super_admin";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-heading text-3xl sm:text-4xl font-normal uppercase tracking-wide text-foreground">
          MY ACCOUNT
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal staff profile and credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card & 2FA Info (Left Col) */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="text-center items-center pb-2">
              <UserAvatar
                name={user.name}
                size="xl"
                className="border-2 border-brand/40 shadow-xs mb-2"
              />
              <CardTitle className="text-lg font-black text-charcoal dark:text-white">
                {user.name}
              </CardTitle>
              <CardDescription className="text-xs text-ash dark:text-zinc-400">
                {user.email}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs">
                <span className="font-bold text-ash dark:text-zinc-400">Role:</span>
                <Badge
                  variant={isSuperAdmin ? "brand" : "outline"}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {isSuperAdmin ? (
                    <>
                      <ShieldCheck className="size-3 mr-1" />
                      Super Admin
                    </>
                  ) : (
                    <>
                      <Shield className="size-3 mr-1" />
                      Admin
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs">
                <span className="font-bold text-ash dark:text-zinc-400">Organization:</span>
                <span className="font-bold text-charcoal dark:text-zinc-200 text-right">
                  Nile University Student Union
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs">
                <span className="font-bold text-ash dark:text-zinc-400">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Two-Step Verification Card */}
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center shrink-0">
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Two-Step Verification
                    </CardTitle>
                  </div>
                </div>

                <Badge
                  variant={isMicrosoftLogin ? "brand" : "success"}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {isMicrosoftLogin ? "via Microsoft" : "On"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs text-ash dark:text-zinc-400">
              {isMicrosoftLogin ? (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-sky-950 dark:text-sky-200 space-y-1">
                  <p className="font-bold text-xs">Protected by Nile University Microsoft MFA</p>
                  <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed font-normal">
                    Your login is authenticated via Microsoft Single Sign-On. Two-factor security is managed by Nile University&apos;s Microsoft 365 policies.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="leading-relaxed">
                    Authenticator app (TOTP) verification is required on sign in to keep your administrator access secure.
                  </p>

                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRegenerateOpen(true)}
                      className="w-full normal-case text-xs font-bold h-11 border-slate-200 dark:border-zinc-700 min-h-[44px]"
                    >
                      <KeyRound className="size-3.5 mr-1.5" />
                      <span>Regenerate backup codes</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Change Password Card (Right Col) */}
        <div className="md:col-span-7">
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
                  <KeyRound className="size-5 stroke-[2.5]" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">
                    CHANGE PASSWORD
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Update your password to keep your administrator account secure.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {submitError && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {isSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-start gap-2 animate-in fade-in-0 duration-200">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Password updated successfully! Other active sessions have been revoked.</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4" noValidate>
                {/* Current Password */}
                <Input
                  id="current-password"
                  type="password"
                  label="Current Password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  disabled={isSubmitting}
                  showPasswordToggle
                  error={errors.currentPassword?.message}
                  {...register("currentPassword")}
                />

                {/* New Password */}
                <div className="space-y-2">
                  <Input
                    id="new-password"
                    type="password"
                    label="New Password"
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    disabled={isSubmitting}
                    showPasswordToggle
                    error={errors.newPassword?.message}
                    {...register("newPassword")}
                  />

                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter
                    password={newPassword}
                    confirmPassword={confirmPassword}
                    showMatch={false}
                  />
                </div>

                {/* Confirm New Password */}
                <Input
                  id="confirm-password"
                  type="password"
                  label="Confirm New Password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  disabled={isSubmitting}
                  showPasswordToggle
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                  <AuthSubmitButton
                    isLoading={isSubmitting}
                    loadingLabel="Updating password…"
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto px-6 font-bold h-11 min-h-[44px]"
                  >
                    Update password
                  </AuthSubmitButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Regenerate Backup Codes Modal */}
      <Modal
        isOpen={isRegenerateOpen}
        onClose={handleCloseRegenerateModal}
        title={generatedCodes ? "New Backup Codes" : "Regenerate Backup Codes"}
        icon={<KeyRound className="size-5 text-brand dark:text-brand-soft" />}
        maxWidth="md"
      >
        {generatedCodes ? (
          /* Show New Codes View */
          <>
            <ModalBody className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-1">
                <p className="font-bold text-xs">Important: Save these new codes now</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  All previously generated backup codes have been invalidated. These new codes will not be displayed again.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
                    Backup Codes ({generatedCodes.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBackupCodes}
                      className="normal-case text-xs font-bold min-h-[44px] px-3.5"
                    >
                      {areCodesCopied ? (
                        <>
                          <Check className="size-3.5 mr-1 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 mr-1" />
                          <span>Copy codes</span>
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadBackupCodes}
                      className="normal-case text-xs font-bold min-h-[44px] px-3.5"
                    >
                      {areCodesDownloaded ? (
                        <>
                          <Check className="size-3.5 mr-1 text-emerald-600" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5 mr-1" />
                          <span>Download .txt</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono text-xs font-bold text-center text-charcoal dark:text-zinc-200 select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="primary"
                onClick={handleCloseRegenerateModal}
                className="normal-case font-bold text-xs w-full sm:w-auto px-6 h-11 min-h-[44px]"
              >
                Done
              </Button>
            </ModalFooter>
          </>
        ) : (
          /* Password Prompt View */
          <form onSubmit={handleRegenerateCodesSubmit}>
            <ModalBody className="space-y-4">
              <p className="text-xs text-ash dark:text-zinc-400 leading-relaxed font-medium">
                Regenerating backup codes will invalidate all existing backup codes. Please enter your administrator password to confirm.
              </p>

              {regenError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{regenError}</span>
                </div>
              )}

              <Input
                id="regen-password"
                type="password"
                label="Current Password"
                placeholder="••••••••••••"
                disabled={isRegenerating}
                showPasswordToggle
                value={regenPassword}
                onChange={(e) => {
                  setRegenPassword(e.target.value);
                  if (regenError) setRegenError(null);
                }}
                autoFocus
              />
            </ModalBody>

            <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseRegenerateModal}
                disabled={isRegenerating}
                className="normal-case font-semibold h-11 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isRegenerating || !regenPassword}
                className="normal-case font-bold h-11 min-h-[44px]"
              >
                {isRegenerating ? "Generating…" : "Generate new codes"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
}
