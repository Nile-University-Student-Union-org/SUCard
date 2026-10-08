import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminStudentDetailLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading student details"
    >
      {/* Header with back navigation */}
      <div className="space-y-2 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-56 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton variant="button" className="w-28 h-10" />
        </div>
      </div>

      {/* Student Profile Summary Card */}
      <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Skeleton variant="circular" className="size-16" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48 rounded" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Info & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
