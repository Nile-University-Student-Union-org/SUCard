"use client";

import React, { useState } from "react";
import { Check, Loader2, Sparkles, X, Tag } from "lucide-react";
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
  if (remainingUses === null) return "Unlimited";
  if (remainingUses === 1) return "1 use left";
  return `${remainingUses} uses left`;
}

function formatResetDate(resetsAt: string | null): string {
  if (!resetsAt) return "later";
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

  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    usableOffers[0]?.id || offers[0]?.id || ""
  );
  const [billAmount, setBillAmount] = useState<string>("");
  const [billError, setBillError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedOfferId) return;

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
    <div className="fixed inset-0 z-50 bg-[#064E3B] text-white flex flex-col justify-between overflow-y-auto overscroll-contain animate-in fade-in-0 duration-200">
      {/* Top Bar with Cancel */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/15 bg-black/20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
          <Check className="size-4 stroke-[3]" />
          <span>Valid SU Card</span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          aria-label="Cancel scan"
          className="p-2.5 rounded-full bg-black/40 text-white/90 hover:text-white hover:bg-black/60 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main Student & Offer Content */}
      <div className="flex-1 px-4 py-6 sm:px-8 max-w-lg w-full mx-auto space-y-6">
        {/* Giant Success Badge */}
        <div className="flex items-center gap-4">
          <div className="size-16 sm:size-20 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-950/40 flex items-center justify-center shrink-0 animate-in zoom-in-75 duration-300">
            <Check className="size-10 sm:size-12 stroke-[3.5]" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <h2 className="font-heading text-3xl sm:text-4xl text-white uppercase tracking-tight leading-none truncate drop-shadow-sm">
              {studentName}
            </h2>
            <p className="font-mono text-sm sm:text-base text-emerald-200 font-bold tracking-wider">
              ID: {universityId}
            </p>
          </div>
        </div>

        {/* Offers Selection */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200">
            {offers.length > 1 ? "Select applicable discount" : "Applicable discount"}
          </label>

          <div className="space-y-2" role="radiogroup" aria-label="Available offers">
            {offers.map((offer) => {
              const isUsable = offer.remainingUses === null || offer.remainingUses > 0;
              const isSelected = selectedOfferId === offer.id;

              return (
                <div
                  key={offer.id}
                  onClick={() => {
                    if (isUsable) {
                      setSelectedOfferId(offer.id);
                    }
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!isUsable}
                  tabIndex={isUsable ? 0 : -1}
                  onKeyDown={(e) => {
                    if (isUsable && (e.key === " " || e.key === "Enter")) {
                      e.preventDefault();
                      setSelectedOfferId(offer.id);
                    }
                  }}
                  className={cn(
                    "p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-start justify-between gap-3",
                    isUsable
                      ? isSelected
                        ? "bg-white text-slate-950 border-white shadow-lg shadow-black/20 cursor-pointer scale-[1.01]"
                        : "bg-black/30 text-white border-white/20 hover:border-white/40 cursor-pointer active:scale-[0.99]"
                      : "bg-black/20 text-white/50 border-white/10 opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-heading text-sm uppercase tracking-wide",
                          isSelected
                            ? "bg-emerald-700 text-white"
                            : isUsable
                            ? "bg-emerald-500/30 text-emerald-300"
                            : "bg-white/10 text-white/50"
                        )}
                      >
                        <Tag className="size-3.5" />
                        <span>{offer.discountLabel}</span>
                      </span>

                      <span
                        className={cn(
                          "text-xs font-bold",
                          isSelected ? "text-emerald-800" : "text-emerald-300"
                        )}
                      >
                        {isUsable
                          ? formatRemainingUses(offer.remainingUses)
                          : `Used — resets ${formatResetDate(offer.resetsAt)}`}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        isSelected ? "text-slate-900" : "text-white"
                      )}
                    >
                      {offer.title}
                    </p>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={cn(
                      "size-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-white/40 bg-transparent"
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
            className="block text-xs font-bold uppercase tracking-wider text-emerald-200"
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
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(val)) {
                  setBillAmount(val);
                  setBillError(null);
                }
              }}
              className="bg-black/30 border-white/30 text-white placeholder:text-white/40 h-13 text-lg font-bold rounded-xl focus:border-white focus:ring-white"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-300">
              EGP
            </span>
          </div>
          {billError && (
            <p className="text-xs text-rose-300 font-semibold">{billError}</p>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 sm:p-6 bg-black/40 border-t border-white/15 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedOfferId || isConfirming}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-heading uppercase tracking-wider bg-white text-emerald-950 hover:bg-emerald-50 active:scale-[0.98] shadow-xl shadow-black/30 font-bold border-none cursor-pointer"
          >
            {isConfirming ? (
              <>
                <Loader2 className="size-6 mr-2 animate-spin text-emerald-950" />
                <span>Recording discount…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-5 mr-2 text-emerald-700 stroke-[2.5]" />
                <span>Confirm discount</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isConfirming}
            className="w-full text-white/80 hover:text-white hover:bg-white/10 normal-case font-semibold text-sm min-h-[44px]"
          >
            Cancel (Scan next card)
          </Button>
        </div>
      </div>
    </div>
  );
}
