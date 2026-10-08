import React from "react";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AdminAuditLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading audit logs"
    >
      <SkeletonPageHeader />

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      {/* Timeline items */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-zinc-800/80">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="size-8" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-3 w-64 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
