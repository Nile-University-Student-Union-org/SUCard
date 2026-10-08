import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScannerLoading() {
  return (
    <div
      className="min-h-dvh flex flex-col justify-between bg-black text-white p-4"
      role="status"
      aria-label="Initializing camera and scanner"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3">
        <Skeleton className="h-8 w-32 rounded-lg bg-zinc-800" />
        <Skeleton className="h-8 w-24 rounded-lg bg-zinc-800" />
      </div>

      {/* Center Viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto">
        <div className="size-64 sm:size-72 rounded-3xl border-2 border-zinc-700 bg-zinc-900/60 flex items-center justify-center">
          <Skeleton className="size-20 rounded-full bg-zinc-800" />
        </div>
        <Skeleton className="h-4 w-44 rounded-full mt-4 bg-zinc-800" />
      </div>

      {/* Bottom Bar */}
      <div className="pt-3">
        <Skeleton className="h-12 w-full rounded-2xl bg-zinc-800" />
      </div>
    </div>
  );
}
