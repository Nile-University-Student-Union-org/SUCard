"use client";

import { useMemo } from "react";
import type { Batch } from "@/lib/cards/types";
import { StatStrip, type StatItem } from "@/components/ui/stat-strip";
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

  const items: StatItem[] = [
    {
      label: "Total cards",
      value: formatNumber(stats.totalCards),
      subText: `${stats.batchCount} batch${stats.batchCount === 1 ? "" : "es"} generated`,
      zeroHint: "0 — No batches generated yet",
    },
    {
      label: "Unassigned",
      value: formatNumber(stats.unassigned),
      subText: "Printed & ready to claim",
      zeroHint: stats.totalCards > 0 ? "0 — All printed stock linked" : "0 — Ready for first print run",
    },
    {
      label: "Active",
      value: formatNumber(stats.active),
      subText: "Claimed by verified students",
      zeroHint: "0 — Awaiting student claims",
    },
    {
      label: "Void",
      value: formatNumber(stats.voided),
      subText: "Decommissioned or lost",
      zeroHint: "0 — All cards in good standing",
    },
  ];

  return (
    <StatStrip
      items={items}
      isLoading={isLoading}
      aria-label="Membership Statistics"
    />
  );
}
