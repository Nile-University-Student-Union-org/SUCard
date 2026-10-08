"use client";

import React from "react";
import Image from "next/image";
import { Volume2, VolumeX, WifiOff } from "lucide-react";
import { UserNavDropdown, type UserNavUser, type UserNavArea } from "@/components/ui/user-nav-dropdown";
import { cn } from "cn";
import { isScannerMuted, setScannerMuted } from "@/lib/scanner/feedback";

interface ScannerHeaderProps {
  user: UserNavUser;
  areas: UserNavArea[];
  vendorName: string;
  vendorLogoUrl: string | null;
  isOnline: boolean;
  onMuteToggle?: (isMuted: boolean) => void;
}

export function ScannerHeader({
  user,
  areas,
  vendorName,
  vendorLogoUrl,
  isOnline,
  onMuteToggle,
}: ScannerHeaderProps) {
  const [muted, setMuted] = React.useState(() => isScannerMuted());

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setScannerMuted(next);
    onMuteToggle?.(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F3056] text-white border-b border-[#0A2240] shadow-md">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 min-h-[58px] gap-2">
        {/* Left: Vendor Logo + Names */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="relative size-10 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
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
              <span className="font-heading text-lg font-bold text-sky-300">
                {vendorName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-heading text-base sm:text-lg font-normal tracking-wide text-white uppercase truncate">
                {vendorName}
              </h1>
              {!isOnline && (
                <span
                  role="status"
                  aria-label="Device is offline"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/25 text-rose-200 border border-rose-400/40 shrink-0"
                >
                  <WifiOff className="size-3 shrink-0" />
                  <span>Offline</span>
                </span>
              )}
            </div>
            <p className="text-xs text-sky-200/80 font-medium truncate">
              {user.name}
            </p>
          </div>
        </div>

        {/* Right: Sound Toggle + Online Indicator + User Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Mute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? "Unmute scanner sound" : "Mute scanner sound"}
            aria-pressed={muted}
            className={cn(
              "p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-none",
              muted
                ? "bg-white/10 text-white/70 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
                : "bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 focus-visible:ring-2 focus-visible:ring-sky-400"
            )}
          >
            {muted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
          </button>

          {/* User Account Menu */}
          <UserNavDropdown
            user={user}
            areas={areas}
            currentArea="scanner"
            className="text-foreground"
          />
        </div>
      </div>
    </header>
  );
}
