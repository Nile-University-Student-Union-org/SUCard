"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  AlertTriangle,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import type { VendorDto, VendorCategory } from "@/lib/vendors/types";

interface VendorsTableProps {
  vendors: VendorDto[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onAddNew: () => void;
}

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  coffee: "Coffee & Drinks",
  food: "Food & Dining",
  fitness: "Fitness & Gym",
  books: "Books & Stationery",
  services: "Services",
  other: "Other",
};

export function isExpiringSoon(contractEnd: string | null): { expiring: boolean; daysLeft: number | null; expired: boolean } {
  if (!contractEnd) return { expiring: false, daysLeft: null, expired: false };
  try {
    const end = new Date(contractEnd);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return {
      expiring: daysLeft <= 30 && daysLeft >= 0,
      daysLeft,
      expired: daysLeft < 0,
    };
  } catch {
    return { expiring: false, daysLeft: null, expired: false };
  }
}

export function VendorsTable({
  vendors,
  isLoading,
  error,
  onRetry,
  onAddNew,
}: VendorsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-card/60 space-y-3"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-xl" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <StatusState
        icon={<Store className="size-6" />}
        variant="warning"
        title="Could not load vendors"
        description={error}
        actions={
          <Button variant="primary" onClick={onRetry} className="normal-case font-bold mt-2">
            Retry
          </Button>
        }
      />
    );
  }

  if (vendors.length === 0) {
    return (
      <StatusState
        icon={<Store className="size-6" />}
        variant="default"
        title="No vendors found"
        description="No partner vendors match your search criteria. Add a new vendor to get started."
        actions={
          <Button variant="primary" onClick={onAddNew} className="normal-case font-bold mt-2">
            Add new vendor
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-bold uppercase tracking-wider">
              <th className="px-5 py-3.5">Vendor</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5">Contract End</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.map((vendor) => {
              const contractStatus = isExpiringSoon(vendor.contractEnd);

              return (
                <tr
                  key={vendor.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Vendor Name & Logo */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {vendor.logoUrl ? (
                          <Image
                            src={vendor.logoUrl}
                            alt={vendor.name}
                            width={44}
                            height={44}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="font-heading text-base font-bold text-brand dark:text-brand-soft">
                            {vendor.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <Link
                          href={`/admin/vendors/${vendor.id}`}
                          className="font-bold text-foreground hover:text-brand dark:hover:text-brand-soft transition-colors truncate block focus-visible:outline-sky-400"
                        >
                          {vendor.name}
                        </Link>
                        {vendor.contactEmail && (
                          <p className="text-xs text-muted-foreground truncate">
                            {vendor.contactEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className="font-medium text-xs">
                      {CATEGORY_LABELS[vendor.category] || vendor.category}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
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
                  </td>

                  {/* Location */}
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[160px] truncate">
                    {vendor.location || "—"}
                  </td>

                  {/* Contract End */}
                  <td className="px-4 py-4">
                    {vendor.contractEnd ? (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-foreground block font-mono">
                          {vendor.contractEnd}
                        </span>
                        {contractStatus.expired ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <AlertTriangle className="size-3" />
                            Expired
                          </span>
                        ) : contractStatus.expiring ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            <AlertTriangle className="size-3" />
                            {contractStatus.daysLeft}d left
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Action Link */}
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/vendors/${vendor.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-brand dark:text-brand-soft hover:bg-brand/10 dark:hover:bg-brand/20 transition-all min-h-[44px] active:scale-95"
                    >
                      <span>Manage</span>
                      <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {vendors.map((vendor) => {
          const contractStatus = isExpiringSoon(vendor.contractEnd);

          return (
            <Link
              key={vendor.id}
              href={`/admin/vendors/${vendor.id}`}
              className="block p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs active:scale-[0.99] transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {vendor.logoUrl ? (
                      <Image
                        src={vendor.logoUrl}
                        alt={vendor.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="font-heading text-lg font-bold text-brand dark:text-brand-soft">
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {vendor.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {CATEGORY_LABELS[vendor.category] || vendor.category}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0",
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

              {/* Extra Details Row (rendered only when metadata exists) */}
              {(vendor.location || vendor.contractEnd || contractStatus.expired || contractStatus.expiring) ? (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-slate-100 dark:border-zinc-800 gap-2">
                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                    {vendor.location ? (
                      <>
                        <MapPin className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{vendor.location}</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Partner</span>
                    )}
                  </div>

                  {contractStatus.expiring || contractStatus.expired ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-bold text-[11px] shrink-0",
                        contractStatus.expired ? "text-rose-600" : "text-amber-600"
                      )}
                    >
                      <AlertTriangle className="size-3" />
                      {contractStatus.expired ? "Expired" : `${contractStatus.daysLeft}d left`}
                    </span>
                  ) : vendor.contractEnd ? (
                    <span className="font-mono text-[11px] shrink-0">
                      Ends: {vendor.contractEnd}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
