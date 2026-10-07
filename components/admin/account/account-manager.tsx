"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ShieldCheck,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { type StaffUser } from "@/lib/auth/guards";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "@/lib/staff/types";
import { authClient } from "@/lib/auth/client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const onSubmit = async (values: ChangePasswordFormValues) => {
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
      toast.success("Password updated successfully");
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to change password. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Profile Card */}
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
        </div>

        {/* Change Password Card */}
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    className="w-full sm:w-auto px-6 font-bold"
                  >
                    Update password
                  </AuthSubmitButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
