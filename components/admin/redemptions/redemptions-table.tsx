"use client";

import React from "react";
import { Check, Store, Ban, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/ui/status-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import type { RedemptionDto } from "@/lib/vendors/types";

interface RedemptionsTableProps {
  redemptions: RedemptionDto[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onVoidClick: (redemption: RedemptionDto) => void;
}

const RESULT_LABELS: Record<string, string> = {
  valid: "Valid",
  not_su_card: "Not SU Card",
  card_not_activated: "Not Activated",
  card_cancelled: "Cancelled",
  student_suspended: "Suspended",
  vendor_inactive: "Vendor Inactive",
  no_active_offer: "No Offer",
  limit_reached: "Limit Reached",
  invalid_qr: "Invalid QR",
  rate_limited: "Rate Limited",
};

export function RedemptionsTable({
  redemptions,
  isLoading,
  error,
  onRetry,
  onVoidClick,
}: RedemptionsTableProps) {
  if (isLoading && redemptions.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-card/60 space-y-2"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-72" />
          </div>
        ))}
      </div>
    );
  }

  if (error && redemptions.length === 0) {
    return (
      <StatusState
        icon={<AlertCircle className="size-6" />}
        variant="warning"
        title="Could not load redemptions ledger"
        description={error}
        actions={
          <Button variant="primary" onClick={onRetry} className="normal-case font-bold mt-2 min-h-[44px] h-11 px-5">
            Retry
          </Button>
        }
      />
    );
  }

  if (redemptions.length === 0) {
    return (
      <EmptyState
        icon={<Store className="size-6 text-muted-foreground" />}
        title="No redemption records"
        hint="Scans and discount transactions will be logged in this ledger."
      />
    );
  }

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Africa/Cairo",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-border bg-muted/90 backdrop-blur-xs text-muted-foreground font-semibold text-xs">
              <th className="px-4 py-3.5">Time (Cairo)</th>
              <th className="px-4 py-3.5">Vendor</th>
              <th className="px-4 py-3.5">Cashier</th>
              <th className="px-4 py-3.5">Student</th>
              <th className="px-4 py-3.5">Offer</th>
              <th className="px-3 py-3.5">Result</th>
              <th className="px-3 py-3.5 text-center">Confirmed</th>
              <th className="px-3 py-3.5 text-right">Bill</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {redemptions.map((r) => {
              const isVoided = r.voided;
              const isValid = r.result === "valid";

              return (
                <tr
                  key={r.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    isVoided && "bg-rose-500/5 dark:bg-rose-950/10 opacity-70"
                  )}
                >
                  {/* Time */}
                  <td className="px-4 py-3.5 font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(r.createdAt)}
                  </td>

                  {/* Vendor */}
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    <div className={cn("space-y-0.5", isVoided && "line-through")}>
                      <span className="font-bold text-foreground block">{r.vendorName}</span>
                    </div>
                  </td>

                  {/* Cashier */}
                  <td className="px-4 py-3.5 text-muted-foreground">
                    <span className={cn(isVoided && "line-through")}>{r.cashierName}</span>
                  </td>

                  {/* Student */}
                  <td className="px-4 py-3.5">
                    {r.studentName ? (
                      <div className={cn("space-y-0.5", isVoided && "line-through")}>
                        <span className="font-bold text-foreground block">{r.studentName}</span>
                        <span className="font-mono tabular-nums text-[11px] text-muted-foreground block">{r.universityId}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Offer */}
                  <td className="px-4 py-3.5 max-w-[180px] truncate" title={r.offerTitle || undefined}>
                    {r.offerTitle ? (
                      <span className={cn("font-semibold text-brand dark:text-brand-soft truncate block", isVoided && "line-through")}>
                        {r.offerTitle}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Result Badge */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] border",
                        isValid
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      )}
                    >
                      <span>{RESULT_LABELS[r.result] || r.result}</span>
                    </span>
                  </td>

                  {/* Confirmed */}
                  <td className="px-3 py-3.5 text-center">
                    {r.confirmed ? (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Bill */}
                  <td className="px-3 py-3.5 font-mono tabular-nums text-right whitespace-nowrap">
                    {r.billAmount ? (
                      <span className={cn("font-bold text-foreground", isVoided && "line-through")}>
                        EGP {parseFloat(r.billAmount).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Actions / Void Status */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {isVoided ? (
                      <span
                        title={r.voidReason ? `Reason: ${r.voidReason}` : "Voided"}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                      >
                        <Ban className="size-3" />
                        <span>Voided: {r.voidReason || "Manual"}</span>
                      </span>
                    ) : r.confirmed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVoidClick(r)}
                        className="h-8 px-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 normal-case font-bold text-xs"
                      >
                        <Ban className="size-3 mr-1" />
                        <span>Void</span>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground/40 text-[11px]">Unconfirmed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {redemptions.map((r) => {
          const isVoided = r.voided;
          const isValid = r.result === "valid";

          return (
            <div
              key={r.id}
              className={cn(
                "p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3 transition-all",
                isVoided && "bg-rose-500/5 dark:bg-rose-950/10 opacity-75"
              )}
            >
              {/* Header: Vendor + Result */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className={cn("font-bold text-sm text-foreground", isVoided && "line-through")}>
                    {r.vendorName}
                  </h4>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] border shrink-0",
                    isValid
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  )}
                >
                  <span>{RESULT_LABELS[r.result] || r.result}</span>
                </span>
              </div>

              {/* Student and Offer details */}
              <div className="space-y-1 text-xs">
                {r.studentName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className={cn("font-bold text-foreground", isVoided && "line-through")}>
                      {r.studentName} ({r.universityId})
                    </span>
                  </div>
                )}

                {r.offerTitle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer:</span>
                    <span className={cn("font-semibold text-brand dark:text-brand-soft", isVoided && "line-through")}>
                      {r.offerTitle}
                    </span>
                  </div>
                )}

                {r.billAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Amount:</span>
                    <span className={cn("font-mono font-bold text-foreground", isVoided && "line-through")}>
                      EGP {parseFloat(r.billAmount).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Cashier: {r.cashierName}</span>
                  <span className="font-mono">{formatTimestamp(r.createdAt)}</span>
                </div>
              </div>

              {/* Footer: Void details or Void button */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div>
                  {isVoided ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <Ban className="size-3.5" />
                      <span>Voided: {r.voidReason || "Manual"}</span>
                    </span>
                  ) : r.confirmed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3.5 stroke-[3]" />
                      <span>Confirmed</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Scan only</span>
                  )}
                </div>

                {!isVoided && r.confirmed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onVoidClick(r)}
                    className="min-h-[44px] h-11 px-4 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 normal-case font-bold text-xs inline-flex items-center"
                  >
                    <Ban className="size-4 mr-1.5" />
                    <span>Void</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
