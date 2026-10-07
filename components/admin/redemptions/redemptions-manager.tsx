"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCcw,
  Filter,
  CheckCircle2,
  DollarSign,
  Ban,
  ScrollText,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { StatTile } from "@/components/ui/stat-tile";
import { listRedemptions, listVendorsForFilter } from "./api";
import { RedemptionsTable } from "./redemptions-table";
import { VoidRedemptionDialog } from "./void-redemption-dialog";
import type { RedemptionDto, VendorDto } from "@/lib/vendors/types";

const RESULT_OPTIONS = [
  { value: "", label: "All Results" },
  { value: "valid", label: "Valid Discounts" },
  { value: "not_su_card", label: "Not an SU Card" },
  { value: "card_not_activated", label: "Card Not Activated" },
  { value: "card_cancelled", label: "Card Cancelled" },
  { value: "student_suspended", label: "Student Suspended" },
  { value: "vendor_inactive", label: "Vendor Inactive" },
  { value: "no_active_offer", label: "No Active Offer" },
  { value: "limit_reached", label: "Limit Reached" },
  { value: "rate_limited", label: "Rate Limited" },
];

export function RedemptionsManager() {
  const [redemptions, setRedemptions] = useState<RedemptionDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<string>("");
  const [confirmedOnly, setConfirmedOnly] = useState(false);

  // Void Dialog
  const [voidingRedemption, setVoidingRedemption] = useState<RedemptionDto | null>(null);

  // Fetch vendors once for filter dropdown
  useEffect(() => {
    listVendorsForFilter()
      .then((res) => setVendors(res.vendors || []))
      .catch(() => {});
  }, []);

  const fetchRedemptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await listRedemptions({
        vendorId: selectedVendorId || undefined,
        result: selectedResult || undefined,
        confirmed: confirmedOnly ? "true" : undefined,
      });

      setRedemptions(res.redemptions || []);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load redemptions ledger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendorId, selectedResult, confirmedOnly]);

  useEffect(() => {
    let active = true;
    listRedemptions({
      vendorId: selectedVendorId || undefined,
      result: selectedResult || undefined,
      confirmed: confirmedOnly ? "true" : undefined,
    })
      .then((res) => {
        if (active) {
          setRedemptions(res.redemptions || []);
          setNextCursor(res.nextCursor);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load redemptions ledger"
          );
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedVendorId, selectedResult, confirmedOnly]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const res = await listRedemptions({
        vendorId: selectedVendorId || undefined,
        result: selectedResult || undefined,
        confirmed: confirmedOnly ? "true" : undefined,
        cursor: nextCursor,
      });

      setRedemptions((prev) => [...prev, ...(res.redemptions || [])]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more records"
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRedemptionVoided = (id: string, reason: string) => {
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, voided: true, voidReason: reason } : r
      )
    );
  };

  // Compute summary KPI metrics from loaded list
  const stats = useMemo(() => {
    const totalCount = redemptions.length;
    const confirmedCount = redemptions.filter((r) => r.confirmed && !r.voided).length;
    const voidedCount = redemptions.filter((r) => r.voided).length;
    const totalBill = redemptions
      .filter((r) => r.confirmed && !r.voided && r.billAmount)
      .reduce((sum, r) => sum + parseFloat(r.billAmount || "0"), 0);

    return { totalCount, confirmedCount, voidedCount, totalBill };
  }, [redemptions]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-3xl sm:text-4xl font-normal uppercase tracking-wide text-foreground">
              REDEMPTIONS LEDGER
            </h1>
            {isLoading && redemptions.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand/10 text-brand dark:text-brand-soft border border-brand/20 animate-pulse motion-reduce:animate-none">
                <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />
                <span>Updating…</span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Comprehensive audit log of cashier scans, verified discounts, and voided transactions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchRedemptions()}
          disabled={isLoading}
          className="normal-case font-bold min-h-[44px] h-11 px-4 rounded-xl border-border shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className={`size-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Summary KPI Tiles - Explicitly scoped to loaded records */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            label="LOADED SCANS"
            value={stats.totalCount}
            icon={<ScrollText className="size-4" />}
            accent="brand"
            className="p-4"
            subText={nextCursor ? `${stats.totalCount} in view (more below)` : `All ${stats.totalCount} records in view`}
          />

          <StatTile
            label="CONFIRMED (LOADED)"
            value={stats.confirmedCount}
            icon={<CheckCircle2 className="size-4" />}
            accent="blue"
            className="p-4"
            subText={`${stats.confirmedCount} of ${stats.totalCount} loaded entries`}
          />

          <StatTile
            label="RECORDED BILL (LOADED)"
            value={`EGP ${stats.totalBill.toFixed(2)}`}
            icon={<DollarSign className="size-4" />}
            accent="neutral"
            className="p-4"
            subText={`Sum of confirmed scans in view`}
          />

          <StatTile
            label="VOIDED (LOADED)"
            value={stats.voidedCount}
            icon={<Ban className="size-4" />}
            accent="neutral"
            className="p-4"
            subText={`${stats.voidedCount} voided in loaded view`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-ash dark:text-zinc-400 px-1 font-medium">
          <span>
            Metrics reflect the {stats.totalCount} loaded records currently in view.
            {nextCursor ? " Tap “Load more records” below to include older ledger entries." : " All matching ledger entries are loaded."}
          </span>
        </div>
      </div>

      {/* Filters Bar with Programmatic Labels */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="size-3.5" />
          <span>Filter Ledger</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Vendor Filter */}
          <div className="space-y-1.5">
            <label
              htmlFor="redemptions-vendor-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400"
            >
              Partner Vendor
            </label>
            <select
              id="redemptions-vendor-select"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full min-h-[44px] h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
            >
              <option value="">All Partner Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category})
                </option>
              ))}
            </select>
          </div>

          {/* Result Filter */}
          <div className="space-y-1.5">
            <label
              htmlFor="redemptions-result-select"
              className="block text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400"
            >
              Scan Result
            </label>
            <select
              id="redemptions-result-select"
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="w-full min-h-[44px] h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
            >
              {RESULT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Confirmed Only Toggle */}
          <div className="space-y-1.5">
            <span
              id="redemptions-confirmed-label"
              className="block text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400"
            >
              Confirmation Status
            </span>
            <ToggleChip
              pressed={confirmedOnly}
              onPressedChange={(pressed) => setConfirmedOnly(pressed)}
              className="min-h-[44px] h-11 w-full justify-center"
              aria-labelledby="redemptions-confirmed-label"
            >
              <span>Confirmed Discounts Only</span>
            </ToggleChip>
          </div>
        </div>
      </div>

      {/* Table / Cards Ledger */}
      <RedemptionsTable
        redemptions={redemptions}
        isLoading={isLoading}
        error={error}
        onRetry={fetchRedemptions}
        onVoidClick={(r) => setVoidingRedemption(r)}
      />

      {/* Keyset Pagination: Load More */}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="normal-case font-bold min-h-[44px] h-12 px-8 rounded-2xl border-border bg-card shadow-xs cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Loading more records…</span>
              </>
            ) : (
              <>
                <ChevronDown className="size-4 mr-1.5" />
                <span>Load more records</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Void Dialog Modal */}
      <VoidRedemptionDialog
        redemption={voidingRedemption}
        isOpen={!!voidingRedemption}
        onClose={() => setVoidingRedemption(null)}
        onRedemptionVoided={handleRedemptionVoided}
      />
    </div>
  );
}
