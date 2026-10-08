import React from "react";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AdminVendorsLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading partner vendors"
    >
      <SkeletonPageHeader />

      {/* Filter / Category Bar */}
      <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-12 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <Skeleton variant="button" className="w-20 h-9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
