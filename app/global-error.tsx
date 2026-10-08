"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col items-center justify-center bg-[#081424] text-white p-6 font-sans antialiased text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="flex justify-center">
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="NUSU"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">
              SYSTEM ERROR
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              A critical error occurred while rendering the application shell.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-slate-400 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => reset()}
              className="min-h-[44px] px-6 text-sm font-bold normal-case"
            >
              <RotateCcw className="size-4 mr-2" />
              <span>Try again</span>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
