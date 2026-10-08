import React from "react";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AdminAccountLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter max-w-3xl"
      role="status"
      aria-label="Loading account settings"
    >
      <SkeletonPageHeader hasActions={false} />

      <div className="space-y-6">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="p-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4"
          >
            <Skeleton className="h-5 w-40 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton variant="button" className="w-28 h-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
