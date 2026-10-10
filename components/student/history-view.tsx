"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Store,
  Tag,
  Clock,
  RotateCcw,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import type { StudentHistoryResponse } from "@/lib/analytics/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [pageError, setPageError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const inFlightCursorRef = useRef<string | null>(null);
  const loadedCursorsRef = useRef(new Set<string>());
  const requestGenerationRef = useRef(0);

  const fetchHistory = useCallback(async (cursor: string) => {
    if (inFlightCursorRef.current || loadedCursorsRef.current.has(cursor)) return;
    inFlightCursorRef.current = cursor;
    const generation = requestGenerationRef.current;
    setLoadingMore(true);
    setPageError(null);

    try {
      const res = await fetch(`/api/student/history?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) {
        throw new Error("Failed to load redemption history");
      }
      const data: StudentHistoryResponse = await res.json();
      if (generation !== requestGenerationRef.current) return;
      loadedCursorsRef.current.add(cursor);
      setRedemptions((previous) => {
        if (generation !== requestGenerationRef.current) return previous;
        const seen = new Set(previous.map((redemption) => redemption.id));
        const unseen = data.redemptions.filter((redemption) => {
          if (seen.has(redemption.id)) return false;
          seen.add(redemption.id);
          return true;
        });
        return [...previous, ...unseen];
      });
      setNextCursor((previous) => {
        if (generation !== requestGenerationRef.current) return previous;
        return data.nextCursor && !loadedCursorsRef.current.has(data.nextCursor)
          ? data.nextCursor
          : null;
      });
    } catch (err: unknown) {
      if (generation === requestGenerationRef.current) {
        setPageError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      if (generation === requestGenerationRef.current) {
        inFlightCursorRef.current = null;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const generation = ++requestGenerationRef.current;
    inFlightCursorRef.current = null;
    loadedCursorsRef.current.clear();
    void (async () => {
      setLoading(true);
      setError(null);
      setPageError(null);
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
      requestGenerationRef.current = generation + 1;
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
        <EmptyState
          icon={<Receipt />}
          title="No redemptions yet"
          hint="No discounts redeemed yet. Show your card QR code at partner spots around campus to start saving!"
          action={
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-1 w-full">
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
          }
        />
      ) : (
        <div className="space-y-6">
          {groupedRedemptions.map((group) => (
            <section key={group.dayLabel} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">
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
                              <Tag className="size-3 text-ash dark:text-zinc-400 shrink-0" />
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
              {pageError && (
                <p role="alert" className="mb-3 text-sm text-destructive">
                  Could not load older redemptions. Your loaded history is still available. {pageError}
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => fetchHistory(nextCursor)}
                loading={loadingMore}
                loadingText="Loading more…"
                className="w-full sm:w-auto min-w-[160px] min-h-[44px] font-semibold"
              >
                {pageError ? (
                  <><RotateCcw className="size-4 mr-2" />Retry older redemptions</>
                ) : (
                  <>Load older redemptions<ArrowRight className="size-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
