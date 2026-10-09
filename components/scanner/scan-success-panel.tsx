"use client";

import React, { useEffect, useState, useRef } from "react";
import { Check, Clock, QrCode, X, CheckCircle2, Pause, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface ScanSuccessPanelProps {
  studentName: string;
  universityId: string;
  offerTitle: string;
  discountLabel: string;
  billAmount: string | number | null;
  confirmedAt: string;
  onDismiss: () => void;
}

const AUTO_RETURN_SECONDS = 6;

function formatConfirmationTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Cairo",
    });
  } catch {
    return isoString;
  }
}

function formatBillAmount(amount: string | number | null): string | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) return null;
  return `EGP ${num.toFixed(2)}`;
}

export function ScanSuccessPanel({
  studentName,
  universityId,
  offerTitle,
  discountLabel,
  billAmount,
  confirmedAt,
  onDismiss,
}: ScanSuccessPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);
  const [isStayActive, setIsStayActive] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scanNextBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the primary "Scan next" button on mount
  useEffect(() => {
    scanNextBtnRef.current?.focus();
  }, []);

  // Keyboard shortcuts and focus trap
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

  // Auto-return countdown timer (disabled if "Stay" was clicked)
  useEffect(() => {
    if (isStayActive) return;

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
  }, [isStayActive, onDismiss]);

  const handleStay = () => {
    setIsStayActive(true);
  };

  const formattedBill = formatBillAmount(billAmount);
  const formattedTime = formatConfirmationTime(confirmedAt);
  const progressPercent = ((AUTO_RETURN_SECONDS - secondsLeft) / AUTO_RETURN_SECONDS) * 100;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      aria-describedby="success-details"
      className="fixed inset-0 z-50 bg-background text-foreground flex flex-col justify-between overflow-y-auto overscroll-contain motion-safe:animate-in motion-safe:fade-in-0 duration-200"
    >
      {/* Screen Reader Live Announcement */}
      <div aria-live="assertive" className="sr-only">
        Discount {discountLabel} applied successfully for {studentName}, ID {universityId}.
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border bg-card/95 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="size-4" />
          <span>Discount Applied</span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close and return to scanner"
          className="p-2.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-[transform,background-color,color] duration-140 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="size-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6 sm:px-8 max-w-lg w-full mx-auto flex flex-col items-center justify-center text-center space-y-6">
        {/* Animated Success Check Badge (Transform & Opacity only, motion-reduce safe) */}
        <div className="relative">
          {/* Subtle Ambient Pulse Ring */}
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-[32px] bg-emerald-500/20 blur-md animate-ring-pulse motion-reduce:opacity-0"
          />

          <div
            className={cn(
              "relative size-20 sm:size-24 rounded-3xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 flex items-center justify-center",
              "animate-check-pop"
            )}
          >
            <Check className="size-12 sm:size-14 stroke-[3.5]" />
          </div>
        </div>

        {/* Heading & Student Info */}
        <div className="space-y-1.5 w-full">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Redemption Recorded</span>
          </div>

          <h1
            id="success-title"
            className="font-heading text-3xl sm:text-4xl text-foreground uppercase tracking-wide leading-tight truncate drop-shadow-xs px-2"
          >
            {studentName}
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-muted-foreground font-mono text-xs sm:text-sm font-bold tracking-wider border border-border">
            <span>ID:</span>
            <span className="tabular-nums text-foreground">{universityId}</span>
          </div>
        </div>

        {/* Discount Summary Card */}
        <section
          id="success-details"
          aria-label="Redemption summary"
          className="w-full max-w-sm rounded-2xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-3.5 text-left"
        >
          {/* Applied Offer Banner */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Applied Offer
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-heading text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 leading-none tracking-wide">
                {discountLabel}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground line-clamp-2 pt-0.5">
              {offerTitle}
            </p>
          </div>

          {/* Bill & Timestamp Metadata Grid */}
          <div className="pt-2 border-t border-border grid grid-cols-2 gap-3 text-xs">
            {formattedBill ? (
              <div>
                <span className="text-muted-foreground font-medium block">Bill Amount</span>
                <span className="font-mono text-sm sm:text-base font-bold text-foreground">
                  {formattedBill}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground font-medium block">Bill Amount</span>
                <span className="text-muted-foreground font-semibold">Standard scan</span>
              </div>
            )}

            <div>
              <span className="text-muted-foreground font-medium block">Time (Cairo)</span>
              <div className="font-mono text-xs sm:text-sm font-bold text-foreground inline-flex items-center gap-1">
                <Clock className="size-3.5 text-muted-foreground shrink-0" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Auto-Return Countdown & Stay Controller */}
        <div className="w-full max-w-sm space-y-2 pt-1">
          {!isStayActive ? (
            <>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span>Auto-returning to camera</span>
                  <span className="font-mono font-bold text-foreground">{secondsLeft}s</span>
                </span>

                <button
                  type="button"
                  onClick={handleStay}
                  className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 border border-border min-h-[44px]"
                >
                  <Pause className="size-3.5" />
                  <span>Stay</span>
                </button>
              </div>

              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear motion-reduce:transition-none"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs font-medium text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full min-h-[44px]">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              <span>Auto-return paused — tap below when ready</span>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="sticky bottom-0 z-10 p-4 sm:p-6 bg-card/95 border-t border-border backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto w-full">
          <Button
            ref={scanNextBtnRef}
            variant="primary"
            size="lg"
            onClick={onDismiss}
            className="w-full min-h-[52px] h-14 sm:h-16 text-base sm:text-lg font-heading uppercase tracking-wider shadow-xl font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            <QrCode className="size-5.5 mr-1" />
            <span>Scan next card</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
