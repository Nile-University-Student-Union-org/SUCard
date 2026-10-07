"use client";

import React, { useEffect, useState } from "react";
import { X, ShieldAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanResultCode } from "@/lib/vendors/types";

interface ScanInvalidPanelProps {
  code: ScanResultCode | "rate_limited" | string;
  resetsAt: string | null;
  onDismiss: () => void;
}

interface ReasonDetails {
  title: string;
  description: string;
  hint?: string;
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
        description: `This student has already used their discount for this period.`,
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
    <div className="fixed inset-0 z-50 bg-[#881337] text-white flex flex-col justify-between overflow-y-auto overscroll-contain animate-in fade-in-0 duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/15 bg-black/20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-400/20 text-rose-200 border border-rose-400/30 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="size-4" />
          <span>Discount Declined</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close error"
          className="p-2.5 rounded-full bg-black/40 text-white/90 hover:text-white hover:bg-black/60 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main Error Body */}
      <div className="flex-1 px-6 py-8 sm:px-10 max-w-lg w-full mx-auto flex flex-col items-center justify-center text-center space-y-6">
        {/* Giant ✕ Badge */}
        <div className="size-20 sm:size-24 rounded-3xl bg-rose-600 text-white shadow-2xl shadow-rose-950/50 flex items-center justify-center animate-in zoom-in-75 duration-300">
          <X className="size-12 sm:size-14 stroke-[3.5]" />
        </div>

        {/* Reason Typography */}
        <div className="space-y-2 max-w-sm">
          <h2 className="font-heading text-3xl sm:text-4xl text-white uppercase tracking-tight leading-tight drop-shadow-sm">
            {details.title}
          </h2>
          <p className="text-sm sm:text-base text-rose-100 font-medium leading-relaxed">
            {details.description}
          </p>
        </div>

        {/* Helpful Store Staff Hint */}
        {details.hint && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/30 border border-white/15 text-xs sm:text-sm text-rose-200 font-medium max-w-sm text-left">
            <span className="font-bold text-white block mb-0.5">Note:</span>
            {details.hint}
          </div>
        )}

        {/* Countdown Badge */}
        <div className="w-full max-w-xs space-y-1.5 pt-2">
          <div className="flex justify-between text-[11px] font-semibold text-rose-200/80">
            <span>Auto-returning to camera</span>
            <span>{secondsLeft}s</span>
          </div>
          <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 sm:p-6 bg-black/40 border-t border-white/15 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={onDismiss}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-heading uppercase tracking-wider bg-white text-rose-950 hover:bg-rose-50 active:scale-[0.98] shadow-xl shadow-black/30 font-bold border-none cursor-pointer"
          >
            <RotateCcw className="size-5 mr-2 stroke-[2.5]" />
            <span>Scan next card</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
