"use client";

import React from "react";
import Image from "next/image";
import { Volume2, VolumeX, WifiOff, MapPin } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserNavDropdown, type UserNavUser, type UserNavArea } from "@/components/ui/user-nav-dropdown";
import { cn } from "cn";
import { isScannerMuted, setScannerMuted } from "@/lib/scanner/feedback";

export interface ScannerHeaderProps {
  user: UserNavUser;
  areas: UserNavArea[];
  vendorName: string;
  vendorLogoUrl: string | null;
  isOnline: boolean;
  branchName?: string | null;
  branch?: string | null;
  onMuteToggle?: (isMuted: boolean) => void;
}

function getVendorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "SU";
}

export function ScannerHeader({
  user,
  areas,
  vendorName,
  vendorLogoUrl,
  isOnline,
  branchName,
  branch,
  onMuteToggle,
}: ScannerHeaderProps) {
  const [muted, setMuted] = React.useState(() => isScannerMuted());

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setScannerMuted(next);
    onMuteToggle?.(next);
  };

  const branchText = (branchName ?? branch)?.trim();
  const showBranch = Boolean(
    branchText && branchText.length > 0 && branchText.toLowerCase() !== "x"
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 dark:bg-[#081424]/85 backdrop-blur-md backdrop-saturate-150 text-foreground border-b border-border/60 dark:border-white/10 shadow-xs dark:shadow-none pt-[env(safe-area-inset-top,0px)] transition-colors duration-200">
      <div className="flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left: Vendor Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="relative size-9 sm:size-10 rounded-xl bg-card border border-border/70 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs dark:bg-slate-900/60 dark:border-white/10">
            {vendorLogoUrl ? (
              <Image
                src={vendorLogoUrl}
                alt={vendorName}
                width={36}
                height={36}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#0F3056] to-[#0F548D] dark:from-[#0F548D]/40 dark:to-[#018BCE]/20 flex items-center justify-center text-white dark:text-sky-200">
                <span className="font-sans font-bold text-xs sm:text-sm tracking-wider">
                  {getVendorInitials(vendorName)}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <h1 className="font-sans font-semibold text-sm sm:text-base text-foreground tracking-tight truncate leading-tight">
              {vendorName}
            </h1>
            {showBranch && (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground truncate leading-none mt-0.5">
                <MapPin className="size-3 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                <span className="truncate">{branchText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sound Toggle + Status Pill + User Dropdown */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Status Pill */}
          {!isOnline ? (
            <span
              role="status"
              aria-label="Device is offline"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0"
            >
              <span
                className="size-1.5 rounded-full bg-rose-500 animate-pulse motion-reduce:animate-none shrink-0"
                aria-hidden="true"
              />
              <WifiOff className="size-3 shrink-0" aria-hidden="true" />
              <span>Offline</span>
            </span>
          ) : (
            <span
              role="status"
              aria-label="Scanner is online"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <span>Online</span>
            </span>
          )}

          {/* Theme toggle, styled to match the quiet sound button */}
          <ThemeToggle className="size-10 sm:size-11 min-h-0 min-w-0 rounded-xl border-0 bg-transparent dark:bg-transparent shadow-none hover:bg-muted/80" />

          {/* Sound Toggle Icon Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? "Unmute scanner sound" : "Mute scanner sound"}
            title={muted ? "Unmute scanner sound" : "Mute scanner sound"}
            aria-pressed={!muted}
            className="relative size-10 sm:size-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 transition-colors flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
          >
            <span className="relative size-4 sm:size-4.5 flex items-center justify-center pointer-events-none">
              <Volume2
                className={cn(
                  "size-4 sm:size-4.5 transition-all duration-200 ease-out motion-reduce:transition-none text-foreground",
                  muted
                    ? "opacity-0 scale-75 rotate-45 absolute"
                    : "opacity-100 scale-100 rotate-0"
                )}
                aria-hidden="true"
              />
              <VolumeX
                className={cn(
                  "size-4 sm:size-4.5 transition-all duration-200 ease-out motion-reduce:transition-none text-muted-foreground",
                  muted
                    ? "opacity-100 scale-100 rotate-0"
                    : "opacity-0 scale-75 -rotate-45 absolute"
                )}
                aria-hidden="true"
              />
            </span>
          </button>

          {/* User Account Menu */}
          <UserNavDropdown
            user={user}
            areas={areas}
            currentArea="scanner"
            className="shrink-0"
          />
        </div>
      </div>
    </header>
  );
}
