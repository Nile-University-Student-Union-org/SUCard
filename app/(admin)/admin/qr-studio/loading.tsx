import React from "react";
import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function AdminQrStudioLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading QR studio"
    >
      <SkeletonPageHeader />

      {/* Grid of style cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="w-full aspect-square rounded-xl" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton variant="button" className="w-20 h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
