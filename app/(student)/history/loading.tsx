import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentHistoryLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter max-w-2xl mx-auto"
      role="status"
      aria-label="Loading redemption history"
    >
      <div className="space-y-1">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Quick Stats Summary */}
      <div className="flex gap-3">
        <Skeleton className="h-14 flex-1 rounded-2xl" />
        <Skeleton className="h-14 flex-1 rounded-2xl" />
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-16 rounded ml-auto" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
