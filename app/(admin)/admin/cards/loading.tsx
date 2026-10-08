import React from "react";
import { Skeleton, SkeletonPageHeader, SkeletonStatGrid, SkeletonTable } from "@/components/ui/skeleton";

export default function AdminCardsLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading card management"
    >
      <SkeletonPageHeader />

      {/* KPI Stats */}
      <SkeletonStatGrid count={4} />

      {/* Action / Mode Tabs */}
      <div className="flex gap-2">
        <Skeleton variant="button" className="w-32 h-11" />
        <Skeleton variant="button" className="w-36 h-11" />
        <Skeleton variant="button" className="w-32 h-11" />
      </div>

      {/* Batches Table */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
}
