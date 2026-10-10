"use client";

import React, { useEffect } from "react";
import {
  Flashlight,
  FlashlightOff,
  RotateCcw,
  ShieldAlert,
  Store,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/ui/status-state";
import { useQrCamera } from "@/hooks/use-qr-camera";
import { cn } from "cn";

interface ScannerViewfinderProps {
  vendorActive: boolean;
  vendorName: string;
  isOnline: boolean;
  onScan: (qr: string) => void;
  isProcessing: boolean;
  isValidating: boolean;
}

export function ScannerViewfinder({
  vendorActive,
  vendorName,
  isOnline,
  onScan,
  isProcessing,
  isValidating,
}: ScannerViewfinderProps) {
  const {
    videoRef,
    canvasRef,
    permissionError,
    torchAvailable,
    torchOn,
    isCameraReady,
    startCamera,
    stopCamera,
    toggleTorch,
  } = useQrCamera({
    onScan,
    enabled: vendorActive && isOnline && !isProcessing && !isValidating,
  });

  useEffect(() => {
    if (vendorActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [vendorActive, startCamera, stopCamera]);

  // 1. Inactive Vendor Blocking State
  if (!vendorActive) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-20 sm:pt-24 md:pt-28 bg-background text-foreground">
        <div className="max-w-md w-full">
          <StatusState
            icon={<Store className="size-6" />}
            variant="warning"
            title="Vendor Account Paused"
            description={`This vendor profile (${vendorName}) isn't active on SU Card right now. Scans cannot be processed until the account is reactivated by Nile University Student Union.`}
          />
        </div>
      </div>
    );
  }

  // 2. Camera Permission Denied / Unavailable State
  if (permissionError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-20 sm:pt-24 md:pt-28 bg-background text-foreground">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="size-16 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-sans font-semibold text-xl sm:text-2xl text-foreground">
              Camera access required
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium break-words [overflow-wrap:anywhere]">
              {permissionError}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-xs text-muted-foreground text-left space-y-1.5 shadow-xs">
            <p className="font-bold text-foreground">To fix this on Android / Chrome / iOS:</p>
            <ol className="list-decimal pl-4 space-y-1 opacity-90 leading-relaxed text-muted-foreground">
              <li>Tap the lock / tune icon in the address bar.</li>
              <li>Toggle Camera permission to <strong>Allow</strong>.</li>
              <li>Tap <strong>Try again</strong> below.</li>
            </ol>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={startCamera}
            className="w-full font-sans font-semibold text-base min-h-[48px] h-13 shadow-md"
          >
            <RotateCcw className="size-4 mr-2" />
            <span>Try again</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center min-h-[380px]">
      {/* Hidden Canvas for QR decoding fallback */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Live Camera Video Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />

      {/* Vignette Shadow Overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Viewfinder Aim Target Frame — responsive for 360px viewports */}
      <div className="relative size-56 xs:size-64 sm:size-72 max-w-[calc(100vw-3rem)] max-h-[calc(100vw-3rem)] rounded-3xl border-2 border-white/25 flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all">
        {/* 4 Brand Corner Brackets in Nile University Accent Sky Blue (#018BCE) */}
        <div className="absolute top-0 left-0 size-8 border-t-4 border-l-4 border-[#018BCE] rounded-tl-2xl -mt-1 -ml-1 shadow-[0_0_10px_#018BCE]" />
        <div className="absolute top-0 right-0 size-8 border-t-4 border-r-4 border-[#018BCE] rounded-tr-2xl -mt-1 -mr-1 shadow-[0_0_10px_#018BCE]" />
        <div className="absolute bottom-0 left-0 size-8 border-b-4 border-l-4 border-[#018BCE] rounded-bl-2xl -mb-1 -ml-1 shadow-[0_0_10px_#018BCE]" />
        <div className="absolute bottom-0 right-0 size-8 border-b-4 border-r-4 border-[#018BCE] rounded-br-2xl -mb-1 -mr-1 shadow-[0_0_10px_#018BCE]" />

        {/* Animated Laser Scanning Line (motion-safe) */}
        {isCameraReady && !isValidating && (
          <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#018BCE] to-transparent shadow-[0_0_14px_#018BCE] motion-safe:animate-pulse motion-reduce:opacity-80" />
        )}

        {/* Validating Spinner Inside Frame */}
        {isValidating && (
          <div className="p-4 rounded-2xl bg-black/85 backdrop-blur-md flex flex-col items-center gap-2 border border-white/20 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 duration-150">
            <div className="size-8 rounded-full border-3 border-sky-400 border-t-transparent motion-safe:animate-spin" />
            <span className="text-xs font-semibold text-white">
              Checking card…
            </span>
          </div>
        )}
      </div>

      {/* Top Floating Controls: Torch Toggle & Scanner Status */}
      <div className="absolute top-18 sm:top-20 md:top-22 inset-x-3 sm:inset-x-6 flex items-center justify-between z-20 pointer-events-auto pt-safe">
        {torchAvailable ? (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
            aria-pressed={torchOn}
            className={cn(
              "p-3 rounded-2xl backdrop-blur-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              torchOn
                ? "bg-amber-400 text-black border border-amber-300"
                : "bg-black/75 text-white border border-white/20 hover:bg-black/90"
            )}
          >
            {torchOn ? (
              <Flashlight className="size-5.5 fill-current" />
            ) : (
              <FlashlightOff className="size-5.5" />
            )}
          </button>
        ) : (
          <div />
        )}

        {/* Live Scan Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 text-xs font-bold text-white shadow-lg">
          <span className="size-2 rounded-full bg-emerald-400 motion-safe:animate-ping motion-reduce:hidden" />
          <span className="size-2 rounded-full bg-emerald-400 motion-safe:hidden motion-reduce:inline-block" />
          <span>Point at QR</span>
        </div>
      </div>

      {/* Bottom Floating Guidelines & Offline Banner */}
      <div className="absolute bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-4 z-20 text-center space-y-2 pointer-events-none pb-safe">
        {!isOnline && (
          <div
            role="status"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xl border border-rose-400 pointer-events-auto max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto break-words [overflow-wrap:anywhere]"
          >
            <WifiOff className="size-4 shrink-0" />
            <span>Device is offline — scans require internet connection</span>
          </div>
        )}

        {isOnline && (
          <div className="inline-block px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md text-xs sm:text-sm font-semibold text-white border border-white/20 shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto leading-snug break-words [overflow-wrap:anywhere]">
            Align student&apos;s physical card, Google Wallet, or web card QR
          </div>
        )}
      </div>
    </div>
  );
}
