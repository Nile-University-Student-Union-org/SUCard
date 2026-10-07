"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { signIn } from "@/lib/auth/client";
import { AuthLayout } from "@/components/ui/auth-layout";
import { AuthFeedback } from "@/components/ui/auth-feedback";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<{
    variant: "error" | "lockout" | "warning";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (res.error) {
        const status = res.error.status;
        const msg = res.error.message || "";

        if (status === 429 || msg.toLowerCase().includes("too many") || msg.toLowerCase().includes("rate limit")) {
          setAuthError({
            variant: "lockout",
            message: "Too many attempts. Try again in a minute.",
          });
        } else if (
          status === 403 ||
          msg.toLowerCase().includes("disabled") ||
          msg.includes("This account is disabled. Contact an SU super admin.")
        ) {
          setAuthError({
            variant: "error",
            message: "This account is disabled. Contact an SU super admin.",
          });
        } else {
          setAuthError({
            variant: "error",
            message: msg || "Invalid email or password. Please try again.",
          });
        }
        setIsLoading(false);
        return;
      }

      router.push("/admin/cards");
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 429) {
        setAuthError({
          variant: "lockout",
          message: "Too many attempts. Try again in a minute.",
        });
      } else {
        const message = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
        setAuthError({
          variant: "error",
          message,
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout maxWidth="md" backHref="/" backLabel="Home">
      <Card className="shadow-xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden p-0">
        <CardHeader className="pt-8 pb-4 text-center items-center">
          {/* Full color NUSU logo */}
          <div className="mb-3 flex justify-center">
            <Image
              src="/brand/su-logo-color.png"
              alt="Nile University Student Union Logo"
              width={190}
              height={56}
              className="h-11 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="Nile University Student Union Logo"
              width={190}
              height={56}
              className="h-11 w-auto object-contain hidden dark:block"
              priority
            />
          </div>
          <CardTitle className="font-heading text-2xl sm:text-3xl uppercase tracking-wide text-charcoal dark:text-white">
            Staff Sign In
          </CardTitle>
          <CardDescription className="text-ash dark:text-zinc-400 text-xs sm:text-sm max-w-xs mx-auto">
            Enter your student union staff credentials to access the admin console.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-8 pt-2">
          {authError && (
            <div className="mb-5">
              <AuthFeedback
                variant={authError.variant}
                message={authError.message}
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email field */}
            <Input
              id="email"
              type="email"
              label="Staff Email"
              autoComplete="email"
              placeholder="name@nu.edu.eg"
              disabled={isLoading}
              leftIcon={<Mail className="size-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password field with built-in show/hide */}
            <Input
              id="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              disabled={isLoading}
              showPasswordToggle
              error={errors.password?.message}
              {...register("password")}
            />

            {/* Submit button */}
            <div className="pt-2">
              <AuthSubmitButton
                isLoading={isLoading}
                loadingLabel="Signing in…"
                variant="primary"
                size="lg"
                className="w-full text-sm font-bold"
              >
                Sign in
              </AuthSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
