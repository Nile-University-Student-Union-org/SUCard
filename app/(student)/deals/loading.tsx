import React from "react";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function StudentDealsLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter max-w-5xl mx-auto"
      role="status"
      aria-label="Loading student deals"
    >
      <div className="space-y-1">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      {/* Search & Category Chips */}
      <div className="space-y-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Grid of Deal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
