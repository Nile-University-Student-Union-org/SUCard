"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Receipt,
  Tag,
  UserPlus,
  Key,
  Ban,
  CheckCircle2,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { TabBar, type TabBarItem } from "@/components/ui/tab-bar";
import { OverflowScroller } from "@/components/ui/overflow-scroller";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { AreaChart, BarChart, PeakHoursChart } from "@/components/ui/charts";
import {
  formatCairoDateOnly,
  formatNumber,
  formatCurrency,
  formatChangePercent,
} from "@/components/ui/analytics-format";
import type {
  VendorOverviewResponse,
  VendorOffersResponse,
  CashiersResponse,
} from "@/lib/analytics/types";
import { cn } from "cn";

type VendorTabKey = "overview" | "offers" | "cashiers";

const TABS: TabBarItem<VendorTabKey>[] = [
  {
    id: "overview",
    label: "Overview & Analytics",
    icon: <TrendingUp className="size-4" />,
  },
  {
    id: "offers",
    label: "Offers & Limits",
    icon: <Tag className="size-4" />,
  },
  {
    id: "cashiers",
    label: "Cashier Accounts",
    icon: <Users className="size-4" />,
  },
];

export function VendorPortalManager() {
  const [activeTab, setActiveTab] = useState<VendorTabKey>("overview");

  // 1. Overview State
  const [overview, setOverview] = useState<VendorOverviewResponse | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // 2. Offers State
  const [offers, setOffers] = useState<VendorOffersResponse["offers"]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  // 3. Cashiers State
  const [cashiers, setCashiers] = useState<CashiersResponse["cashiers"]>([]);
  const [isCashiersLoading, setIsCashiersLoading] = useState(false);
  const [cashiersError, setCashiersError] = useState<string | null>(null);

  // Cashier Modals
  const [isAddCashierOpen, setIsAddCashierOpen] = useState(false);
  const [cashierName, setCashierName] = useState("");
  const [cashierEmail, setCashierEmail] = useState("");
  const [cashierBranchId, setCashierBranchId] = useState("");
  const [cashierPassword, setCashierPassword] = useState("");
  const [isAddingCashier, setIsAddingCashier] = useState(false);
  const [addCashierError, setAddCashierError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetCashierId, setResetCashierId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Revoke Sessions Modal
  const [revokeCashier, setRevokeCashier] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch Overview
  const fetchOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    setOverviewError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);

      const res = await fetch(`/api/vendor/overview?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as VendorOverviewResponse;
      setOverview(data);
      if (data.branches && data.branches.length > 0 && !cashierBranchId) {
        setCashierBranchId(data.branches[0].id);
      }
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setIsOverviewLoading(false);
    }
  }, [dateRange, cashierBranchId]);

  // Fetch Offers
  const fetchOffers = useCallback(async () => {
    setIsOffersLoading(true);
    setOffersError(null);
    try {
      const res = await fetch("/api/vendor/offers", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as VendorOffersResponse;
      setOffers(data.offers || []);
    } catch (err) {
      setOffersError(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setIsOffersLoading(false);
    }
  }, []);

  // Fetch Cashiers
  const fetchCashiers = useCallback(async () => {
    setIsCashiersLoading(true);
    setCashiersError(null);
    try {
      const res = await fetch("/api/vendor/cashiers", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CashiersResponse;
      setCashiers(data.cashiers || []);
    } catch (err) {
      setCashiersError(err instanceof Error ? err.message : "Failed to load cashiers");
    } finally {
      setIsCashiersLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange.from) params.set("from", dateRange.from);
        if (dateRange.to) params.set("to", dateRange.to);

        const res = await fetch(`/api/vendor/overview?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as VendorOverviewResponse;
        if (!ignore) {
          setOverview(data);
          if (data.branches && data.branches.length > 0 && !cashierBranchId) {
            setCashierBranchId(data.branches[0].id);
          }
          setIsOverviewLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setOverviewError(err instanceof Error ? err.message : "Failed to load overview");
          setIsOverviewLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [dateRange, cashierBranchId]);

  useEffect(() => {
    let ignore = false;
    if (activeTab === "offers") {
      void (async () => {
        try {
          const res = await fetch("/api/vendor/offers", {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as VendorOffersResponse;
          if (!ignore) {
            setOffers(data.offers || []);
            setIsOffersLoading(false);
          }
        } catch (err) {
          if (!ignore) {
            setOffersError(err instanceof Error ? err.message : "Failed to load offers");
            setIsOffersLoading(false);
          }
        }
      })();
    } else if (activeTab === "cashiers") {
      void (async () => {
        try {
          const res = await fetch("/api/vendor/cashiers", {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as CashiersResponse;
          if (!ignore) {
            setCashiers(data.cashiers || []);
            setIsCashiersLoading(false);
          }
        } catch (err) {
          if (!ignore) {
            setCashiersError(err instanceof Error ? err.message : "Failed to load cashiers");
            setIsCashiersLoading(false);
          }
        }
      })();
    }
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    window.open(`/api/vendor/export?${params.toString()}`, "_blank");
  };

  // Create Cashier
  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierBranchId) {
      setAddCashierError("Please select a branch.");
      return;
    }

    if (cashierPassword && cashierPassword.length < 8) {
      setAddCashierError("Password must be at least 8 characters");
      return;
    }

    setIsAddingCashier(true);
    setAddCashierError(null);

    try {
      const payload: Record<string, unknown> = {
        name: cashierName.trim(),
        email: cashierEmail.trim().toLowerCase(),
        branchId: cashierBranchId,
      };
      if (cashierPassword && cashierPassword.trim()) {
        payload.password = cashierPassword.trim();
      }

      const res = await fetch("/api/vendor/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddCashierError(resData.error || "Failed to create cashier account");
        setIsAddingCashier(false);
        return;
      }

      setIsAddCashierOpen(false);
      setCashierName("");
      setCashierEmail("");
      setCashierPassword("");
      fetchCashiers();
    } catch {
      setAddCashierError("Network error. Please try again.");
    } finally {
      setIsAddingCashier(false);
    }
  };

  // Revoke Cashier Sessions
  const handleRevokeCashierSessions = async () => {
    if (!revokeCashier) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/vendor/cashiers/${revokeCashier.id}/revoke-sessions`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sign out devices");
      }
      setRevokeCashier(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sign out devices");
    } finally {
      setIsRevoking(false);
    }
  };

  // Toggle Cashier Status
  const handleToggleCashierStatus = async (cashierId: string, currentStatus: "active" | "disabled") => {
    const targetStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`/api/vendor/cashiers/${cashierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setCashiers((prev) =>
        prev.map((c) => (c.id === cashierId ? { ...c, status: targetStatus } : c))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCashierId) return;

    setIsResetting(true);
    setResetError(null);

    try {
      const res = await fetch(`/api/vendor/cashiers/${resetCashierId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });

      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        setResetError(resData.error || "Failed to reset password");
        setIsResetting(false);
        return;
      }

      setResetSuccess(true);
      setTimeout(() => {
        setResetCashierId(null);
        setResetPassword("");
        setResetSuccess(false);
      }, 1200);
    } catch {
      setResetError("Network error. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const redemptionChange = formatChangePercent(overview?.redemptions.changePercent);
  const studentChange = formatChangePercent(overview?.uniqueStudents.changePercent);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white">
            {overview?.vendor.name ? `${overview.vendor.name.toUpperCase()} PORTAL` : "VENDOR PORTAL"}
          </h1>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-1">
            Track student redemptions, view promotion limits, and manage your cashier scanning team.
          </p>
        </div>

        <Button
          variant="surface"
          size="sm"
          onClick={handleExportCsv}
          className="normal-case font-bold h-10 px-3.5 text-xs text-brand dark:text-brand-soft border-slate-300 dark:border-zinc-700 self-start sm:self-center"
        >
          <Download className="size-3.5 mr-1.5" />
          Export Stats CSV
        </Button>
      </div>

      {/* Navigation Tab Bar */}
      <OverflowScroller className="max-w-full">
        <TabBar
          items={TABS}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Vendor portal sections"
          fullWidth
          size="md"
        />
      </OverflowScroller>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Date Range Picker Bar */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400 mb-1.5">
                Time Range
              </span>
              <DateRangePicker
                from={overview?.range.from}
                to={overview?.range.to}
                onChange={({ from, to }) => setDateRange({ from, to })}
              />
            </div>

            {overview?.range && (
              <div className="text-left md:text-right text-xs text-muted-foreground font-mono">
                <span className="font-bold text-foreground">
                  {formatCairoDateOnly(overview.range.from)} &rarr; {formatCairoDateOnly(overview.range.to)}
                </span>
                <span className="block text-[11px] text-ash dark:text-zinc-400 font-sans">
                  vs prev {overview.range.days} days ({formatCairoDateOnly(overview.range.previousFrom)} – {formatCairoDateOnly(overview.range.previousTo)})
                </span>
              </div>
            )}
          </div>

          {/* Overview Loading / Error / Content */}
          {overviewError ? (
            <div className="p-8">
              <StatusState
                layout="panel"
                variant="destructive"
                icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
                title="Failed to load analytics"
                description={overviewError}
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchOverview}
                    className="normal-case font-bold"
                  >
                    <RotateCcw className="size-3.5 mr-1.5" />
                    Try again
                  </Button>
                }
              />
            </div>
          ) : isOverviewLoading && !overview ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : overview ? (
            <>
              {/* 4 KPIs GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Redemptions */}
                <StatTile
                  label="Total Redemptions"
                  value={formatNumber(overview.redemptions.current)}
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
                  subText={`Prev: ${formatNumber(overview.redemptions.previous)}`}
                />

                {/* 2. Unique Students */}
                <StatTile
                  label="Unique Students"
                  value={formatNumber(overview.uniqueStudents.current)}
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
                  subText={`Prev: ${formatNumber(overview.uniqueStudents.previous)}`}
                />

                {/* 3. Total Bill Recorded */}
                <StatTile
                  label="Recorded Revenue"
                  value={formatCurrency(overview.totalBill)}
                  accent="green"
                  variant="hero"
                  icon={<DollarSign className="size-5" />}
                  subText="Total bill amounts entered"
                />

                {/* 4. Average Ticket */}
                <StatTile
                  label="Average Ticket"
                  value={formatCurrency(overview.averageBill)}
                  accent="amber"
                  variant="hero"
                  icon={<Sparkles className="size-5" />}
                  subText="Average bill per redemption"
                />
              </div>

              {/* TREND CHART: Redemptions over time */}
              <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                  <CardTitle className="text-lg sm:text-xl text-foreground">
                    REDEMPTION TRAFFIC
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daily confirmed scans at your stores
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <AreaChart
                    data={overview.timeseries.map((t) => ({
                      label: t.bucket,
                      value: t.redemptions,
                    }))}
                    height={240}
                    accentColor="#018BCE"
                    valueLabel="Redemptions"
                    labelFormatter={(bucket) => formatCairoDateOnly(bucket)}
                    emptyMessage="No redemptions logged in this date range."
                  />
                </CardContent>
              </Card>

              {/* TWO COLUMNS: Branches breakdown & Offers breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branches breakdown */}
                <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                  <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                    <CardTitle className="text-base sm:text-lg text-foreground">
                      BY BRANCH
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <BarChart
                      data={overview.branches.map((b) => ({
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
                <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                  <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                    <CardTitle className="text-base sm:text-lg text-foreground">
                      BY OFFER
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <BarChart
                      data={overview.offers.map((o) => ({
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
              <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
                  <CardTitle className="text-base sm:text-lg text-foreground">
                    PEAK ACTIVITY DISTRIBUTION
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Busiest hours and days across all branches (Cairo time)
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <PeakHoursChart
                    peakHours={overview.peakHours}
                    peakDays={overview.peakDays}
                  />
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2: OFFERS & LIMITS */}
      {activeTab === "offers" && (
        <div className="space-y-6">
          {/* Note Callout */}
          <div className="p-4 rounded-2xl border-2 border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 flex items-start gap-3">
            <Info className="size-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-900 dark:text-sky-200 space-y-0.5">
              <p className="font-bold">Active Offers & Limits</p>
              <p className="text-sky-800/80 dark:text-sky-300/80">
                Offers and redemption limits are managed jointly with Nile University Student Union (NUSU). To create new discounts, adjust usage limits, or update schedule rules, please contact the SU admin team.
              </p>
            </div>
          </div>

          {isOffersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : offersError ? (
            <StatusState
              layout="panel"
              variant="destructive"
              title="Could not load offers"
              description={offersError}
              actions={
                <Button variant="outline" size="sm" onClick={fetchOffers}>
                  Retry
                </Button>
              }
            />
          ) : offers.length === 0 ? (
            <StatusState
              layout="panel"
              icon={<Tag className="size-8 text-muted-foreground" />}
              title="No active offers"
              description="Your store does not have any active discount offers configured."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <Card
                  key={offer.id}
                  className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs"
                >
                  <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base sm:text-lg text-foreground">
                        {offer.title}
                      </CardTitle>
                      <Badge variant="brand" className="text-xs font-bold font-mono">
                        {offer.discountLabel}
                      </Badge>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 border",
                        offer.status === "active"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      )}
                    >
                      {offer.status}
                    </span>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
                    {offer.terms && (
                      <div className="text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border">
                        &ldquo;{offer.terms}&rdquo;
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-ash dark:text-zinc-400 block">
                          Per-Student Limit
                        </span>
                        <span className="font-bold text-foreground font-mono">
                          {offer.limitPeriod === "unlimited"
                            ? "Unlimited"
                            : `${offer.limitCount} per ${offer.limitPeriod}`}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-ash dark:text-zinc-400 block">
                          Schedule
                        </span>
                        <span className="text-foreground">
                          {offer.activeDays?.length
                            ? `Days: ${offer.activeDays.join(", ")}`
                            : "Every day"}
                          {offer.activeFrom ? ` (${offer.activeFrom}–${offer.activeTo || "close"})` : ""}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CASHIER ACCOUNTS */}
      {activeTab === "cashiers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Branch Cashiers
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Staff members authorized to scan student cards at store registers.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setCashierName("");
                setCashierEmail("");
                setCashierPassword("");
                setAddCashierError(null);
                setIsAddCashierOpen(true);
              }}
              className="normal-case font-bold h-10 px-4 shrink-0"
            >
              <UserPlus className="size-4 mr-1.5" />
              Add Cashier
            </Button>
          </div>

          {isCashiersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : cashiersError ? (
            <StatusState
              layout="panel"
              variant="destructive"
              title="Could not load cashiers"
              description={cashiersError}
              actions={
                <Button variant="outline" size="sm" onClick={fetchCashiers}>
                  Retry
                </Button>
              }
            />
          ) : cashiers.length === 0 ? (
            <StatusState
              layout="panel"
              icon={<Users className="size-8 text-muted-foreground" />}
              title="No cashiers yet"
              description="Add cashier accounts so your staff can log in to the scanner web app."
              actions={
                <Button
                  variant="primary"
                  onClick={() => setIsAddCashierOpen(true)}
                  className="normal-case font-bold mt-2"
                >
                  <UserPlus className="size-4 mr-1.5" />
                  Add First Cashier
                </Button>
              }
            />
          ) : (
            <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">Cashier</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cashiers.map((cashier) => (
                        <tr key={cashier.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-foreground">
                              {cashier.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {cashier.email}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-sans font-medium text-foreground">
                            {cashier.branchName || "All Branches"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                cashier.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                              )}
                            >
                              {cashier.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <Button
                                variant="surface"
                                size="sm"
                                onClick={() => setRevokeCashier({ id: cashier.id, name: cashier.name, email: cashier.email })}
                                className="h-8 px-2.5 text-xs font-semibold normal-case"
                                title="Sign out all devices for this cashier"
                              >
                                <LogOut className="size-3 mr-1" />
                                Sign Out Devices
                              </Button>

                              <Button
                                variant="surface"
                                size="sm"
                                onClick={() => {
                                  setResetCashierId(cashier.id);
                                  setResetPassword("");
                                  setResetError(null);
                                  setResetSuccess(false);
                                }}
                                className="h-8 px-2.5 text-xs font-semibold normal-case"
                              >
                                <Key className="size-3 mr-1" />
                                Reset Password
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleCashierStatus(cashier.id, cashier.status)}
                                className={cn(
                                  "h-8 px-2.5 text-xs font-semibold normal-case",
                                  cashier.status === "active"
                                    ? "text-rose-600 hover:bg-rose-500/10"
                                    : "text-emerald-600 hover:bg-emerald-500/10"
                                )}
                              >
                                {cashier.status === "active" ? (
                                  <>
                                    <Ban className="size-3 mr-1" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="size-3 mr-1" />
                                    Enable
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-border p-3 space-y-2.5">
                  {cashiers.map((cashier) => (
                    <div
                      key={cashier.id}
                      className="p-3.5 rounded-xl border border-border bg-card space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-xs text-foreground">{cashier.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{cashier.email}</p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
                            cashier.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                          )}
                        >
                          {cashier.status}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Branch: <strong className="text-foreground font-semibold">{cashier.branchName || "All Branches"}</strong>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
                        <Button
                          variant="surface"
                          size="sm"
                          onClick={() => setRevokeCashier({ id: cashier.id, name: cashier.name, email: cashier.email })}
                          className="h-9 px-2 text-xs font-semibold normal-case"
                        >
                          <LogOut className="size-3 mr-1" />
                          Sign Out
                        </Button>

                        <Button
                          variant="surface"
                          size="sm"
                          onClick={() => {
                            setResetCashierId(cashier.id);
                            setResetPassword("");
                            setResetError(null);
                            setResetSuccess(false);
                          }}
                          className="h-9 px-2 text-xs font-semibold normal-case"
                        >
                          <Key className="size-3 mr-1" />
                          Password
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCashierStatus(cashier.id, cashier.status)}
                          className={cn(
                            "h-9 px-2 text-xs font-semibold normal-case",
                            cashier.status === "active"
                              ? "text-rose-600 hover:bg-rose-500/10"
                              : "text-emerald-600 hover:bg-emerald-500/10"
                          )}
                        >
                          {cashier.status === "active" ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MODAL 1: Add Cashier Account */}
      <Modal
        isOpen={isAddCashierOpen}
        onClose={() => {
          if (!isAddingCashier) setIsAddCashierOpen(false);
        }}
        title="Create Cashier Account"
        icon={<UserPlus className="size-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateCashier}>
          <ModalBody className="space-y-4">
            {addCashierError && (
              <Alert variant="destructive" size="sm" description={addCashierError} />
            )}

            <Input
              id="newCashierName"
              label="Staff Name"
              placeholder="e.g. Ahmed Cashier"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              required
              autoFocus
            />

            <Input
              id="newCashierEmail"
              type="email"
              label="Email Address"
              placeholder="cashier@store.local"
              value={cashierEmail}
              onChange={(e) => setCashierEmail(e.target.value)}
              required
            />

            {overview?.branches && overview.branches.length > 0 && (
              <Dropdown
                label="Assigned Branch"
                value={cashierBranchId}
                onChange={(val) => setCashierBranchId(val)}
                options={overview.branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
                className="w-full"
              />
            )}

            <div className="space-y-2">
              <Input
                id="newCashierPassword"
                type="password"
                label="Login Password (Optional)"
                placeholder="Leave empty to email set-password link"
                value={cashierPassword}
                onChange={(e) => setCashierPassword(e.target.value)}
                helperText="Leave empty to email them a link to set their own password"
              />
              {cashierPassword && (
                <PasswordStrengthMeter password={cashierPassword} />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isAddingCashier}
              onClick={() => setIsAddCashierOpen(false)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isAddingCashier || (cashierPassword ? cashierPassword.length < 8 : false)}
              className="normal-case font-bold"
            >
              {isAddingCashier ? "Creating…" : "Create Cashier"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 2: Reset Cashier Password */}
      <Modal
        isOpen={resetCashierId !== null}
        onClose={() => {
          if (!isResetting) setResetCashierId(null);
        }}
        title="Reset Cashier Password"
        icon={<Lock className="size-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword}>
          <ModalBody className="space-y-4">
            {resetError && (
              <Alert variant="destructive" size="sm" description={resetError} />
            )}

            {resetSuccess && (
              <Alert
                variant="default"
                size="sm"
                description="Password reset successfully!"
              />
            )}

            <div className="space-y-2">
              <Input
                id="resetCashierPassword"
                type="password"
                label="New Password"
                placeholder="••••••••••••"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                autoFocus
              />
              <PasswordStrengthMeter password={resetPassword} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isResetting}
              onClick={() => setResetCashierId(null)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isResetting || resetPassword.length < 8}
              className="normal-case font-bold"
            >
              {isResetting ? "Updating…" : "Update Password"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 3: Revoke Cashier Sessions */}
      <Modal
        isOpen={revokeCashier !== null}
        onClose={() => {
          if (!isRevoking) setRevokeCashier(null);
        }}
        title="Sign Out All Devices"
        icon={<LogOut className="size-5 text-amber-600 dark:text-amber-400" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-4">
          <p className="text-sm text-foreground">
            Sign out all active sessions for <strong className="font-bold">{revokeCashier?.name}</strong> ({revokeCashier?.email})?
          </p>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs">
            <p className="font-bold mb-1">Cashier register sessions</p>
            <p className="text-amber-800 dark:text-amber-300 font-normal leading-relaxed">
              Cashier register devices stay signed in for 30 days unless revoked. Revoking sessions will immediately sign out all register devices for this cashier.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRevokeCashier(null)}
            disabled={isRevoking}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleRevokeCashierSessions}
            disabled={isRevoking}
            className="normal-case font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isRevoking ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Signing out…</span>
              </>
            ) : (
              <span>Sign out all devices</span>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
