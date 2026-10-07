"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Download,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { type StaffUser } from "@/lib/auth/guards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthFeedback } from "@/components/ui/auth-feedback";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { AuthLayout } from "@/components/ui/auth-layout";
import { cn } from "cn";

interface TwoFactorSetupWizardProps {
  admin: StaffUser;
}

type SetupStep = 1 | 2 | 3;

function extractSecretKey(totpURI: string): string {
  if (!totpURI) return "";
  try {
    const url = new URL(totpURI);
    const secret = url.searchParams.get("secret");
    if (secret) return secret;
  } catch {
    // Fallback regex
  }
  const match = totpURI.match(/[?&]secret=([A-Z0-9]+)/i);
  return match && match[1] ? match[1] : "";
}

export function TwoFactorSetupWizard({ admin }: TwoFactorSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);

  // Step 1 State: Password confirmation
  const [password, setPassword] = useState("");
  const [isEnabling, setIsEnabling] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);

  // Step 2 State: QR Code & Verification
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isPinError, setIsPinError] = useState(false);
  const [isSecretCopied, setIsSecretCopied] = useState(false);

  // Step 3 State: Backup Codes Confirmation
  const [hasSavedCodes, setHasSavedCodes] = useState(false);
  const [areCodesCopied, setAreCodesCopied] = useState(false);

  const secretKey = extractSecretKey(totpURI);

  // Generate QR code data URL when totpURI changes
  useEffect(() => {
    if (totpURI) {
      let isCurrent = true;
      QRCode.toDataURL(totpURI, {
        width: 240,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => {
          if (isCurrent) setQrDataUrl(url);
        })
        .catch(() => {});
      return () => {
        isCurrent = false;
      };
    }
  }, [totpURI]);

  // Step 1 Submit: Enable 2FA
  const handleEnableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setEnableError("Please enter your current password");
      return;
    }

    setIsEnabling(true);
    setEnableError(null);

    try {
      const res = await authClient.twoFactor.enable({
        password,
      });

      if (res.error) {
        const msg = res.error.message || "";
        if (res.error.status === 429 || msg.toLowerCase().includes("too many")) {
          setEnableError("Too many attempts. Please wait a minute and try again.");
        } else {
          setEnableError(msg || "Incorrect password. Please verify and try again.");
        }
        setIsEnabling(false);
        return;
      }

      const data = res.data;
      if (data && "totpURI" in data) {
        setTotpURI(data.totpURI);
        setBackupCodes(data.backupCodes || []);
        setCurrentStep(2);
      } else {
        setEnableError("Unexpected response from server. Please try again.");
      }
    } catch (err) {
      setEnableError(err instanceof Error ? err.message : "Failed to initiate two-step verification.");
    } finally {
      setIsEnabling(false);
    }
  };

  // Step 2 Submit: Verify TOTP code
  const handleVerifySubmit = async (codeToVerify?: string) => {
    const code = (codeToVerify || verificationCode).trim();
    if (code.length < 6) {
      setVerifyError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setIsPinError(false);

    try {
      const res = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: true,
      });

      if (res.error) {
        const msg = res.error.message || "";
        setIsPinError(true);
        if (res.error.status === 429 || msg.toLowerCase().includes("too many")) {
          setVerifyError("Too many attempts. Please wait a minute before trying again.");
        } else {
          setVerifyError("Invalid verification code. Check the code in your authenticator app and try again.");
        }
        setIsVerifying(false);
        return;
      }

      // Success -> move to Step 3 (Backup Codes)
      setCurrentStep(3);
    } catch (err) {
      setIsPinError(true);
      setVerifyError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Copy manual entry secret
  const handleCopySecret = () => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey).then(() => {
      setIsSecretCopied(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setIsSecretCopied(false), 2500);
    });
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    if (!backupCodes || backupCodes.length === 0) return;
    const content = `SU Card Admin — Two-Factor Backup Codes\nAccount: ${admin.email}\nGenerated: ${new Date().toISOString()}\n\n` +
      backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n") +
      `\n\nEach code can only be used once. Store these codes in a secure location.`;

    navigator.clipboard.writeText(content).then(() => {
      setAreCodesCopied(true);
      toast.success("Backup codes copied to clipboard");
      setTimeout(() => setAreCodesCopied(false), 2500);
    });
  };

  // Download backup codes as .txt
  const handleDownloadBackupCodes = () => {
    if (!backupCodes || backupCodes.length === 0) return;
    const content = `SU Card Admin — Two-Factor Backup Codes\nAccount: ${admin.email}\nGenerated: ${new Date().toISOString()}\n\n` +
      backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n") +
      `\n\nEach code can only be used once. Store these codes in a secure location.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `su-card-backup-codes-${admin.email.split("@")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  // Format secret into groups of 4
  const formattedSecret = secretKey.match(/.{1,4}/g)?.join(" ") || secretKey;

  return (
    <AuthLayout
      backHref="/login"
      backLabel="Sign out"
      maxWidth="lg"
    >
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-8">
        {/* Step Progress Tracker */}
        <div className="mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400 mb-2">
            <span>Two-Step Verification Setup</span>
            <span className="text-brand dark:text-brand-soft">Step {currentStep} of 3</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStep >= 1 ? "bg-brand" : "bg-slate-200 dark:bg-zinc-800")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStep >= 2 ? "bg-brand" : "bg-slate-200 dark:bg-zinc-800")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStep >= 3 ? "bg-brand" : "bg-slate-200 dark:bg-zinc-800")} />
          </div>
        </div>

        {/* STEP 1: EXPLANATION & PASSWORD CONFIRMATION */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            <div className="space-y-2 text-center sm:text-left">
              <div className="size-12 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs mb-1">
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                PROTECT YOUR ACCOUNT
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium leading-relaxed">
                Nile University Student Union requires two-step verification for all administrator accounts to protect student data and vendor discounts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs space-y-2">
              <p className="font-bold text-foreground">You will need an authenticator app:</p>
              <ul className="list-disc list-inside space-y-1 text-ash dark:text-zinc-400">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>1Password / Bitwarden / Apple Passwords</li>
              </ul>
            </div>

            {enableError && (
              <AuthFeedback variant="error" message={enableError} />
            )}

            <form onSubmit={handleEnableSubmit} className="space-y-4" noValidate>
              <Input
                id="setup-current-password"
                type="password"
                label="Confirm your password to continue"
                autoComplete="current-password"
                placeholder="••••••••••••"
                disabled={isEnabling}
                showPasswordToggle
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (enableError) setEnableError(null);
                }}
                autoFocus
              />

              <div className="pt-2">
                <AuthSubmitButton
                  isLoading={isEnabling}
                  loadingLabel="Starting setup…"
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-bold min-h-[48px]"
                >
                  Continue to setup
                </AuthSubmitButton>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: SCAN QR CODE & ENTER CODE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            <div className="space-y-2 text-center sm:text-left">
              <div className="size-12 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs mb-1">
                <QrCode className="size-6" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                SCAN QR CODE
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
                Scan this QR code with your authenticator app, then enter the 6-digit verification code below.
              </p>
            </div>

            {verifyError && (
              <AuthFeedback variant="error" message={verifyError} />
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-200 dark:border-zinc-700/80 text-center space-y-4">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                  <Image
                    src={qrDataUrl}
                    alt="Two-Factor Setup QR Code"
                    width={220}
                    height={220}
                    className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] object-contain rounded-lg"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-[220px] h-[220px] rounded-2xl bg-slate-200 dark:bg-zinc-700 animate-pulse" />
              )}

              {/* Mobile direct link */}
              {totpURI && (
                <a
                  href={totpURI}
                  className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft text-xs font-bold min-h-[44px]"
                >
                  <Smartphone className="size-4" />
                  <span>Open in authenticator app</span>
                  <ExternalLink className="size-3.5 ml-0.5" />
                </a>
              )}

              {/* Manual Entry Secret */}
              {secretKey && (
                <div className="w-full max-w-sm space-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
                    <span>Can&apos;t scan? Enter key manually:</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                    <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-charcoal dark:text-zinc-200 select-all truncate pl-1">
                      {formattedSecret}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-2 rounded-lg text-ash dark:text-zinc-400 hover:text-brand dark:hover:text-brand-soft hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      aria-label="Copy secret key"
                    >
                      {isSecretCopied ? (
                        <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6-Digit Verification Code Form */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-center sm:text-left text-slate-700 dark:text-zinc-300">
                Enter 6-Digit Authenticator Code
              </label>
              <PinInput
                length={6}
                value={verificationCode}
                onChange={(val) => {
                  setVerificationCode(val);
                  if (verifyError) setVerifyError(null);
                  if (isPinError) setIsPinError(false);
                }}
                onComplete={(pin) => {
                  handleVerifySubmit(pin);
                }}
                isError={isPinError}
                disabled={isVerifying}
                autoFocus
                ariaLabelPrefix="Authenticator Code Digit"
              />
            </div>

            <div className="pt-2">
              <AuthSubmitButton
                isLoading={isVerifying}
                loadingLabel="Verifying code…"
                variant="primary"
                size="lg"
                onClick={() => handleVerifySubmit()}
                disabled={verificationCode.length < 6 || isVerifying}
                className="w-full text-sm font-bold min-h-[48px]"
              >
                Verify &amp; activate
              </AuthSubmitButton>
            </div>
          </div>
        )}

        {/* STEP 3: BACKUP CODES GRID & CONFIRMATION */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in-0 duration-200">
            <div className="space-y-2 text-center sm:text-left">
              <div className="size-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0 shadow-xs mb-1">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
                SAVE YOUR BACKUP CODES
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium leading-relaxed">
                Two-step verification is now enabled. Save these backup codes in a secure password manager. If you lose access to your authenticator app, each code can be used once to sign in.
              </p>
            </div>

            {/* Backup Codes Grid */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-200 dark:border-zinc-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
                  Single-Use Backup Codes ({backupCodes.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBackupCodes}
                    className="normal-case text-xs font-bold h-9 px-3"
                  >
                    {areCodesCopied ? (
                      <>
                        <Check className="size-3.5 mr-1 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" />
                        <span>Copy all</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBackupCodes}
                    className="normal-case text-xs font-bold h-9 px-3"
                  >
                    <Download className="size-3.5 mr-1" />
                    <span>Download .txt</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono text-xs sm:text-sm font-bold tracking-wider text-charcoal dark:text-zinc-200 select-all"
                  >
                    <span className="text-ash dark:text-zinc-500 font-sans text-[11px] font-medium mr-1.5">
                      {idx + 1}.
                    </span>
                    <span className="truncate">{code}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>These codes will NOT be displayed again. If you lose your phone and don&apos;t have backup codes, an SU super admin will need to reset your 2FA.</span>
              </div>
            </div>

            {/* Mandatory Checkbox */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <Checkbox
                id="saved-backup-codes"
                checked={hasSavedCodes}
                onCheckedChange={(checked) => setHasSavedCodes(Boolean(checked))}
                label="I have saved my backup codes in a secure location"
                description="Required to proceed to the SU Card admin console."
              />
            </div>

            {/* Continue to Admin button */}
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={!hasSavedCodes}
                onClick={() => {
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.assign("/go");
                }}
                className="w-full text-sm font-bold min-h-[48px] normal-case"
              >
                Continue to Admin Console
              </Button>
            </div>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}
