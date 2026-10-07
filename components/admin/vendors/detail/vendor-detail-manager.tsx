"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Store,
  MapPin,
  Tag,
  Users,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabBar, type TabBarItem } from "@/components/ui/tab-bar";
import { OverflowScroller } from "@/components/ui/overflow-scroller";
import { Badge } from "@/components/ui/badge";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getVendor } from "../api";
import { isExpiringSoon } from "../vendors-table";
import { VendorInsightsTab } from "./vendor-insights-tab";
import { VendorOverviewTab } from "./vendor-overview-tab";
import { VendorOffersTab } from "./vendor-offers-tab";
import { VendorAccountsTab } from "./vendor-accounts-tab";
import { cn } from "cn";
import type { VendorDto, VendorCategory } from "@/lib/vendors/types";

interface VendorDetailManagerProps {
  vendorId: string;
}

type TabKey = "insights" | "overview" | "offers" | "accounts";

const TABS: TabBarItem<TabKey>[] = [
  {
    id: "insights",
    label: "Insights",
    icon: <TrendingUp className="size-4" />,
  },
  {
    id: "overview",
    label: "Overview",
    icon: <Settings className="size-4" />,
  },
  {
    id: "offers",
    label: "Offers & Limits",
    icon: <Tag className="size-4" />,
  },
  {
    id: "accounts",
    label: "Staff Accounts",
    icon: <Users className="size-4" />,
  },
];

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  coffee: "Coffee & Drinks",
  food: "Food & Dining",
  fitness: "Fitness & Gym",
  books: "Books & Stationery",
  services: "Services",
  other: "Other",
};

export function VendorDetailManager({ vendorId }: VendorDetailManagerProps) {
  const [vendor, setVendor] = useState<VendorDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("insights");

  const fetchVendorData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getVendor(vendorId);
      setVendor(res.vendor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vendor details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    let active = true;
    getVendor(vendorId)
      .then((res) => {
        if (active) {
          setVendor(res.vendor);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load vendor details"
          );
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to vendors</span>
        </Link>
        <StatusState
          icon={<Store className="size-6" />}
          variant="warning"
          title="Vendor not found"
          description={error || "The requested vendor could not be found."}
          actions={
            <Button
              variant="primary"
              onClick={fetchVendorData}
              className="normal-case font-bold mt-2"
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const contractStatus = isExpiringSoon(vendor.contractEnd);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Back Link */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to vendors</span>
        </Link>
      </div>

      {/* Vendor Header Card */}
      <div className="p-5 sm:p-7 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-16 sm:size-20 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {vendor.logoUrl ? (
              <Image
                src={vendor.logoUrl}
                alt={vendor.name}
                width={80}
                height={80}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : (
              <span className="font-heading text-2xl sm:text-3xl font-bold text-brand dark:text-brand-soft">
                {vendor.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl font-normal uppercase tracking-wide text-foreground truncate">
                {vendor.name}
              </h1>

              {/* Status pill */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                  vendor.status === "active"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : vendor.status === "paused"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    vendor.status === "active"
                      ? "bg-emerald-500"
                      : vendor.status === "paused"
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                  )}
                />
                <span>{vendor.status}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="font-medium text-xs">
                {CATEGORY_LABELS[vendor.category] || vendor.category}
              </Badge>

              {vendor.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  <span>{vendor.location}</span>
                </div>
              )}

              {vendor.contractEnd && (
                <div className="flex items-center gap-1 font-mono">
                  <span>Contract: {vendor.contractStart || "—"} &rarr; {vendor.contractEnd}</span>
                  {contractStatus.expired ? (
                    <span className="text-rose-600 font-bold ml-1">(Expired)</span>
                  ) : contractStatus.expiring ? (
                    <span className="text-amber-600 font-bold ml-1">({contractStatus.daysLeft}d left)</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Overflow Scroller for mobile discoverability */}
      <OverflowScroller className="max-w-full">
        <TabBar
          items={TABS}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Vendor detail sections"
          fullWidth
          size="md"
        />
      </OverflowScroller>

      {/* Tab Panels */}
      <div>
        {activeTab === "insights" && (
          <VendorInsightsTab vendorId={vendor.id} />
        )}

        {activeTab === "overview" && (
          <VendorOverviewTab
            vendor={vendor}
            onVendorUpdated={(updated) => setVendor(updated)}
          />
        )}

        {activeTab === "offers" && (
          <VendorOffersTab vendorId={vendor.id} />
        )}

        {activeTab === "accounts" && (
          <VendorAccountsTab vendorId={vendor.id} />
        )}
      </div>
    </div>
  );
}
