"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RotateCcw, Receipt, CheckCircle2, DollarSign, Clock, Tag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodayRedemptions } from "./api";
import type { TodayResponse } from "@/lib/vendors/types";

export function ScannerTodayTab() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await getTodayRedemptions();
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load today's scans."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getTodayRedemptions()
      .then((res) => {
        if (active) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load today's scans.");
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Cairo",
      });
    } catch {
      return isoString;
    }
  };

  // Determine KPI tile states based on load and error status
  const isInitialLoading = isLoading && !data;
  const isErrorWithoutData = !isLoading && !!error && !data;
  const isStaleData = !isLoading && !!error && !!data;

  return (
    <div className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6 motion-safe:animate-in motion-safe:fade-in-0 duration-200">
      {/* Top Title & Refresh Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-sans font-semibold text-xl sm:text-2xl text-foreground truncate">
            Today&apos;s redemptions
          </h2>
          <p className="text-xs text-muted-foreground font-medium truncate">
            Recorded for this vendor today
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isLoading || isRefreshing}
          aria-label="Refresh today's redemptions"
          className="normal-case font-bold min-h-[44px] px-3.5 rounded-xl border-border shrink-0"
        >
          <RotateCcw
            className={`size-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>{isRefreshing ? "Updating…" : "Refresh"}</span>
        </Button>
      </div>

      {/* KPI Stats Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Discounts given"
          value={
            isInitialLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : isErrorWithoutData ? (
              "—"
            ) : (
              data?.count ?? 0
            )
          }
          subText={
            isErrorWithoutData
              ? "Data unavailable"
              : isStaleData
              ? "Cached data"
              : undefined
          }
          badge={
            isErrorWithoutData ? (
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                Unavailable
              </span>
            ) : isStaleData ? (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                Stale
              </span>
            ) : undefined
          }
          icon={<CheckCircle2 className="size-5" />}
          accent={isErrorWithoutData ? "neutral" : "brand"}
          className="p-4"
        />

        <StatTile
          label="Total bill (EGP)"
          value={
            isInitialLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : isErrorWithoutData ? (
              "—"
            ) : (
              `EGP ${parseFloat(data?.totalBill || "0").toFixed(2)}`
            )
          }
          subText={
            isErrorWithoutData
              ? "Data unavailable"
              : isStaleData
              ? "Cached data"
              : undefined
          }
          badge={
            isErrorWithoutData ? (
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                Unavailable
              </span>
            ) : isStaleData ? (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                Stale
              </span>
            ) : undefined
          }
          icon={<DollarSign className="size-5" />}
          accent={isErrorWithoutData ? "neutral" : "blue"}
          className="p-4"
        />
      </div>

      {/* List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-semibold text-xs text-muted-foreground">
            Recent Scans {data ? `(${data.redemptions.length})` : ""}
          </h3>
          {isStaleData && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="size-3" />
              Offline / Stale view
            </span>
          )}
        </div>

        {/* Stale data warning banner when refresh failed with existing data */}
        {isStaleData && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">Could not update recent scans: {error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              className="h-8 px-2.5 text-xs font-bold shrink-0 min-h-[36px]"
            >
              Retry
            </Button>
          </div>
        )}

        {isInitialLoading ? (
          <div className="space-y-2.5" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border bg-card/60 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        ) : isErrorWithoutData ? (
          <StatusState
            icon={<Receipt className="size-6" />}
            variant="warning"
            title="Could not load redemptions"
            description={error || "Failed to load recent redemptions from the server."}
            actions={
              <Button
                variant="primary"
                onClick={() => fetchData()}
                className="normal-case font-bold mt-2 min-h-[44px]"
              >
                Retry
              </Button>
            }
          />
        ) : !data?.redemptions || data.redemptions.length === 0 ? (
          <StatusState
            icon={<Receipt className="size-6" />}
            variant="default"
            title="No redemptions yet today"
            description="When you scan student cards and confirm discounts, they will be listed here with bill totals."
          />
        ) : (
          <div className="space-y-2.5">
            {data.redemptions.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between gap-3 transition-colors hover:border-border/80"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground truncate">
                      {item.studentName}
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      ({item.universityId})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-brand dark:text-brand-soft truncate">
                      <Tag className="size-3 shrink-0" />
                      {item.offerTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="font-mono text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <Clock className="size-3" />
                    <span>{formatTime(item.confirmedAt)}</span>
                  </div>

                  {item.billAmount ? (
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs font-mono">
                      EGP {parseFloat(item.billAmount).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
