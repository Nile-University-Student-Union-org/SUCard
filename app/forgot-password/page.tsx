"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { AuthFeedback } from "@/components/ui/auth-feedback";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { AuthLayout } from "@/components/ui/auth-layout";
import { signIn } from "@/lib/auth/client";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordContent() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<{
    variant: "error" | "lockout" | "warning";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setFormError(null);

    const email = values.email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          redirectTo: "/reset-password",
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setFormError({
            variant: "lockout",
            message: "Too many reset attempts. Please wait a minute before trying again.",
          });
          setIsLoading(false);
          return;
        }
        const body = (await res.json().catch(() => null)) as { code?: string } | null;
        if (body?.code === "student_email") {
          await signIn.social({ provider: "microsoft", callbackURL: "/go" });
          return;
        }
        // For other errors (like email not found), do not reveal account non-existence
      }

      setSubmittedEmail(email);
      setIsSubmitted(true);
    } catch {
      // Generic fallback - still show generic success to never reveal account existence
      setSubmittedEmail(email);
      setIsSubmitted(true);
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
        {isSubmitted ? (
          /* Success State */
          <div className="space-y-6 text-center animate-in fade-in-0 duration-200">
            <div className="size-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="size-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                CHECK YOUR EMAIL
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                If an account exists for <strong className="text-foreground font-semibold">{submittedEmail}</strong>, we&apos;ve sent a link to reset your password.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-ash dark:text-zinc-400 space-y-1 text-left">
              <p className="font-bold text-foreground">Didn&apos;t receive an email?</p>
              <p className="text-[11px] leading-relaxed">
                Check your spam or junk folder. The reset link is valid for 1 hour.
              </p>            </div>

            <div className="pt-2">
              <ButtonLink
                href="/login"
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold min-h-[48px] normal-case"
              >
                Return to sign in
              </ButtonLink>
            </div>
          </div>
        ) : (
          /* Input Form State */
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="size-11 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs mb-1">
                <KeyRound className="size-5" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                FORGOT PASSWORD
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
                Enter your email to receive a reset link. If you are a student, sign in using Microsoft.
              </p>
            </div>

            {formError && (
              <AuthFeedback
                variant={formError.variant}
                message={formError.message}
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                id="forgot-email"
                type="email"
                label="Email address"
                autoComplete="email"
                placeholder="name@nu.edu.eg"
                disabled={isLoading}
                leftIcon={<Mail className="size-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="pt-2">
                <AuthSubmitButton
                  isLoading={isLoading}
                  loadingLabel="Sending reset link…"
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold min-h-[48px]"
                >
                  Send reset link
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

function ForgotPasswordSkeleton() {
  return (
    <AuthLayout backHref="/login" backLabel="Back to sign in" maxWidth="md">
      <Card
        className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6"
        role="status"
        aria-label="Loading forgot password"
      >
        <div className="space-y-2 text-center sm:text-left">
          <div className="size-11 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none mx-auto sm:mx-0 shadow-xs mb-1" />
          <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-72 max-w-full rounded bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-zinc-800 animate-pulse motion-reduce:animate-none" />
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
