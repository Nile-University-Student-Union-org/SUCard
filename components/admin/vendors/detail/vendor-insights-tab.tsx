"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Receipt,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, BarChart, PeakHoursChart } from "@/components/ui/charts";
import {
  formatCairoDateOnly,
  formatCairoDateTime,
  formatNumber,
  formatCurrency,
  formatChangePercent,
} from "@/components/ui/analytics-format";
import type { VendorStatsResponse } from "@/lib/analytics/types";
import { cn } from "cn";

interface VendorInsightsTabProps {
  vendorId: string;
}

export function VendorInsightsTab({ vendorId }: VendorInsightsTabProps) {
  const [data, setData] = useState<VendorStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range filter
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);

        const res = await fetch(
          `/api/admin/vendors/${vendorId}/stats?${params.toString()}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as VendorStatsResponse;
        if (!ignore) {
          setData(json);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load vendor insights"
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [vendorId, dateRange, refreshKey]);

  if (error) {
    return (
      <div className="p-8">
        <StatusState
          layout="panel"
          variant="destructive"
          icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
          title="Failed to load insights"
          description={error}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="normal-case font-bold"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const redemptionChange = formatChangePercent(data.redemptions.changePercent);
  const studentChange = formatChangePercent(data.uniqueStudents.changePercent);

  return (
    <div className="space-y-6">
      {/* Date Range Picker Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400 mb-1.5">
            Filter Insights Range
          </span>
          <DateRangePicker
            from={data.range.from}
            to={data.range.to}
            onChange={({ from, to }) => setDateRange({ from, to })}
          />
        </div>

        <div className="text-left md:text-right text-xs text-muted-foreground font-mono">
          <span className="font-bold text-foreground">
            {formatCairoDateOnly(data.range.from)} &rarr; {formatCairoDateOnly(data.range.to)}
          </span>
          <span className="block text-[11px] text-ash dark:text-zinc-400 font-sans">
            vs prev ({formatCairoDateOnly(data.range.previousFrom)} – {formatCairoDateOnly(data.range.previousTo)})
          </span>
        </div>
      </div>

      {/* 4 KPIs GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Redemptions */}
        <StatTile
          label="Total Redemptions"
          value={formatNumber(data.redemptions.current)}
          accent="brand"
          variant="hero"
          icon={<Receipt className="size-5" />}
          badge={
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono",
                redemptionChange.isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : redemptionChange.isNegative
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              )}
            >
              {redemptionChange.isPositive ? (
                <TrendingUp className="size-3" />
              ) : redemptionChange.isNegative ? (
                <TrendingDown className="size-3" />
              ) : null}
              {redemptionChange.text} vs prev
            </span>
          }
          subText={`Prev: ${formatNumber(data.redemptions.previous)}`}
        />

        {/* 2. Unique Students */}
        <StatTile
          label="Unique Students"
          value={formatNumber(data.uniqueStudents.current)}
          accent="blue"
          variant="hero"
          icon={<Users className="size-5" />}
          badge={
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono",
                studentChange.isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : studentChange.isNegative
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
              )}
            >
              {studentChange.isPositive ? (
                <TrendingUp className="size-3" />
              ) : studentChange.isNegative ? (
                <TrendingDown className="size-3" />
              ) : null}
              {studentChange.text} vs prev
            </span>
          }
          subText={`Prev: ${formatNumber(data.uniqueStudents.previous)}`}
        />

        {/* 3. Total Bill */}
        <StatTile
          label="Recorded Spend"
          value={formatCurrency(data.totalBill)}
          accent="green"
          variant="hero"
          icon={<DollarSign className="size-5" />}
          subText="Recorded bill amounts"
        />

        {/* 4. Average Bill */}
        <StatTile
          label="Average Ticket"
          value={formatCurrency(data.averageBill)}
          accent="amber"
          variant="hero"
          icon={<Sparkles className="size-5" />}
          subText="Average spend per scan"
        />
      </div>

      {/* TREND CHART: Redemptions over time */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="text-lg sm:text-xl text-foreground">
            REDEMPTION TREND
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Confirmed student scans over the selected period
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <AreaChart
            data={data.timeseries.map((t) => ({
              label: t.bucket,
              value: t.redemptions,
            }))}
            height={240}
            accentColor="#018BCE"
            valueLabel="Redemptions"
            labelFormatter={(bucket) => formatCairoDateOnly(bucket)}
            emptyMessage="No redemptions for this vendor in the chosen range."
          />
        </CardContent>
      </Card>

      {/* TWO COLUMNS: Branches breakdown & Offers breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branches breakdown */}
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base sm:text-lg text-foreground">
              REDEMPTIONS BY BRANCH
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <BarChart
              data={data.branches.map((b) => ({
                id: b.id,
                label: b.name,
                value: b.redemptions,
              }))}
              barColor="#0F3056"
              emptyMessage="No branch activity recorded yet."
            />
          </CardContent>
        </Card>

        {/* Offers breakdown */}
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base sm:text-lg text-foreground">
              REDEMPTIONS BY OFFER
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <BarChart
              data={data.offers.map((o) => ({
                id: o.id,
                label: o.name,
                value: o.redemptions,
              }))}
              barColor="#018BCE"
              emptyMessage="No offer redemptions recorded yet."
            />
          </CardContent>
        </Card>
      </div>

      {/* PEAK ACTIVITY CARD */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="text-base sm:text-lg text-foreground">
            PEAK ACTIVITY
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hourly and day-of-week traffic distribution in Africa/Cairo time
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <PeakHoursChart
            peakHours={data.peakHours}
            peakDays={data.peakDays}
          />
        </CardContent>
      </Card>

      {/* RECENT 20 REDEMPTIONS TABLE */}
      {data.recent && data.recent.length > 0 && (
        <Card className="border border-border bg-card shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg text-foreground">
                RECENT REDEMPTIONS
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest 20 confirmed student scans at this vendor
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-bold">
              {data.recent.length} Records
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Offer</th>
                    <th className="px-4 py-3 text-right">Bill Amount</th>
                    <th className="px-4 py-3 text-right">Time (Cairo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {data.recent.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-sans font-bold text-foreground">
                        {rec.studentName || "Deleted Student"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {rec.universityId || "—"}
                      </td>
                      <td className="px-4 py-3 font-sans text-foreground">
                        {rec.branchName}
                      </td>
                      <td className="px-4 py-3 font-sans text-muted-foreground">
                        {rec.offerTitle || "General Discount"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {rec.billAmount ? formatCurrency(rec.billAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCairoDateTime(rec.confirmedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border p-3 space-y-2">
              {data.recent.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl border border-border bg-card space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-sans font-bold">
                    <span className="text-foreground truncate">
                      {rec.studentName || "Deleted Student"}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {rec.universityId || ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>{rec.branchName}</span>
                    <span className="font-bold text-brand dark:text-brand-soft">
                      {rec.offerTitle || "Discount"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border font-mono text-[11px]">
                    <span className="font-bold text-foreground">
                      {rec.billAmount ? formatCurrency(rec.billAmount) : "No bill recorded"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCairoDateTime(rec.confirmedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
