"use client";

import { useMemo } from "react";
import { CreditCard, Inbox, CheckCircle2, Ban } from "lucide-react";
import type { Batch } from "@/lib/cards/types";
import { StatTile } from "@/components/ui/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "./utils";

interface KpiSummaryProps {
  batches: Batch[];
  isLoading?: boolean;
}

export function KpiSummary({ batches, isLoading = false }: KpiSummaryProps) {
  const stats = useMemo(() => {
    let totalCards = 0;
    let unassigned = 0;
    let active = 0;
    let voided = 0;

    for (const batch of batches) {
      totalCards += batch.count || 0;
      if (batch.stats) {
        unassigned += batch.stats.unassigned || 0;
        active += batch.stats.active || 0;
        voided += batch.stats.void || 0;
      }
    }

    return {
      totalCards,
      unassigned,
      active,
      voided,
      batchCount: batches.length,
    };
  }, [batches]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Cards Summary Metrics"
    >
      <StatTile
        label="Total Cards"
        value={formatNumber(stats.totalCards)}
        subText={`${stats.batchCount} batch${stats.batchCount === 1 ? "" : "es"} generated`}
        icon={<CreditCard className="size-5" />}
        accent="brand"
        variant="hero"
      />
      <StatTile
        label="Unassigned"
        value={formatNumber(stats.unassigned)}
        subText="Printed & ready to claim"
        icon={<Inbox className="size-5" />}
        accent="blue"
        variant="hero"
      />
      <StatTile
        label="Active"
        value={formatNumber(stats.active)}
        subText="Claimed by active members"
        icon={<CheckCircle2 className="size-5" />}
        accent="emerald"
        variant="hero"
      />
      <StatTile
        label="Void"
        value={formatNumber(stats.voided)}
        subText="Decommissioned or lost"
        icon={<Ban className="size-5" />}
        accent="rose"
        variant="hero"
      />
    </div>
  );
}
