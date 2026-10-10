"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { User, Mail, CreditCard } from "lucide-react";
import { UNIVERSITY_ID_REGEX } from "@/lib/student/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFeedback } from "@/components/ui/auth-feedback";

const welcomeSchema = z.object({
  universityId: z
    .string()
    .trim()
    .regex(UNIVERSITY_ID_REGEX, "University ID must be exactly 9 digits (e.g. 231001000)"),
});

type WelcomeFormValues = z.infer<typeof welcomeSchema>;

interface WelcomeFormProps {
  name: string;
  email: string;
}

export function WelcomeForm({ name, email }: WelcomeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WelcomeFormValues>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: {
      universityId: "",
    },
  });

  const onSubmit = async (values: WelcomeFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/student/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ universityId: values.universityId.trim(), acceptPrivacy: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(data.error || "Failed to complete profile. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success -> navigate to /card
      router.push("/card");
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full my-auto py-4 max-w-lg mx-auto">
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="p-6 sm:p-8 pb-4 space-y-2 text-center sm:text-left border-b border-slate-100 dark:border-zinc-800/80">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs">
            <CreditCard className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white leading-tight">
              WELCOME TO SU CARD
            </h1>
            <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-1">
              Set up your membership card for Nile University student discounts and partner offers.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-6 space-y-6">
          {/* Server Error Display */}
          {serverError && (
            <AuthFeedback variant="error" message={serverError} />
          )}

          {/* Read-Only Microsoft Account Details */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
            <div className="flex items-center">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                Verified Nile University Student
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-foreground">
                <User className="size-4 text-brand dark:text-brand-soft shrink-0" />
                <span className="font-bold truncate">{name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="size-4 text-ash dark:text-zinc-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{email}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <Input
                id="universityId"
                type="text"
                inputMode="numeric"
                pattern="\d{9}"
                maxLength={9}
                autoComplete="off"
                label="University ID"
                placeholder="231001000"
                helperText="9 digits, e.g. 231001000"
                leftIcon={<CreditCard className="size-4 text-brand dark:text-brand-soft" />}
                error={errors.universityId?.message}
                disabled={isLoading}
                {...register("universityId")}
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                loadingText="Setting up your account…"
                className="w-full text-sm font-bold min-h-[48px] normal-case"
              >
                Continue
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                By continuing you agree to the{" "}
                <Link href="/privacy" target="_blank" className="text-brand dark:text-brand-soft underline underline-offset-2">
                  SU Card privacy notice
                </Link>
                .
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
