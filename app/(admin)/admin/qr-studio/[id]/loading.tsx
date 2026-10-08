import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminQrEditorLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading QR style editor"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Skeleton variant="button" className="size-9 rounded-lg" />
          <Skeleton className="h-7 w-48 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="button" className="w-24 h-9" />
          <Skeleton variant="button" className="w-28 h-9" />
        </div>
      </div>

      {/* Editor Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col items-center justify-center min-h-[420px] space-y-4">
          <Skeleton className="size-64 sm:size-72 rounded-2xl" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
        <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
