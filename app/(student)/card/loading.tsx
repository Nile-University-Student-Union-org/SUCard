import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentCardLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter max-w-sm sm:max-w-md mx-auto"
      role="status"
      aria-label="Loading student card"
    >
      {/* Physical Digital Card Skeleton */}
      <div className="relative w-full rounded-[28px] p-5 sm:p-6 bg-[#0F3056]/80 text-white shadow-2xl border-2 border-[#0F548D]/60 overflow-hidden flex flex-col justify-between min-h-[460px]">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-28 rounded-md bg-white/20" />
          <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
        </div>

        {/* Center QR Box */}
        <div className="flex flex-col items-center justify-center my-auto py-2">
          <div className="w-full max-w-[250px] aspect-square bg-white/90 rounded-2xl p-4 shadow-xl flex items-center justify-center">
            <Skeleton className="size-48 rounded-xl bg-slate-300" />
          </div>
          <Skeleton className="h-3.5 w-40 rounded-full mt-3 bg-white/20" />
        </div>

        {/* Bottom Student Info */}
        <div className="pt-4 mt-3 border-t border-white/15 space-y-1.5">
          <Skeleton className="h-6 w-44 rounded bg-white/20" />
          <Skeleton className="h-4 w-28 rounded bg-white/20" />
        </div>
      </div>

      {/* Wallet Action Button Skeleton */}
      <Skeleton variant="button" className="w-full h-12 rounded-full" />

      {/* Info Card Skeleton */}
      <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}
