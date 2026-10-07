"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "@/lib/staff/types";
import { AuthFeedback } from "@/components/ui/auth-feedback";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { AuthLayout } from "@/components/ui/auth-layout";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(STAFF_PASSWORD_MIN, `Password must be at least ${STAFF_PASSWORD_MIN} characters`)
      .max(STAFF_PASSWORD_MAX, `Password cannot exceed ${STAFF_PASSWORD_MAX} characters`),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(!token);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<{
    variant: "error" | "lockout" | "warning";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = useWatch({ control, name: "newPassword" }) || "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) || "";

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setIsTokenInvalid(true);
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const res = await authClient.resetPassword({
        newPassword: values.newPassword,
        token,
      });

      if (res.error) {
        const status = res.error.status;
        const msg = res.error.message || "";

        if (status === 429 || msg.toLowerCase().includes("too many") || msg.toLowerCase().includes("rate limit")) {
          setFormError({
            variant: "lockout",
            message: "Too many reset attempts. Please wait a minute before trying again.",
          });
          setIsLoading(false);
          return;
        }

        if (status === 400 || msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
          setIsTokenInvalid(true);
          setIsLoading(false);
          return;
        }

        setFormError({
          variant: "error",
          message: msg || "Failed to reset password. Please try again or request a new link.",
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 429) {
        setFormError({
          variant: "lockout",
          message: "Too many reset attempts. Please wait a minute before trying again.",
        });
      } else {
        setFormError({
          variant: "error",
          message: err instanceof Error ? err.message : "Failed to reset password. Please request a new link.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      backHref="/login"
      backLabel="Back to sign in"
      maxWidth="md"
    >
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-8">
        {isTokenInvalid ? (
          /* Invalid or Expired Token State */
          <div className="space-y-6 text-center animate-in fade-in-0 duration-200">
            <div className="size-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="size-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                INVALID OR EXPIRED LINK
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                This password reset link is invalid, has already been used, or has expired. Please request a new reset link.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ButtonLink
                href="/forgot-password"
                variant="primary"
                size="md"
                className="w-full sm:w-auto text-sm font-bold min-h-[44px] normal-case px-6"
              >
                Request new link
              </ButtonLink>
              <ButtonLink
                href="/login"
                variant="outline"
                size="md"
                className="w-full sm:w-auto text-sm font-bold min-h-[44px] normal-case px-6"
              >
                Back to sign in
              </ButtonLink>
            </div>
          </div>
        ) : isSuccess ? (
          /* Success State */
          <div className="space-y-6 text-center animate-in fade-in-0 duration-200">
            <div className="size-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="size-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                PASSWORD UPDATED
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                Your password has been set successfully. All prior active sessions have been revoked for your security.
              </p>
            </div>

            <div className="pt-2">
              <ButtonLink
                href="/login"
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold min-h-[48px] normal-case"
              >
                Sign in with new password
              </ButtonLink>
            </div>
          </div>
        ) : (
          /* Reset Password Form */
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="size-11 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs mb-1">
                <Lock className="size-5" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                SET NEW PASSWORD
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
                Choose a strong password with at least {STAFF_PASSWORD_MIN} characters.
              </p>
            </div>

            {formError && (
              <AuthFeedback
                variant={formError.variant}
                message={formError.message}
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Input
                  id="new-password"
                  type="password"
                  label="New password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  disabled={isLoading}
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

              <Input
                id="confirm-password"
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                disabled={isLoading}
                showPasswordToggle
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <div className="pt-2">
                <AuthSubmitButton
                  isLoading={isLoading}
                  loadingLabel="Setting password…"
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold min-h-[48px]"
                >
                  Set new password
                </AuthSubmitButton>
              </div>
            </form>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ash dark:text-zinc-400 hover:text-foreground transition-colors min-h-[44px] px-2"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}

function ResetPasswordSkeleton() {
  return (
    <AuthLayout backHref="/login" backLabel="Back to sign in" maxWidth="md">
      <Card
        className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6"
        role="status"
        aria-label="Loading reset password"
      >
        <div className="space-y-2 text-center sm:text-left">
          <div className="size-11 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none mx-auto sm:mx-0 shadow-xs mb-1" />
          <div className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-72 max-w-full rounded bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none pt-2" />
        </div>
        <div className="pt-2 flex justify-center">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
        </div>
      </Card>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
