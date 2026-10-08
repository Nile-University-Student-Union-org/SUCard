"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  CreditCard,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  RotateCcw,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import type { StudentHomeResponse } from "@/lib/student/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { StatusState } from "@/components/ui/status-state";
import { CardScanner } from "./card-scanner";
import { WalletQrModal } from "./wallet-qr-modal";

const emptySubscribe = () => () => {};

/**
 * Official Google Wallet brand mark — multicolour geometric wallet icon
 */
export function GoogleWalletLogo({ className = "h-5 w-auto shrink-0" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="18" rx="4" fill="#202124" />
      {/* Layered Google Wallet cards in official Google 4-color palette */}
      <path d="M4 6.5C4 5.12 5.12 4 6.5 4H17.5C18.88 4 20 5.12 20 6.5V8H4V6.5Z" fill="#4285F4" />
      <path d="M4 8C4 7 5 6 6.5 6H17.5C19 6 20 7 20 8V10H4V8Z" fill="#EA4335" />
      <path d="M4 10C4 9 5 8 6.5 8H17.5C19 8 20 9 20 10V12H4V10Z" fill="#FBBC04" />
      <path d="M4 12C4 11 5 10 6.5 10H17.5C19 10 20 11 20 12V17.5C20 18.88 18.88 20 17.5 20H6.5C5.12 20 4 18.88 4 17.5V12Z" fill="#34A853" />
      <circle cx="16" cy="15" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

interface StudentCardViewProps {
  home: StudentHomeResponse;
  qrSvg: string | null;
}

export function StudentCardView({ home, qrSvg }: StudentCardViewProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletQrUrl, setWalletQrUrl] = useState<string | null>(null);
  const [walletNotice, setWalletNotice] = useState<{
    variant: "info" | "warning" | "destructive";
    message: string;
  } | null>(null);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const isIos = mounted
    ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
    : false;

  const handleAddToGoogleWallet = async () => {
    setWalletLoading(true);
    setWalletNotice(null);

    try {
      const res = await fetch("/api/student/wallet/google", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 503 || data.code === "wallet_unavailable") {
          setWalletNotice({
            variant: "info",
            message: "Google Wallet isn't available yet.",
          });
        } else if (res.status === 502) {
          setWalletNotice({
            variant: "warning",
            message: "Google Wallet is unavailable right now. Try again later.",
          });
        } else if (res.status === 409 || data.code === "no_card") {
          setWalletNotice({
            variant: "warning",
            message: "No active card linked.",
          });
        } else {
          setWalletNotice({
            variant: "destructive",
            message: data.error || "Failed to generate Google Wallet pass.",
          });
        }
        setWalletLoading(false);
        return;
      }

      if (data.saveUrl) {
        // On a phone, open Google Wallet directly; on a computer, show a QR to scan with the phone.
        if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
          window.location.assign(data.saveUrl);
        } else {
          setWalletQrUrl(data.saveUrl);
          setWalletLoading(false);
        }
      } else {
        setWalletNotice({
          variant: "warning",
          message: "Google Wallet pass URL was not provided.",
        });
        setWalletLoading(false);
      }
    } catch {
      setWalletNotice({
        variant: "destructive",
        message: "Google Wallet is unavailable right now. Try again later.",
      });
      setWalletLoading(false);
    }
  };

  const formatLinkedDate = (isoString: string | null) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Cairo",
      });
    } catch {
      return null;
    }
  };

  // 1. Profile Suspended State
  if (home.profile.status === "suspended") {
    return (
      <div className="w-full my-auto py-6 max-w-md mx-auto">
        <StatusState
          layout="panel"
          variant="destructive"
          icon={<ShieldAlert className="size-8 text-rose-600 dark:text-rose-400" />}
          title="CARD SUSPENDED"
          description={
            home.profile.suspendReason ||
            "Your SU Card has been suspended. Please contact the Nile University Student Union office."
          }
        >
          <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-muted/60 border border-border text-left space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <MapPin className="size-4 text-brand dark:text-brand-soft shrink-0" />
              <span>{home.office.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Clock className="size-4 text-ash dark:text-zinc-400 shrink-0" />
              <span>{home.office.hours}</span>
            </div>
          </div>
        </StatusState>
      </div>
    );
  }

  // 2. Physical Flow with No Card yet ("GET YOUR SU CARD")
  if (home.flow === "physical" && !home.card) {
    return (
      <div className="w-full my-auto py-4 space-y-6 max-w-md mx-auto">
        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs">
                <CreditCard className="size-6" />
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white leading-tight">
                GET YOUR SU CARD
              </h1>
              <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
                Collect your physical Nile University Student Union membership card from the SU office.
              </p>
            </div>

            {/* Office Info Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
                Pickup Location &amp; Hours
              </span>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-foreground font-bold">
                  <MapPin className="size-4 text-brand dark:text-brand-soft shrink-0" />
                  <span>{home.office.location}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                  <Clock className="size-4 text-ash dark:text-zinc-400 shrink-0" />
                  <span>{home.office.hours}</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsScannerOpen(true)}
                className="w-full text-sm font-bold min-h-[48px] normal-case shadow-xs"
              >
                <QrCode className="size-4 mr-2" />
                I have my card — scan it
              </Button>
              <p className="text-center text-[11px] font-medium text-ash dark:text-zinc-500">
                Once received, scan the QR code on the back to activate it instantly.
              </p>
            </div>
          </div>
        </Card>

        <CardScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={() => {
            setIsScannerOpen(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // 3. Digital Flow with No Card (fallback edge case)
  if (!home.card) {
    return (
      <div className="w-full my-auto py-6 max-w-md mx-auto">
        <StatusState
          layout="panel"
          variant="brand"
          icon={<RotateCcw className="size-8 text-brand dark:text-brand-soft animate-spin" />}
          title="YOUR CARD IS BEING PREPARED"
          description="Your digital membership card is being issued. Please refresh in a moment."
          actions={
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="normal-case font-bold"
            >
              Refresh Status
            </Button>
          }
        />
      </div>
    );
  }

  // 4. Active Card State -> THE WEB CARD
  const linkedDate = formatLinkedDate(home.card.linkedAt);

  return (
    <div className="w-full my-auto py-4 space-y-6 max-w-[360px] sm:max-w-[400px] mx-auto">
      {/* 1. THE PREMIUM WEB CARD PANEL */}
      <div className="relative w-full rounded-[28px] p-5 sm:p-6 bg-[#0F3056] text-white shadow-2xl shadow-[#0F3056]/30 dark:shadow-black/60 border-2 border-[#0F548D]/60 ring-1 ring-inset ring-white/15 overflow-hidden flex flex-col justify-between select-none motion-reduce:transition-none transition-all duration-300">
        {/* Subtle Sky and Brand Arc Background Vectors Echoing NUSU Curves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#018BCE]/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#0F548D]/40 blur-3xl" />

          {/* Geometric Brand Arcs echoing NUSU logo shapes */}
          <svg
            className="absolute inset-0 w-full h-full opacity-15"
            viewBox="0 0 360 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="320" cy="80" r="140" stroke="#018BCE" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="320" cy="80" r="180" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="40" cy="420" r="120" stroke="#018BCE" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="40" cy="420" r="160" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.2" />
          </svg>
        </div>

        {/* Card Top Branding Header: NUSU Logo + "SU CARD" Wordmark */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="NUSU"
              width={100}
              height={28}
              className="h-6 sm:h-7 w-auto object-contain"
              priority
            />
            <div className="w-[1px] h-5 bg-white/20" aria-hidden="true" />
            <span className="font-heading text-xl sm:text-2xl uppercase tracking-[0.08em] text-white leading-none">
              SU CARD
            </span>
          </div>
        </div>

        {/* Centered High-Contrast QR Code Box (Scan-Safe Quiet Zone) */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1">
          <div className="w-full max-w-[250px] sm:max-w-[270px] aspect-square bg-white rounded-2xl p-3.5 sm:p-4 shadow-2xl ring-4 ring-black/10 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain">
            {qrSvg ? (
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="text-[#0F3056] font-bold text-xs">QR Code</div>
            )}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-100 text-center mt-3 drop-shadow-xs">
            Show this at partner stores
          </p>
        </div>

        {/* Card Bottom: Student Identity — Two-line name readability without truncation */}
        <div className="relative z-10 pt-4 mt-3 border-t border-white/15 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg sm:text-xl uppercase tracking-wide text-white leading-tight break-words line-clamp-2">
              {home.name}
            </h2>
            <p className="text-xs sm:text-sm font-mono font-bold text-sky-200 tracking-wider mt-1">
              ID {home.profile.universityId}
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTIONS & WALLET SECTION */}
      <div className="space-y-4">
        {walletNotice && (
          <Alert
            variant={walletNotice.variant}
            size="sm"
            description={walletNotice.message}
            dismissible
            onDismiss={() => setWalletNotice(null)}
          />
        )}

        {/* Google Wallet / Apple Wallet CTA */}
        {isIos ? (
          /* Apple Wallet Coming Soon Info Notice with direct Show Web Card action */
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-2.5 shadow-2xs">
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              Apple Wallet is in development. Your active SU Card above is ready for scanning at all partner spots.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                });
              }}
              className="text-xs font-bold min-h-[44px] normal-case border-slate-300 dark:border-zinc-700"
            >
              <CreditCard className="size-4 mr-1.5" />
              Show web card
            </Button>
          </div>
        ) : (
          /* Google Wallet Official Button Guideline Pill */
          <button
            type="button"
            onClick={handleAddToGoogleWallet}
            disabled={walletLoading}
            aria-label="Add to Google Wallet"
            className="w-full min-h-[48px] px-5 py-3 rounded-full bg-black text-white hover:bg-[#1f1f1f] active:bg-[#2b2b2b] border border-white/20 dark:border-white/25 shadow-md flex items-center justify-center gap-3 font-medium text-sm sm:text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none transition-all active:scale-[0.99] motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
          >
            {walletLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-white motion-reduce:animate-none" />
                <span>Connecting to Google Wallet…</span>
              </>
            ) : (
              <>
                <GoogleWalletLogo />
                <span>Add to Google Wallet</span>
              </>
            )}
          </button>
        )}

        <WalletQrModal saveUrl={walletQrUrl} onClose={() => setWalletQrUrl(null)} />

        {/* Card Metadata Details */}
        <div className="flex items-center justify-between px-3 py-2 text-xs text-ash dark:text-zinc-400 font-medium border-t border-slate-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <CreditCard className="size-3.5 text-ash dark:text-zinc-400 shrink-0" />
            <span>
              {home.card.type === "digital" ? "Digital card" : "Physical card"}
            </span>
          </div>
          {linkedDate && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <Calendar className="size-3 text-ash dark:text-zinc-400 shrink-0" />
              <span>Linked on {linkedDate}</span>
            </div>
          )}
        </div>

        {/* Secondary: Link Physical Card Option (for digital cards upgrade) */}
        {home.card.type === "digital" && (
          <div className="text-center pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScannerOpen(true)}
              className="text-xs font-bold text-brand dark:text-brand-soft border-slate-200 dark:border-zinc-700 min-h-[44px] normal-case"
            >
              <QrCode className="size-3.5 mr-1.5" />
              Upgrade to physical card
            </Button>
          </div>
        )}
      </div>

      <CardScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => {
          setIsScannerOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
