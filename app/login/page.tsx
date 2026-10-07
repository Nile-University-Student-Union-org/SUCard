"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Info, AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";
import { signIn, authClient } from "@/lib/auth/client";
import { AuthFeedback } from "@/components/ui/auth-feedback";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { MicrosoftSignInButton } from "@/components/ui/microsoft-sign-in-button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { PinInput } from "@/components/ui/pin-input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const URL_ERROR_MESSAGES: Record<string, string> = {
  not_student:
    "Only Nile University student accounts can sign up. Staff: sign in with email, or ask an SU admin to add you.",
  not_allowed: "This Microsoft account can't be used for SU Card.",
  disabled: "This account is disabled. Contact an SU super admin.",
  no_access: "Your account doesn't have access to SU Card yet.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [dismissedUrlError, setDismissedUrlError] = useState(false);

  // Step state: credentials vs two-factor
  const [step, setStep] = useState<"credentials" | "two-factor">("credentials");
  const [twoFactorMethod, setTwoFactorMethod] = useState<"totp" | "backup">("totp");
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState(false);
  const [twoFactorPinError, setTwoFactorPinError] = useState(false);

  const [authError, setAuthError] = useState<{
    variant: "error" | "lockout" | "warning";
    message: string;
  } | null>(null);
  const [microsoftInfo, setMicrosoftInfo] = useState<string | null>(null);
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

  const onSubmitCredentials = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    setMicrosoftInfo(null);

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

      // Check if Better Auth returned twoFactorRedirect
      if (res.data && (res.data as unknown as { twoFactorRedirect?: boolean }).twoFactorRedirect) {
        setStep("two-factor");
        setTwoFactorMethod("totp");
        setTotpCode("");
        setBackupCode("");
        setAuthError(null);
        setIsLoading(false);
        return;
      }

      // Successful sign in
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/go");
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

  const handleVerifyTwoFactor = async (codeToVerify?: string) => {
    setIsVerifyingTwoFactor(true);
    setAuthError(null);
    setTwoFactorPinError(false);

    const isTotp = twoFactorMethod === "totp";
    const code = (codeToVerify ?? (isTotp ? totpCode : backupCode)).trim();

    if (!code) {
      setAuthError({
        variant: "error",
        message: isTotp ? "Please enter the 6-digit verification code." : "Please enter your backup code.",
      });
      setIsVerifyingTwoFactor(false);
      return;
    }

    try {
      let res;
      if (isTotp) {
        res = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice,
        });
      } else {
        res = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice,
        });
      }

      if (res.error) {
        const status = res.error.status;
        const msg = res.error.message || "";

        setTwoFactorPinError(true);

        if (status === 429 || msg.toLowerCase().includes("too many") || msg.toLowerCase().includes("rate limit")) {
          setAuthError({
            variant: "lockout",
            message: "Too many attempts. Try again in a minute.",
          });
        } else if (status === 403 || msg.toLowerCase().includes("disabled")) {
          setAuthError({
            variant: "error",
            message: "This account is disabled. Contact an SU super admin.",
          });
        } else {
          setAuthError({
            variant: "error",
            message: isTotp
              ? "Invalid verification code. Please check your authenticator app and try again."
              : "Invalid backup code. Please check and try again.",
          });
        }
        setIsVerifyingTwoFactor(false);
        return;
      }

      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/go");
    } catch (err: unknown) {
      setTwoFactorPinError(true);
      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 429) {
        setAuthError({
          variant: "lockout",
          message: "Too many attempts. Try again in a minute.",
        });
      } else {
        const message = err instanceof Error ? err.message : "Verification failed. Please try again.";
        setAuthError({
          variant: "error",
          message,
        });
      }
      setIsVerifyingTwoFactor(false);
    }
  };

  const handleStartOver = () => {
    setStep("credentials");
    setTotpCode("");
    setBackupCode("");
    setAuthError(null);
    setTwoFactorPinError(false);
  };

  const activeUrlErrorMessage =
    urlError && !dismissedUrlError
      ? URL_ERROR_MESSAGES[urlError] || "Authentication error. Please try again."
      : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground flex flex-col lg:grid lg:grid-cols-12 relative isolate selection:bg-brand selection:text-white">
      {/* 1. Left Brand Panel (Desktop Split Layout) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-[#0F3056] text-white flex-col justify-between p-12 overflow-hidden border-r border-[#0A2240] shadow-2xl">
        {/* Decorative subtle ambient background shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#018BCE]/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#0F548D]/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/10" />
        </div>

        {/* Top: Logo & Back Link */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-200 hover:text-white transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to home</span>
          </Link>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-sky-200 border border-white/15">
            Official Portal
          </span>
        </div>

        {/* Middle: Brand Hero Message */}
        <div className="relative z-10 space-y-6 my-auto max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/10 p-3 border border-white/20 backdrop-blur-xs flex items-center justify-center shadow-lg">
            <Image
              src="/brand/su-icon-white@hd.png"
              alt="NUSU Icon"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-4xl xl:text-5xl uppercase tracking-wider text-white leading-tight font-normal">
              SU CARD
            </h1>
            <p className="text-sm xl:text-base text-sky-100/90 leading-relaxed font-normal">
              Digital &amp; physical membership for Nile University Student Union.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3 text-xs text-sky-200/80">
            <span className="size-2 rounded-full bg-[#018BCE] animate-pulse" />
            <span>One identity for campus access, events, and member perks.</span>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-sky-200/60">
          <span>Nile University Student Union</span>
          <span>NUSU &copy; {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* 2. Right Form Panel (Universal Sign In / 2FA) */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative z-10">
        <AmbientBackdrop />

        {/* Top Bar for Mobile & Desktop Right */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-ash dark:text-zinc-400 hover:text-foreground transition-colors group min-h-[44px]"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Home</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Form Container */}
        <main className="w-full max-w-md mx-auto my-auto">
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl overflow-hidden p-6 sm:p-8">
            {/* Mobile Header Logo */}
            <div className="lg:hidden mb-6 flex justify-center">
              <Image
                src="/brand/su-logo-color.png"
                alt="Nile University Student Union Logo"
                width={180}
                height={52}
                className="h-10 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/brand/su-logo-white@hd.png"
                alt="Nile University Student Union Logo"
                width={180}
                height={52}
                className="h-10 w-auto object-contain hidden dark:block"
                priority
              />
            </div>

            {step === "credentials" ? (
              <>
                {/* Title & Subtitle */}
                <div className="space-y-1.5 text-center sm:text-left mb-6">
                  <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal">
                    SIGN IN
                  </h2>
                  <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
                    Students, SU staff and partners
                  </p>
                </div>

                {/* URL Query Error Alert */}
                {activeUrlErrorMessage && (
                  <div className="mb-5">
                    <Alert
                      variant="warning"
                      size="sm"
                      title="Notice"
                      description={activeUrlErrorMessage}
                      icon={<AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />}
                      dismissible
                      onDismiss={() => setDismissedUrlError(true)}
                    />
                  </div>
                )}

                {/* Microsoft Info Alert */}
                {microsoftInfo && (
                  <div className="mb-5">
                    <Alert
                      variant="info"
                      size="sm"
                      title="Notice"
                      description={microsoftInfo}
                      icon={<Info className="size-4 text-sky-600 dark:text-sky-400" />}
                      dismissible
                      onDismiss={() => setMicrosoftInfo(null)}
                    />
                  </div>
                )}

                {/* Error Feedback */}
                {authError && (
                  <div className="mb-5">
                    <AuthFeedback
                      variant={authError.variant}
                      message={authError.message}
                    />
                  </div>
                )}

                {/* Primary Action: Microsoft Sign In */}
                <div className="mb-6">
                  <MicrosoftSignInButton
                    disabled={isLoading}
                    onSignInError={(msg) => {
                      setMicrosoftInfo(msg);
                      setAuthError(null);
                    }}
                  />
                </div>

                {/* "or" Divider */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs tracking-wider">
                    <span className="bg-white dark:bg-zinc-900 px-3 text-ash dark:text-zinc-500 font-bold uppercase text-[11px]">
                      or sign in with email
                    </span>
                  </div>
                </div>

                {/* Email + Password Form */}
                <form onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-4" noValidate>
                  <Input
                    id="email"
                    type="email"
                    label="Email address"
                    autoComplete="email"
                    placeholder="name@nu.edu.eg"
                    disabled={isLoading}
                    leftIcon={<Mail className="size-4" />}
                    error={errors.email?.message}
                    {...register("email")}
                  />

                  <div className="space-y-1.5">
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

                    <div className="flex justify-end pt-1">
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-brand dark:text-brand-soft hover:underline min-h-[32px] inline-flex items-center"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <div className="pt-1">
                    <AuthSubmitButton
                      isLoading={isLoading}
                      loadingLabel="Signing in…"
                      variant="primary"
                      size="lg"
                      className="w-full text-sm font-bold min-h-[48px]"
                    >
                      Sign in
                    </AuthSubmitButton>
                  </div>
                </form>
              </>
            ) : (
              /* Step 2: TWO-STEP VERIFICATION */
              <div className="space-y-6 animate-in fade-in-0 duration-200">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex p-2.5 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft mb-1">
                    <ShieldCheck className="size-6" />
                  </div>
                  <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                    TWO-STEP VERIFICATION
                  </h2>
                  <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
                    {twoFactorMethod === "totp"
                      ? "Enter the 6-digit code from your authenticator app."
                      : "Enter an 8-character single-use backup code."}
                  </p>
                </div>

                {/* Error Feedback */}
                {authError && (
                  <AuthFeedback
                    variant={authError.variant}
                    message={authError.message}
                  />
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyTwoFactor();
                  }}
                  className="space-y-5"
                >
                  {twoFactorMethod === "totp" ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-center sm:text-left text-slate-700 dark:text-zinc-300">
                        Authentication Code
                      </label>
                      <PinInput
                        length={6}
                        value={totpCode}
                        onChange={(val) => {
                          setTotpCode(val);
                          if (authError) setAuthError(null);
                          if (twoFactorPinError) setTwoFactorPinError(false);
                        }}
                        onComplete={(pin) => {
                          handleVerifyTwoFactor(pin);
                        }}
                        isError={twoFactorPinError}
                        disabled={isVerifyingTwoFactor}
                        autoFocus
                        ariaLabelPrefix="Authenticator Code Digit"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        id="backup-code"
                        type="text"
                        label="Backup Code"
                        autoComplete="one-time-code"
                        placeholder="e.g. 1a2b3c4d"
                        value={backupCode}
                        onChange={(e) => {
                          setBackupCode(e.target.value);
                          if (authError) setAuthError(null);
                        }}
                        disabled={isVerifyingTwoFactor}
                        autoFocus
                        leftIcon={<KeyRound className="size-4" />}
                      />
                    </div>
                  )}

                  {/* Trust device checkbox */}
                  <div className="pt-1">
                    <Checkbox
                      id="trustDevice"
                      checked={trustDevice}
                      onCheckedChange={(checked) => setTrustDevice(Boolean(checked))}
                      label="Trust this device for 30 days"
                      description="You won't be prompted for two-step verification on this browser."
                      disabled={isVerifyingTwoFactor}
                    />
                  </div>

                  {/* Verify Action */}
                  <AuthSubmitButton
                    isLoading={isVerifyingTwoFactor}
                    loadingLabel="Verifying…"
                    variant="primary"
                    size="lg"
                    className="w-full text-sm font-bold min-h-[48px]"
                  >
                    Verify
                  </AuthSubmitButton>

                  {/* Options & Back Link */}
                  <div className="pt-2 flex flex-col items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorMethod(twoFactorMethod === "totp" ? "backup" : "totp");
                        setAuthError(null);
                        setTwoFactorPinError(false);
                      }}
                      className="text-brand dark:text-brand-soft hover:underline font-semibold min-h-[44px] px-2 flex items-center cursor-pointer"
                    >
                      {twoFactorMethod === "totp"
                        ? "Use a backup code instead"
                        : "Use authenticator app instead"}
                    </button>

                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="inline-flex items-center gap-1.5 text-ash dark:text-zinc-400 hover:text-foreground font-medium min-h-[44px] px-2 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back to sign in</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </Card>
        </main>

        {/* Right Panel Footer */}
        <footer className="w-full max-w-md mx-auto mt-6 text-center text-xs text-ash dark:text-zinc-500">
          <p>SU Card &bull; Nile University Student Union</p>
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
