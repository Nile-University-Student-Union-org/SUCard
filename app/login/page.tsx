"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
        setAuthError(res.error.message || "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      router.push("/admin/cards");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setAuthError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0F3056] overflow-hidden selection:bg-[#018BCE] selection:text-white">
      {/* Subtle brand geometry / arches */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full border-2 border-[#018BCE]/20 bg-[#0F548D]/20 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 -right-24 size-80 rounded-full border border-[#018BCE]/30 bg-[#018BCE]/15 blur-xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-36 left-1/3 size-[28rem] rounded-full border-2 border-[#0F548D]/40 bg-[#0F548D]/20 blur-3xl"
        aria-hidden="true"
      />
      {/* Geometric concentric arcs matching logo style */}
      <div
        className="pointer-events-none absolute top-10 right-10 size-64 rounded-full border border-white/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-10 right-10 size-96 rounded-full border border-white/5"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-white/15 bg-white backdrop-blur-md rounded-2xl overflow-hidden py-0">
          <CardHeader className="pt-8 pb-4 text-center items-center">
            {/* Full color NUSU logo */}
            <div className="mb-3 flex justify-center">
              <Image
                src="/brand/su-logo-color.png"
                alt="Nile University Student Union Logo"
                width={190}
                height={56}
                className="h-11 w-auto object-contain"
                priority
              />
            </div>
            <CardTitle className="font-heading text-2xl sm:text-3xl uppercase tracking-wide text-[#0F3056]">
              Staff Sign In
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs sm:text-sm max-w-xs mx-auto">
              Enter your student union staff credentials to manage cards and batches.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8 pt-2">
            {authError && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium animate-in fade-in-50 duration-200"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email field */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Staff Email
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="size-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@nu.edu.eg"
                    disabled={isLoading}
                    aria-invalid={errors.email ? "true" : undefined}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="h-10 pl-9 pr-3 text-sm rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#018BCE] focus-visible:ring-[#018BCE]"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-600 font-medium pt-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="size-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    aria-invalid={errors.password ? "true" : undefined}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="h-10 pl-9 pr-10 text-sm rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-[#018BCE] focus-visible:ring-[#018BCE]"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-[#018BCE]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-red-600 font-medium pt-0.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-2 bg-[#0F3056] text-white hover:bg-[#0F548D] active:bg-[#0F3056] text-sm font-semibold rounded-lg shadow transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security badge at bottom */}
        <p className="mt-6 text-center text-xs text-white/60">
          Authorized personnel only. Nile University Student Union.
        </p>
      </div>
    </div>
  );
}
