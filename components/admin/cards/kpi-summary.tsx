"use client";

import { useMemo } from "react";
import { CreditCard, Inbox, CheckCircle2, Ban } from "lucide-react";
import type { Batch } from "@/lib/cards/types";
import { Card, CardContent } from "@/components/ui/card";
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

  const cards = [
    {
      title: "Total Cards",
      value: stats.totalCards,
      subtitle: `${stats.batchCount} batch${stats.batchCount === 1 ? "" : "es"} generated`,
      icon: CreditCard,
      color: "text-[#0F3056]",
      bgColor: "bg-[#0F3056]/10",
      borderColor: "border-[#0F3056]/20",
    },
    {
      title: "Unassigned",
      value: stats.unassigned,
      subtitle: "Printed & ready to claim",
      icon: Inbox,
      color: "text-[#018BCE]",
      bgColor: "bg-[#018BCE]/10",
      borderColor: "border-[#018BCE]/20",
    },
    {
      title: "Active",
      value: stats.active,
      subtitle: "Claimed by active members",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Void",
      value: stats.voided,
      subtitle: "Decommissioned or lost",
      icon: Ban,
      color: "text-rose-600",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-xs border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Cards Summary Metrics"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="shadow-xs hover:shadow-md transition-shadow border-slate-200/80 bg-white dark:bg-card"
          >
            <CardContent className="p-5 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatNumber(card.value)}
                </p>
                <p className="text-xs text-muted-foreground pt-0.5">{card.subtitle}</p>
              </div>
              <div
                className={`size-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0 border ${card.borderColor}`}
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
