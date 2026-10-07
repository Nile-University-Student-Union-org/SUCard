"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Info, AlertTriangle, KeyRound, ShieldCheck, Sparkles, QrCode, Wallet, Tag } from "lucide-react";
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
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-b from-[#0F3056] via-[#0D2849] to-[#0A1E38] text-white flex-col justify-between p-8 xl:p-10 overflow-hidden border-r border-[#0A2240] shadow-2xl">
        {/* Background decorative dot-grid texture & ambient glows/rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Dot-grid texture with radial fade mask */}
          <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_20%,transparent_75%)]" />

          {/* Ambient soft glows */}
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-[#018BCE]/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-80 rounded-full bg-[#0F548D]/25 blur-3xl" />

          {/* Subtle concentric rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[460px] rounded-full border border-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[320px] rounded-full border border-white/[0.06]" />
        </div>

        {/* Top: Nile University Student Union Logo */}
        <div className="relative z-10 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
          >
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="Nile University Student Union"
              width={160}
              height={48}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 flex flex-col items-center my-auto w-full max-w-sm mx-auto space-y-6 xl:space-y-7">
          {/* Hero SU Card: tilted, softly floating with ambient glow & contact shadow */}
          <div className="relative w-full max-w-[300px] xl:max-w-[320px] mx-auto select-none pointer-events-none">
            {/* Ambient Glow behind card */}
            <div
              className="absolute -inset-3 bg-gradient-to-r from-sky-400/20 via-brand-soft/25 to-sky-500/20 rounded-[24px] blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Floating Card Container */}
            <div className="motion-safe:animate-[phone-float_7s_ease-in-out_infinite] relative">
              {/* The Card */}
              <div
                className="relative aspect-[1.585/1] w-full rounded-2xl p-4 sm:p-5 text-white overflow-hidden border border-white/20 shadow-2xl -rotate-6"
                style={{
                  background: "linear-gradient(135deg, #081E38 0%, #0F3056 48%, #0F548D 100%)",
                  boxShadow: "0 20px 40px -12px rgba(8, 26, 48, 0.7), 0 0 30px rgba(1, 139, 206, 0.22)",
                }}
              >
                {/* Holographic vertical strip */}
                <div
                  className="absolute top-0 bottom-0 left-5 w-4 opacity-35 bg-gradient-to-b from-sky-400 via-emerald-300 via-amber-300 via-pink-400 to-indigo-400 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Ambient internal card glow */}
                <div
                  className="absolute -top-8 -right-8 size-28 rounded-full bg-sky-400/25 blur-xl pointer-events-none"
                  aria-hidden="true"
                />

                {/* Card Top: Logo & Student Chip */}
                <div className="relative z-10 flex items-center justify-between">
                  <Image
                    src="/brand/su-logo-white@hd.png"
                    alt="NUSU Logo"
                    width={110}
                    height={32}
                    className="h-5.5 w-auto object-contain"
                  />
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/25 border border-sky-400/40 text-[9px] font-bold text-sky-100 tracking-wider">
                    <Sparkles className="size-2.5 text-sky-300" />
                    <span>STUDENT</span>
                  </div>
                </div>

                {/* Card Bottom: SU Card Title + QR code block */}
                <div className="relative z-10 mt-4 sm:mt-5 flex items-end justify-between">
                  <div>
                    <h2 className="font-heading text-3xl xl:text-4xl text-white tracking-wider leading-none font-normal drop-shadow-sm">
                      SU CARD
                    </h2>
                    <p className="text-[9px] font-semibold text-sky-200/90 tracking-wider uppercase mt-1">
                      Nile University Student Union
                    </p>
                  </div>

                  {/* QR Placeholder Block */}
                  <div className="size-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0">
                    <QrCode className="size-full text-[#0F3056]" />
                  </div>
                </div>

                {/* Card Footer strip */}
                <div className="relative z-10 mt-2.5 pt-1.5 border-t border-white/15 flex items-center justify-between text-[8px] text-sky-200/75 font-medium tracking-wide">
                  <span>DIGITAL &amp; PHYSICAL CARD</span>
                  <span className="font-mono text-[7.5px] text-sky-300">SCAN TO VERIFY</span>
                </div>
              </div>

              {/* Contact Shadow beneath tilted card */}
              <div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-black/40 blur-lg rounded-full pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Hero Copy: Eyebrow + Gradient Headline + Subtitle */}
          <div className="w-full space-y-2 text-left">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase text-macaw-blue">
              <span aria-hidden="true" className="h-px w-5 bg-current" />
              <span>Nile University Student Union</span>
            </p>
            <h1 className="font-heading text-2xl xl:text-3xl uppercase tracking-wider text-white font-normal leading-tight">
              Your student card,{" "}
              <span className="bg-gradient-to-r from-brand-soft to-macaw-blue bg-clip-text text-transparent">
                one tap away
              </span>
            </h1>
            <p className="text-xs xl:text-sm text-sky-100/85 leading-relaxed font-normal">
              Digital &amp; physical membership for campus access and student savings.
            </p>
          </div>

          {/* Feature Rows */}
          <div className="w-full space-y-2.5 pt-1">
            <div className="flex items-center gap-3">
              <div className="size-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-sky-300 shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <span className="text-xs font-medium text-sky-100/95">
                Verified with your NU account
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-sky-300 shrink-0">
                <Wallet className="size-4" />
              </div>
              <span className="text-xs font-medium text-sky-100/95">
                Add to Google Wallet
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-sky-300 shrink-0">
                <Tag className="size-4" />
              </div>
              <span className="text-xs font-medium text-sky-100/95">
                Discounts at partner stores
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-sky-200/60">
          <span>&copy; {new Date().getFullYear()} Nile University Student Union</span>
          <span className="font-mono text-[10px] text-sky-300/50">NUSU</span>
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
                {/* Title */}
                <div className="space-y-1.5 text-center sm:text-left mb-6">
                  <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal">
                    SIGN IN
                  </h2>
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
