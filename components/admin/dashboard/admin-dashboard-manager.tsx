"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  CreditCard,
  Download,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Wallet,
  Layers,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { OverflowScroller } from "@/components/ui/overflow-scroller";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { AreaChart } from "@/components/ui/charts";
import {
  formatCairoDateOnly,
  formatNumber,
  formatChangePercent,
} from "@/components/ui/analytics-format";
import type {
  DashboardResponse,
} from "@/lib/analytics/types";
import type { VendorCategory } from "@/lib/vendors/types";
import { cn } from "cn";

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "coffee", label: "Coffee" },
  { value: "food", label: "Food" },
  { value: "fitness", label: "Fitness" },
  { value: "books", label: "Books" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export function AdminDashboardManager() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const fromParam = searchParams.get("from") || undefined;
  const toParam = searchParams.get("to") || undefined;
  const categoryParam = searchParams.get("category") || undefined;
  const vendorIdParam = searchParams.get("vendorId") || undefined;
  const granularityParam = (searchParams.get("granularity") as "day" | "week" | "month") || undefined;

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isUpdating = isLoading && data !== null;
  const isInitialLoading = isLoading && data === null;

  // Sorting state for leaderboard
  const [sortField, setSortField] = useState<"redemptions" | "uniqueStudents" | "name" | "changePercent">("redemptions");
  const [sortAsc, setSortAsc] = useState(false);

  // Helper to update search params in the URL
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === "") {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      router.replace(`/admin?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    let ignore = false;
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (fromParam) params.set("from", fromParam);
        if (toParam) params.set("to", toParam);
        if (categoryParam) params.set("category", categoryParam);
        if (vendorIdParam) params.set("vendorId", vendorIdParam);
        if (granularityParam) params.set("granularity", granularityParam);

        const res = await fetch(`/api/admin/dashboard?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as DashboardResponse;
        if (!ignore) {
          setData(json);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
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
  }, [fromParam, toParam, categoryParam, vendorIdParam, granularityParam, refreshKey]);

  // Export handlers
  const handleExportRedemptions = () => {
    const params = new URLSearchParams();
    if (fromParam) params.set("from", fromParam);
    if (toParam) params.set("to", toParam);
    if (vendorIdParam) params.set("vendorId", vendorIdParam);
    window.open(`/api/admin/export/redemptions?${params.toString()}`, "_blank");
  };

  const handleExportVendors = () => {
    const params = new URLSearchParams();
    if (fromParam) params.set("from", fromParam);
    if (toParam) params.set("to", toParam);
    window.open(`/api/admin/export/vendors?${params.toString()}`, "_blank");
  };

  // Sorted leaderboard
  const rawLeaderboard = data?.leaderboard;
  const sortedLeaderboard = useMemo(() => {
    if (!rawLeaderboard) return [];
    return [...rawLeaderboard].sort((a, b) => {
      let diff = 0;
      if (sortField === "redemptions") diff = a.redemptions - b.redemptions;
      else if (sortField === "uniqueStudents") diff = a.uniqueStudents - b.uniqueStudents;
      else if (sortField === "changePercent") diff = (a.changePercent ?? 0) - (b.changePercent ?? 0);
      else if (sortField === "name") diff = a.name.localeCompare(b.name);
      return sortAsc ? diff : -diff;
    });
  }, [rawLeaderboard, sortField, sortAsc]);

  const handleSort = (field: "redemptions" | "uniqueStudents" | "name" | "changePercent") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const formatLastUpdatedTime = (d: Date) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return d.toLocaleTimeString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white">
              DASHBOARD
            </h1>
            {isUpdating ? (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 text-[11px] font-bold bg-brand/10 text-brand dark:text-brand-soft border border-brand/20 animate-pulse motion-reduce:animate-none"
              >
                <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />
                <span>Updating…</span>
              </Badge>
            ) : lastUpdated ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-ash dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 font-mono"
                title="Data timestamp (Cairo)"
              >
                <Clock className="size-3" />
                <span>Updated {formatLastUpdatedTime(lastUpdated)}</span>
              </span>
            ) : null}
          </div>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-1">
            Real-time analytics, student adoption, vendor performance, and card usage.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="surface"
            size="sm"
            onClick={handleExportRedemptions}
            className="normal-case font-bold min-h-[44px] h-11 px-4 text-xs text-brand dark:text-brand-soft border-slate-300 dark:border-zinc-700 hover:bg-muted"
          >
            <Download className="size-3.5 mr-1.5" />
            Export Scans CSV
          </Button>
          <Button
            variant="surface"
            size="sm"
            onClick={handleExportVendors}
            className="normal-case font-bold min-h-[44px] h-11 px-4 text-xs text-brand dark:text-brand-soft border-slate-300 dark:border-zinc-700 hover:bg-muted"
          >
            <Download className="size-3.5 mr-1.5" />
            Export Vendors CSV
          </Button>
        </div>
      </div>

      {/* Date Range & Filter Chips Bar */}
      <div className="space-y-3 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400 mb-1.5">
              Date Range
            </span>
            <DateRangePicker
              from={data?.range.from || fromParam}
              to={data?.range.to || toParam}
              onChange={({ from, to }) => updateParams({ from, to })}
            />
          </div>

          {data?.range && (
            <div className="text-left md:text-right text-xs text-muted-foreground self-start md:self-center font-mono">
              <span className="font-bold text-foreground">
                {formatCairoDateOnly(data.range.from)} &rarr; {formatCairoDateOnly(data.range.to)}
              </span>
              <span className="block text-[11px] text-ash dark:text-zinc-400 font-sans">
                vs previous {data.range.days} days ({formatCairoDateOnly(data.range.previousFrom)} – {formatCairoDateOnly(data.range.previousTo)})
              </span>
            </div>
          )}
        </div>

        {/* Category Filters Chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-ash dark:text-zinc-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400 shrink-0">
              Category:
            </span>
            <OverflowScroller className="flex-1">
              <ToggleChip
                pressed={!categoryParam}
                onPressedChange={() => updateParams({ category: undefined })}
                size="sm"
                className="min-h-[36px]"
              >
                <span>All Categories</span>
              </ToggleChip>
              {CATEGORIES.map((cat) => (
                <ToggleChip
                  key={cat.value}
                  pressed={categoryParam === cat.value}
                  onPressedChange={() =>
                    updateParams({
                      category: categoryParam === cat.value ? undefined : cat.value,
                    })
                  }
                  size="sm"
                  className="min-h-[36px]"
                >
                  <span>{cat.label}</span>
                </ToggleChip>
              ))}
            </OverflowScroller>
          </div>
        </div>
      </div>

      {/* Main Content State */}
      {error && !data ? (
        <div className="p-8">
          <StatusState
            layout="panel"
            variant="destructive"
            icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
            title="Failed to load dashboard"
            description={error}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="normal-case font-bold min-h-[44px] h-11 px-5"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Try again
              </Button>
            }
          />
        </div>
      ) : isInitialLoading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard analytics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : data ? (
        <div
          className={cn(
            "space-y-6 transition-opacity duration-200 motion-reduce:transition-none",
            isUpdating && "opacity-75 pointer-events-auto"
          )}
          aria-busy={isUpdating}
        >
          {/* Non-blocking error notice during refresh */}
          {error && (
            <Alert
              variant="destructive"
              title="Could not refresh dashboard data"
              description={`${error}. Showing previous analytics.`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="normal-case font-bold min-h-[44px] h-11 px-4 mt-1"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Retry update
                </Button>
              }
            />
          )}
          {/* M8-1: KPI TILES GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Redemptions */}
            {(() => {
              const change = formatChangePercent(data.kpis.redemptions.changePercent);
              return (
                <StatTile
                  label="Total Redemptions"
                  value={formatNumber(data.kpis.redemptions.current)}
                  accent="brand"
                  variant="hero"
                  icon={<TrendingUp className="size-5" />}
                  badge={
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono",
                        change.isPositive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : change.isNegative
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                      )}
                    >
                      {change.isPositive ? (
                        <TrendingUp className="size-3" />
                      ) : change.isNegative ? (
                        <TrendingDown className="size-3" />
                      ) : null}
                      {change.text} vs prev
                    </span>
                  }
                  subText={`Prev: ${formatNumber(data.kpis.redemptions.previous)}`}
                />
              );
            })()}

            {/* 2. Unique Students */}
            {(() => {
              const change = formatChangePercent(data.kpis.uniqueStudents.changePercent);
              return (
                <StatTile
                  label="Unique Students"
                  value={formatNumber(data.kpis.uniqueStudents.current)}
                  accent="blue"
                  variant="hero"
                  icon={<Users className="size-5" />}
                  badge={
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono",
                        change.isPositive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : change.isNegative
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                      )}
                    >
                      {change.isPositive ? (
                        <TrendingUp className="size-3" />
                      ) : change.isNegative ? (
                        <TrendingDown className="size-3" />
                      ) : null}
                      {change.text} vs prev
                    </span>
                  }
                  subText={`Prev: ${formatNumber(data.kpis.uniqueStudents.previous)}`}
                />
              );
            })()}

            {/* 3. Cardholder Adoption Rate */}
            <StatTile
              label="Cardholder Adoption"
              value={`${data.kpis.cardholderRedemptionPercent}%`}
              accent="violet"
              variant="hero"
              icon={<CreditCard className="size-5" />}
              subText="Used card at least once"
            />

            {/* 4. Active Vendors */}
            <StatTile
              label="Active Partners"
              value={formatNumber(data.kpis.activeVendors)}
              accent="green"
              variant="hero"
              icon={<Store className="size-5" />}
              subText="Partner stores & cafes"
            />

            {/* 5. Cards by Type */}
            <StatTile
              label="Cards by Type"
              value={`${formatNumber(data.kpis.cardsByType.digital)} / ${formatNumber(data.kpis.cardsByType.physical)}`}
              accent="neutral"
              icon={<CreditCard className="size-4" />}
              subText="Digital vs Physical cards"
            />

            {/* 6. Physical Inventory */}
            <StatTile
              label="Physical Stock"
              value={`${formatNumber(data.kpis.physical.activated)} Active`}
              accent="amber"
              icon={<Layers className="size-4" />}
              subText={`${formatNumber(data.kpis.physical.unassigned)} of ${formatNumber(data.kpis.physical.printed)} unassigned`}
            />

            {/* 7. Pending Physical */}
            <StatTile
              label="Pending Pickup"
              value={formatNumber(data.kpis.pendingPhysicalStudents)}
              accent="orange"
              icon={<AlertTriangle className="size-4" />}
              subText="Students awaiting card"
            />

            {/* 8. Wallet Passes Issued */}
            <StatTile
              label="Wallet Passes"
              value={formatNumber(data.kpis.walletPassesIssued)}
              accent="blue"
              icon={<Wallet className="size-4" />}
              subText="Google Wallet links issued"
            />
          </div>

          {/* M8-4: REDEMPTIONS OVER TIME CHART */}
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl text-foreground">
                  REDEMPTIONS OVER TIME
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirmed scans aggregated by {data.granularity}
                </p>
              </div>

              {/* Granularity Toggle */}
              <SegmentedControl
                options={[
                  { value: "day", label: "Day" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                ]}
                value={data.granularity}
                onChange={(val) => updateParams({ granularity: val as "day" | "week" | "month" })}
                size="sm"
                ariaLabel="Granularity selector"
              />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <AreaChart
                data={data.timeseries.map((t) => ({
                  label: t.bucket,
                  value: t.redemptions,
                }))}
                height={260}
                accentColor="#018BCE"
                valueLabel="Redemptions"
                labelFormatter={(bucket) => {
                  if (data.granularity === "day") {
                    return formatCairoDateOnly(bucket);
                  }
                  return bucket;
                }}
                emptyMessage="No redemptions recorded for the selected filters."
              />
            </CardContent>
          </Card>

          {/* TWO COLUMN SECTION: Leaderboard & At Risk Vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* M8-2: VENDOR LEADERBOARD TABLE (2 Cols on lg) */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-foreground">
                      VENDOR LEADERBOARD
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Top performing vendors ranked by redemption volume
                    </p>
                  </div>
                  <Badge variant="brand" className="text-xs font-bold font-mono">
                    {data.leaderboard.length} Vendors
                  </Badge>
                </CardHeader>

                <CardContent className="p-0">
                  {data.leaderboard.length === 0 ? (
                    <div className="p-8">
                      <StatusState
                        layout="panel"
                        icon={<Store className="size-8 text-muted-foreground" />}
                        title="No vendor activity"
                        description="No redemptions logged for vendors in this period."
                      />
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider">
                              <th className="px-4 py-3">#</th>
                              <th
                                className="px-4 py-3 cursor-pointer hover:text-foreground"
                                onClick={() => handleSort("name")}
                              >
                                <div className="flex items-center gap-1">
                                  <span>Vendor</span>
                                  <ArrowUpDown className="size-3" />
                                </div>
                              </th>
                              <th className="px-3 py-3">Category</th>
                              <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-foreground"
                                onClick={() => handleSort("redemptions")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <span>Redemptions</span>
                                  <ArrowUpDown className="size-3" />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-foreground"
                                onClick={() => handleSort("uniqueStudents")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <span>Students</span>
                                  <ArrowUpDown className="size-3" />
                                </div>
                              </th>
                              <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-foreground"
                                onClick={() => handleSort("changePercent")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <span>Growth</span>
                                  <ArrowUpDown className="size-3" />
                                </div>
                              </th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {sortedLeaderboard.map((vendor, idx) => {
                              const change = formatChangePercent(vendor.changePercent);
                              return (
                                <tr
                                  key={vendor.id}
                                  className="hover:bg-muted/30 transition-colors group"
                                >
                                  <td className="px-4 py-3.5 font-mono text-ash dark:text-zinc-500 font-bold">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                        {vendor.logoUrl ? (
                                          <Image
                                            src={vendor.logoUrl}
                                            alt={vendor.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-contain"
                                            unoptimized
                                          />
                                        ) : (
                                          <span className="font-heading text-xs font-bold text-brand">
                                            {vendor.name.slice(0, 2).toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <Link
                                        href={`/admin/vendors/${vendor.id}`}
                                        className="font-bold text-foreground hover:text-brand dark:hover:text-brand-soft truncate block"
                                      >
                                        {vendor.name}
                                      </Link>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3.5">
                                    <Badge variant="secondary" className="text-[10px] capitalize">
                                      {vendor.category}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                                    {formatNumber(vendor.redemptions)}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-mono text-muted-foreground">
                                    {formatNumber(vendor.uniqueStudents)}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-mono">
                                    <span
                                      className={cn(
                                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                                        change.isPositive
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                          : change.isNegative
                                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                          : "bg-slate-100 dark:bg-zinc-800 text-slate-600"
                                      )}
                                    >
                                      {change.text}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    <Link
                                      href={`/admin/vendors/${vendor.id}`}
                                      className="inline-flex items-center gap-1 font-bold text-xs text-brand dark:text-brand-soft hover:underline"
                                    >
                                      <span>View</span>
                                      <ArrowRight className="size-3" />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card List */}
                      <div className="md:hidden divide-y divide-border p-3 space-y-2.5">
                        {sortedLeaderboard.map((vendor, idx) => {
                          const change = formatChangePercent(vendor.changePercent);
                          return (
                            <div
                              key={vendor.id}
                              className="p-3.5 rounded-xl border border-border bg-card space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-mono text-xs font-bold text-muted-foreground">
                                    #{idx + 1}
                                  </span>
                                  <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                    {vendor.logoUrl ? (
                                      <Image
                                        src={vendor.logoUrl}
                                        alt={vendor.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-contain"
                                        unoptimized
                                      />
                                    ) : (
                                      <span className="font-heading text-xs font-bold text-brand">
                                        {vendor.name.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <Link
                                    href={`/admin/vendors/${vendor.id}`}
                                    className="font-bold text-xs text-foreground truncate"
                                  >
                                    {vendor.name}
                                  </Link>
                                </div>
                                <span
                                  className={cn(
                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0",
                                    change.isPositive
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      : change.isNegative
                                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                      : "bg-slate-100 dark:bg-zinc-800 text-slate-600"
                                  )}
                                >
                                  {change.text}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-border font-mono">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-muted-foreground font-sans block">
                                    Redemptions
                                  </span>
                                  <span className="font-bold text-foreground">
                                    {formatNumber(vendor.redemptions)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-muted-foreground font-sans block">
                                    Students
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatNumber(vendor.uniqueStudents)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* M8-3: AT RISK VENDORS PANEL (1 Col on lg) */}
            <div>
              <Card className="border-2 border-amber-300/80 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/10 shadow-xs h-full flex flex-col">
                <CardHeader className="p-4 sm:p-5 border-b border-amber-200/60 dark:border-amber-900/40 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <CardTitle className="text-base sm:text-lg text-amber-900 dark:text-amber-200">
                        AT-RISK VENDORS
                      </CardTitle>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                        Below activity threshold
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="warning"
                    className="text-xs font-bold font-mono"
                  >
                    {data.atRisk.length}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  {data.atRisk.length === 0 ? (
                    <div className="my-auto py-6 text-center space-y-2">
                      <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-foreground">
                        All Vendors Healthy
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        All active partners meet the minimum redemption threshold.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.atRisk.map((vendor) => (
                        <Link
                          key={vendor.id}
                          href={`/admin/vendors/${vendor.id}`}
                          className="block p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white/80 dark:bg-zinc-900/80 hover:border-amber-400 dark:hover:border-amber-600 transition-all group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 truncate">
                              {vendor.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 font-mono">
                              {vendor.redemptions} / {vendor.threshold}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Fewer than {vendor.threshold} scans in the last {vendor.days} days
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 mt-4 border-t border-amber-200/50 dark:border-amber-900/30 text-[11px] text-muted-foreground">
                    Tip: Reach out to at-risk partners to adjust discounts or verify their cashier scanner setup.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
