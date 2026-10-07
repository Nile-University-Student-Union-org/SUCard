"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RotateCcw, Receipt, CheckCircle2, DollarSign, Clock, Tag } from "lucide-react";
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

  return (
    <div className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in-0 duration-200">
      {/* Top Title & Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-wide text-foreground">
            TODAY&apos;S REDEMPTIONS
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Recorded for this vendor today
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={isLoading || isRefreshing}
          className="normal-case font-bold min-h-[44px] px-3.5 rounded-xl border-border"
        >
          <RotateCcw
            className={`size-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* KPI Stats Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="DISCOUNTS GIVEN"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : data?.count ?? 0}
          icon={<CheckCircle2 className="size-5" />}
          accent="brand"
          className="p-4"
        />

        <StatTile
          label="TOTAL BILL (EGP)"
          value={
            isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              `EGP ${parseFloat(data?.totalBill || "0").toFixed(2)}`
            )
          }
          icon={<DollarSign className="size-5" />}
          accent="blue"
          className="p-4"
        />
      </div>

      {/* List Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recent Scans ({data?.redemptions.length ?? 0})
        </h3>

        {isLoading ? (
          <div className="space-y-2.5">
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
        ) : error ? (
          <StatusState
            icon={<Receipt className="size-6" />}
            variant="warning"
            title="Could not load list"
            description={error}
            actions={
              <Button
                variant="primary"
                onClick={() => fetchData()}
                className="normal-case font-bold mt-2"
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
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between gap-3 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
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
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
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
