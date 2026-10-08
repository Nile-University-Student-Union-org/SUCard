import React from "react";
import { Skeleton, SkeletonPageHeader, SkeletonStatGrid, SkeletonTable } from "@/components/ui/skeleton";

export default function AdminRedemptionsLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading redemption logs"
    >
      <SkeletonPageHeader />
      <SkeletonStatGrid count={4} />

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-48 rounded-xl" />
        <Skeleton variant="button" className="w-28 h-11" />
      </div>

      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
