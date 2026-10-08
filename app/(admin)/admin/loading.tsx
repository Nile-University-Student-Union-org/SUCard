import React from "react";
import { Skeleton, SkeletonStatGrid } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading admin dashboard"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="button" className="w-36 h-11" />
          <Skeleton variant="button" className="w-36 h-11" />
        </div>
      </div>

      {/* Date Range & Category Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 max-w-sm">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-4 w-48 rounded hidden md:block" />
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* 4 KPI Hero Tiles */}
      <SkeletonStatGrid count={4} />

      {/* Chart Section */}
      <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>

      {/* Bottom Grid: Leaderboards / Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="size-8" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
