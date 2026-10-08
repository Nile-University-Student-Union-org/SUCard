import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVendorDetailLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading vendor details"
    >
      {/* Header with back navigation */}
      <div className="space-y-2 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
          <Skeleton variant="button" className="w-28 h-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <Skeleton variant="button" className="w-24 h-10" />
        <Skeleton variant="button" className="w-24 h-10" />
        <Skeleton variant="button" className="w-24 h-10" />
        <Skeleton variant="button" className="w-24 h-10" />
      </div>

      {/* Overview Form / Panel */}
      <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
