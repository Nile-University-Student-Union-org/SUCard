import React from "react";
import { Skeleton, SkeletonPageHeader, SkeletonStatGrid } from "@/components/ui/skeleton";

export default function VendorPortalLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter max-w-6xl mx-auto px-4 sm:px-6 py-6"
      role="status"
      aria-label="Loading vendor portal"
    >
      <SkeletonPageHeader />
      <SkeletonStatGrid count={4} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <Skeleton variant="button" className="w-28 h-10" />
        <Skeleton variant="button" className="w-28 h-10" />
        <Skeleton variant="button" className="w-28 h-10" />
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-44 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 rounded" />
            </div>
            <Skeleton variant="button" className="w-20 h-9" />
          </div>
        ))}
      </div>
    </div>
  );
}
