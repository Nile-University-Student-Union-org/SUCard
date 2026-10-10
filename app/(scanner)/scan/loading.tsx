import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScannerLoading() {
  return (
    <div
      className="min-h-dvh flex flex-col justify-between bg-background text-foreground p-4"
      role="status"
      aria-label="Initializing camera and scanner"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Center Viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-8">
        <div className="size-60 xs:size-64 sm:size-72 rounded-3xl border-2 border-border bg-card/60 flex items-center justify-center shadow-xs">
          <Skeleton className="size-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-44 rounded-full mt-4" />
      </div>

      {/* Bottom Bar */}
      <div className="pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
