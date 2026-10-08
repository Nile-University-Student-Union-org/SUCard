import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";

export default function ChooseLoading() {
  return (
    <div
      className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between relative isolate overflow-hidden"
      role="status"
      aria-label="Loading available portals"
    >
      <AmbientBackdrop />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton variant="circular" className="size-10" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-8 animate-page-enter">
        <div className="text-center space-y-2">
          <Skeleton className="h-10 sm:h-12 w-64 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-48 mx-auto rounded-md" />
        </div>

        {/* Tappable Area Cards */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full p-5 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md flex items-center justify-between min-h-[96px]"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-3.5 w-60 rounded-md" />
                </div>
              </div>
              <Skeleton className="size-5 rounded-full" />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center relative z-10">
        <Skeleton className="h-3 w-56 mx-auto rounded" />
      </footer>
    </div>
  );
}
