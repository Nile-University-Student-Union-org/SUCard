import React from "react";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AdminStudentsLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading students directory"
    >
      <SkeletonPageHeader />

      {/* Filter / Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton variant="button" className="w-28 h-11" />
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="size-10" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <Skeleton variant="button" className="w-20 h-9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
