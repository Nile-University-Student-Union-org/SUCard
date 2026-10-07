"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, ShieldAlert, RotateCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanResultCode } from "@/lib/vendors/types";

interface ScanInvalidPanelProps {
  code: ScanResultCode | "rate_limited" | "network_error" | string;
  resetsAt: string | null;
  onDismiss: () => void;
}

interface ReasonDetails {
  title: string;
  description: string;
  hint?: string;
  icon?: "shield" | "wifi";
}

function formatResetTime(resetsAt: string | null): string {
  if (!resetsAt) return "the next period";
  try {
    const d = new Date(resetsAt);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Cairo",
    });
  } catch {
    return "the next period";
  }
}

function getReasonDetails(
  code: string,
  resetsAt: string | null
): ReasonDetails {
  switch (code) {
    case "network_error":
      return {
        title: "Connection Error",
        description: "Could not connect to the SU Card verification server.",
        hint: "Please check your internet connection and scan again.",
        icon: "wifi",
      };
    case "not_su_card":
      return {
        title: "Not an SU Card",
        description: "This QR code is not recognized as a Nile University card.",
        hint: "Make sure the student is showing their official SU Card or wallet pass.",
      };
    case "card_not_activated":
      return {
        title: "Card Not Activated",
        description: "This physical card has not been linked to a student account yet.",
        hint: "Ask the student to sign in and scan the card to activate it first.",
      };
    case "card_cancelled":
      return {
        title: "Card Cancelled",
        description: "This card was replaced or voided by Nile University Student Union.",
        hint: "Ask the student to visit the SU office to get a replacement card.",
      };
    case "student_suspended":
      return {
        title: "Student Suspended",
        description: "This student membership is currently suspended by SU.",
        hint: "Discounts cannot be applied for suspended accounts.",
      };
    case "vendor_inactive":
      return {
        title: "Vendor Inactive",
        description: "Your store profile is currently paused or inactive on SU Card.",
        hint: "Please contact Nile University SU admin if you believe this is a mistake.",
      };
    case "no_active_offer":
      return {
        title: "No Active Offer",
        description: "There are no discounts active for your store at this time.",
        hint: "Check offer schedules or contact your store manager.",
      };
    case "limit_reached":
      return {
        title: "Offer Limit Reached",
        description: "This student has already used their discount for this period.",
        hint: `Discount resets: ${formatResetTime(resetsAt)}`,
      };
    case "rate_limited":
      return {
        title: "Scan Rate Limit",
        description: "Too many scans in a short period.",
        hint: "Please wait a moment before scanning another card.",
      };
    case "invalid_qr":
    default:
      return {
        title: "Invalid QR Code",
        description: "The code could not be verified as an SU Card.",
        hint: "Please align the QR code clearly inside the viewfinder.",
      };
  }
}

const AUTO_RETURN_SECONDS = 6;

export function ScanInvalidPanel({
  code,
  resetsAt,
  onDismiss,
}: ScanInvalidPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);
  const details = getReasonDetails(code, resetsAt);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dismissBtnRef.current?.focus();
  }, []);

  // Keyboard navigation & Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  const progressPercent = ((AUTO_RETURN_SECONDS - secondsLeft) / AUTO_RETURN_SECONDS) * 100;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invalid-title"
      aria-describedby="invalid-description"
      className="fixed inset-0 z-50 bg-[#881337] dark:bg-rose-950 text-white flex flex-col justify-between overflow-y-auto overscroll-contain motion-safe:animate-in motion-safe:fade-in-0 duration-200"
    >
      {/* Screen Reader Announcement */}
      <div aria-live="assertive" className="sr-only">
        Scan declined: {details.title}. {details.description}
      </div>

      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 sm:p-6 border-b border-white/15 bg-black/20 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-400/20 text-rose-200 border border-rose-400/30 text-xs font-bold uppercase tracking-wider">
          {details.icon === "wifi" ? (
            <WifiOff className="size-4" />
          ) : (
            <ShieldAlert className="size-4" />
          )}
          <span>Discount Declined</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close error"
          className="p-2.5 rounded-full bg-black/40 text-white/90 hover:text-white hover:bg-black/60 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-5" />
        </button>
      </header>

      {/* Main Error Body */}
      <main className="flex-1 px-6 py-8 sm:px-10 max-w-lg w-full mx-auto flex flex-col items-center justify-center text-center space-y-6">
        {/* Giant Badge */}
        <div className="size-20 sm:size-24 rounded-3xl bg-rose-600 text-white shadow-2xl shadow-rose-950/50 flex items-center justify-center motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-300 motion-reduce:transform-none">
          {details.icon === "wifi" ? (
            <WifiOff className="size-12 sm:size-14" />
          ) : (
            <X className="size-12 sm:size-14 stroke-[3.5]" />
          )}
        </div>

        {/* Reason Typography */}
        <div className="space-y-2 max-w-sm">
          <h1
            id="invalid-title"
            className="font-heading text-3xl sm:text-4xl text-white uppercase tracking-tight leading-tight drop-shadow-sm"
          >
            {details.title}
          </h1>
          <p
            id="invalid-description"
            className="text-sm sm:text-base text-rose-100 font-medium leading-relaxed"
          >
            {details.description}
          </p>
        </div>

        {/* Helpful Store Staff Hint */}
        {details.hint && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/30 border border-white/15 text-xs sm:text-sm text-rose-200 font-medium max-w-sm text-left w-full">
            <span className="font-bold text-white block mb-0.5">Note:</span>
            {details.hint}
          </div>
        )}

        {/* Countdown Badge */}
        <div className="w-full max-w-xs space-y-1.5 pt-2">
          <div className="flex justify-between text-[11px] font-semibold text-rose-200/80">
            <span>Auto-returning to camera</span>
            <span className="font-mono font-bold text-white">{secondsLeft}s</span>
          </div>
          <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-1000 ease-linear motion-reduce:transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="p-4 sm:p-6 bg-black/40 border-t border-white/15 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex flex-col gap-2.5">
          <Button
            ref={dismissBtnRef}
            variant="primary"
            size="lg"
            onClick={onDismiss}
            className="w-full min-h-[52px] h-14 sm:h-16 text-base sm:text-lg font-heading uppercase tracking-wider bg-white text-rose-950 hover:bg-rose-50 active:scale-[0.98] shadow-xl shadow-black/30 font-bold border-none cursor-pointer"
          >
            <RotateCcw className="size-5 mr-2 stroke-[2.5]" />
            <span>Scan next card</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
