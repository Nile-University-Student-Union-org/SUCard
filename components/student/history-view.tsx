"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Store,
  Tag,
  Clock,
  RotateCcw,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { StudentHistoryResponse } from "@/lib/analytics/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import {
  formatCairoTimeOnly,
  formatCurrency,
  getCairoTodayString,
} from "@/components/ui/analytics-format";

interface RedemptionItem {
  id: string;
  vendorName: string;
  offerTitle: string | null;
  confirmedAt: string;
  billAmount: string | null;
}

function getDayHeaderLabel(isoDateStr: string): string {
  try {
    const d = new Date(isoDateStr);
    const itemDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

    const todayStr = getCairoTodayString();

    // Check today
    if (itemDay === todayStr) {
      return "Today";
    }

    // Check yesterday
    const todayDate = new Date(`${todayStr}T00:00:00Z`);
    todayDate.setUTCDate(todayDate.getUTCDate() - 1);
    const yesterdayStr = todayDate.toISOString().slice(0, 10);
    if (itemDay === yesterdayStr) {
      return "Yesterday";
    }

    // Format readable full day
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return isoDateStr.slice(0, 10);
  }
}

export function HistoryView() {
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchHistory = useCallback(async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = cursor
        ? `/api/student/history?cursor=${encodeURIComponent(cursor)}`
        : "/api/student/history";

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load redemption history");
      }
      const data: StudentHistoryResponse = await res.json();

      if (cursor) {
        setRedemptions((prev) => [...prev, ...(data.redemptions || [])]);
      } else {
        setRedemptions(data.redemptions || []);
      }
      setNextCursor(data.nextCursor || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/history");
        if (!res.ok) {
          throw new Error("Failed to load redemption history");
        }
        const data: StudentHistoryResponse = await res.json();
        if (!ignore) {
          setRedemptions(data.redemptions || []);
          setNextCursor(data.nextCursor || null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // Group redemptions by day label
  const groupedRedemptions = redemptions.reduce<
    { dayLabel: string; items: RedemptionItem[] }[]
  >((acc, item) => {
    const dayLabel = getDayHeaderLabel(item.confirmedAt);
    const existingGroup = acc.find((g) => g.dayLabel === dayLabel);
    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      acc.push({ dayLabel, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-charcoal dark:text-white uppercase tracking-wider">
            REDEMPTION HISTORY
          </h1>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-0.5">
            Your past card uses and discount redemptions across Nile University
          </p>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((group) => (
            <div key={group} className="space-y-3">
              <Skeleton className="h-5 w-28 rounded" />
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <Card key={n} className="p-4 flex items-center justify-between gap-4 border border-border">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3.5 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <StatusState
          variant="destructive"
          title="Could not load history"
          description={error}
          actions={
            <Button
              variant="outline"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="min-h-[44px]"
            >
              <RotateCcw className="size-4 mr-2" />
              Try Again
            </Button>
          }
        />
      ) : redemptions.length === 0 ? (
        <Card className="p-8 text-center space-y-5 border border-border bg-card">
          <div className="size-14 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto border border-brand/20 shadow-xs">
            <Receipt className="size-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground">
              No Redemptions Yet
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              No discounts redeemed yet. Show your card QR code at partner spots around campus to start saving!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
            <ButtonLink
              href="/deals"
              variant="primary"
              className="w-full sm:w-auto min-h-[44px] font-bold text-sm"
            >
              <Tag className="size-4 mr-2" />
              Browse Student Deals
            </ButtonLink>
            <ButtonLink
              href="/card"
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] font-semibold text-sm border-slate-300 dark:border-zinc-700"
            >
              <CreditCard className="size-4 mr-2" />
              View My Card
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedRedemptions.map((group) => (
            <section key={group.dayLabel} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                  {group.dayLabel}
                </h2>
                <span className="text-xs text-muted-foreground font-medium">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "redemption" : "redemptions"}
                </span>
              </div>

              {/* Day Items */}
              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <Card
                    key={item.id}
                    className="p-4 transition-colors hover:bg-slate-50/75 dark:hover:bg-zinc-900/60 border border-border rounded-2xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Vendor & Offer details */}
                      <div className="flex items-start gap-3.5">
                        <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 border border-border shrink-0 mt-0.5">
                          <Store className="size-5 text-brand dark:text-brand-soft" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-bold text-foreground text-sm truncate max-w-[220px] sm:max-w-xs md:max-w-md"
                              title={item.vendorName}
                            >
                              {item.vendorName}
                            </span>
                          </div>

                          {item.offerTitle ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Tag className="size-3 text-brand dark:text-brand-soft shrink-0" />
                              <span className="text-foreground/90 font-medium">
                                {item.offerTitle}
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                              <Sparkles className="size-3 text-ash dark:text-zinc-400 shrink-0" />
                              <span>Standard student discount</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Bill amount, time, and confirmed badge */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 gap-1 shrink-0">
                        {item.billAmount && (
                          <span className="font-bold text-foreground text-sm font-mono">
                            {formatCurrency(item.billAmount)}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3 text-ash dark:text-zinc-400" />
                          <span>{formatCairoTimeOnly(item.confirmedAt)}</span>
                          <span
                            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 ml-1"
                            title="Confirmed redemption"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {/* Load More Pagination */}
          {nextCursor && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={() => fetchHistory(nextCursor)}
                disabled={loadingMore}
                className="w-full sm:w-auto min-w-[160px] min-h-[44px] font-semibold"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin motion-reduce:animate-none" />
                    Loading more…
                  </>
                ) : (
                  <>
                    Load older redemptions
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
