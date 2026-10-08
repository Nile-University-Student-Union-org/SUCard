import React from "react";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter max-w-4xl"
      role="status"
      aria-label="Loading system settings"
    >
      <SkeletonPageHeader />

      <div className="space-y-6">
        {[1, 2, 3].map((section) => (
          <div
            key={section}
            className="p-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4"
          >
            <div className="space-y-1">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-72 rounded" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2].map((field) => (
                <div key={field} className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-56 rounded" />
                  </div>
                  <Skeleton variant="button" className="w-12 h-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
