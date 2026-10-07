"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import type { ScanOffer } from "@/lib/vendors/types";

interface ScanValidPanelProps {
  studentName: string;
  universityId: string;
  offers: ScanOffer[];
  onConfirm: (offerId: string, billAmount?: number) => Promise<void>;
  onCancel: () => void;
  isConfirming: boolean;
}

function formatRemainingUses(remainingUses: number | null): string {
  if (remainingUses === null) return "Unlimited uses";
  if (remainingUses === 1) return "1 use left";
  return `${remainingUses} uses left`;
}

function formatResetDate(resetsAt: string | null): string {
  if (!resetsAt) return "next period";
  try {
    const d = new Date(resetsAt);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Cairo",
    });
  } catch {
    return "next period";
  }
}

export function ScanValidPanel({
  studentName,
  universityId,
  offers,
  onConfirm,
  onCancel,
  isConfirming,
}: ScanValidPanelProps) {
  // Find usable offers
  const usableOffers = offers.filter(
    (o) => o.remainingUses === null || o.remainingUses > 0
  );

  // Preselect single offer or the first usable offer
  const [selectedOfferId, setSelectedOfferId] = useState<string>(() => {
    if (usableOffers.length > 0) return usableOffers[0].id;
    return offers[0]?.id || "";
  });

  const [billAmount, setBillAmount] = useState<string>("");
  const [billError, setBillError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const firstUsableOfferRef = useRef<HTMLDivElement>(null);

  // Auto-focus confirm button if single offer available, else focus the selected/first offer
  useEffect(() => {
    if (usableOffers.length === 1 && selectedOfferId) {
      confirmBtnRef.current?.focus();
    } else {
      firstUsableOfferRef.current?.focus();
    }
  }, [usableOffers.length, selectedOfferId]);

  // Focus trap and keyboard navigation (Escape to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [isConfirming, onCancel]);

  const handleConfirm = async () => {
    if (!selectedOfferId || isConfirming) return;

    let numBill: number | undefined = undefined;
    if (billAmount.trim()) {
      const parsed = parseFloat(billAmount.trim());
      if (isNaN(parsed) || parsed < 0 || parsed > 100000) {
        setBillError("Please enter a valid bill amount (up to 100,000 EGP)");
        return;
      }
      numBill = Math.round(parsed * 100) / 100;
    }

    setBillError(null);
    await onConfirm(selectedOfferId, numBill);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="valid-student-name"
      aria-describedby="valid-card-badge"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 overflow-hidden motion-safe:animate-in motion-safe:fade-in-0 duration-200"
    >
      {/* Screen reader live announcement */}
      <div aria-live="polite" className="sr-only">
        Valid student card for {studentName}, ID {universityId}. Select discount offer.
      </div>

      {/* Main Bottom Sheet on Mobile / Centered Card on sm+ */}
      <div
        ref={dialogRef}
        className="h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg w-full bg-card text-card-foreground flex flex-col rounded-t-[28px] sm:rounded-[24px] shadow-2xl overflow-hidden border-t sm:border border-border motion-safe:animate-in motion-safe:slide-in-from-bottom-6 sm:motion-safe:zoom-in-95 duration-250 motion-reduce:transform-none motion-reduce:transition-none"
      >
        {/* Top Header with Safe Area Inset */}
        <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border bg-card/95 backdrop-blur-md shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div
            id="valid-card-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider"
          >
            <Check className="size-3.5 stroke-[3]" />
            <span>Valid SU Card</span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            aria-label="Cancel scan"
            className="p-2.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Scrollable Body Content */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 space-y-6">
          {/* Student Identification Hero */}
          <div className="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border">
            {/* High-contrast Green Success Badge */}
            <div className="size-14 sm:size-16 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center shrink-0">
              <Check className="size-8 sm:size-9 stroke-[3.5]" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h2
                id="valid-student-name"
                className="font-heading text-2xl sm:text-3xl text-foreground uppercase tracking-wide leading-none truncate"
              >
                {studentName}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background border border-border text-xs font-mono font-bold tracking-wider text-muted-foreground">
                <span>ID:</span>
                <span className="text-foreground tabular-nums">{universityId}</span>
              </div>
            </div>
          </div>

          {/* Offers Selection Radiogroup */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {offers.length > 1 ? "Select applicable discount" : "Applicable discount"}
              </label>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {usableOffers.length} available
              </span>
            </div>

            <div
              className="space-y-2.5"
              role="radiogroup"
              aria-label="Available discount offers"
            >
              {offers.map((offer) => {
                const isUsable =
                  offer.remainingUses === null || offer.remainingUses > 0;
                const isSelected = selectedOfferId === offer.id;
                const isFirstUsable = isUsable && usableOffers[0]?.id === offer.id;

                return (
                  <div
                    key={offer.id}
                    ref={isFirstUsable ? firstUsableOfferRef : undefined}
                    onClick={() => {
                      if (isUsable && !isConfirming) {
                        setSelectedOfferId(offer.id);
                      }
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={!isUsable}
                    tabIndex={isUsable ? 0 : -1}
                    onKeyDown={(e) => {
                      if (isUsable && !isConfirming && (e.key === " " || e.key === "Enter")) {
                        e.preventDefault();
                        setSelectedOfferId(offer.id);
                      }
                    }}
                    className={cn(
                      "min-h-[56px] p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 text-left select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      isUsable
                        ? isSelected
                          ? "bg-sky-500/10 dark:bg-sky-500/15 border-brand dark:border-brand-soft shadow-xs ring-2 ring-brand/20 dark:ring-brand-soft/20 cursor-pointer"
                          : "bg-card border-border hover:border-border/80 hover:bg-muted/40 cursor-pointer active:scale-[0.99]"
                        : "bg-muted/30 border-border/50 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Prominent Discount Value Badge & Usage */}
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className={cn(
                            "font-heading text-xl sm:text-2xl leading-none tracking-wide",
                            isSelected
                              ? "text-brand dark:text-brand-soft"
                              : isUsable
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {offer.discountLabel}
                        </span>

                        <span
                          className={cn(
                            "text-xs font-bold",
                            isSelected
                              ? "text-brand dark:text-brand-soft"
                              : isUsable
                              ? "text-muted-foreground"
                              : "text-rose-500 dark:text-rose-400"
                          )}
                        >
                          {isUsable
                            ? formatRemainingUses(offer.remainingUses)
                            : `Used — resets ${formatResetDate(offer.resetsAt)}`}
                        </span>
                      </div>

                      {/* Offer Title */}
                      <p
                        className={cn(
                          "text-sm font-semibold line-clamp-1",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {offer.title}
                      </p>
                    </div>

                    {/* Radio Indicator (min 24px) */}
                    <div
                      className={cn(
                        "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "border-brand bg-brand dark:border-brand-soft dark:bg-brand-soft text-white dark:text-midnight"
                          : "border-muted-foreground/40 bg-transparent"
                      )}
                    >
                      {isSelected && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Bill Amount Input */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="bill-amount"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Bill amount in EGP <span className="font-normal opacity-75">(Optional)</span>
            </label>

            <div className="relative">
              <Input
                id="bill-amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 85.00"
                value={billAmount}
                disabled={isConfirming}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(val)) {
                    setBillAmount(val);
                    setBillError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                className="bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/50 h-13 sm:h-14 text-lg font-bold font-mono rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 pr-14"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none px-1.5 py-0.5 bg-muted rounded border border-border">
                EGP
              </span>
            </div>

            {billError && (
              <p className="text-xs text-destructive font-semibold pt-0.5">{billError}</p>
            )}
          </div>
        </main>

        {/* Sticky Bottom Action Area */}
        <footer className="p-4 sm:p-6 bg-card/95 border-t border-border backdrop-blur-md shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto w-full flex flex-col gap-2.5">
            <Button
              ref={confirmBtnRef}
              variant="primary"
              size="lg"
              onClick={handleConfirm}
              disabled={!selectedOfferId || isConfirming}
              className="w-full min-h-[52px] h-13 sm:h-14 text-base sm:text-lg font-heading uppercase tracking-wider font-bold cursor-pointer flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin text-current" />
                  <span>Recording discount…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 mr-2 stroke-[2.5]" />
                  <span>Confirm discount</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isConfirming}
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 normal-case font-semibold text-sm min-h-[44px]"
            >
              Cancel (Scan next card)
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
