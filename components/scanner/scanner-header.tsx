"use client";

import React, { useState } from "react";
import Image from "next/image";
import { QrCode, Receipt, Volume2, VolumeX, WifiOff, MapPin } from "lucide-react";
import { AppNav, type AppNavItem } from "@/components/ui/app-nav";
import type { UserNavUser, UserNavArea } from "@/components/ui/user-nav-dropdown";
import { isScannerMuted, setScannerMuted } from "@/lib/scanner/feedback";
import { cn } from "cn";

export interface ScannerHeaderProps {
  user: UserNavUser;
  areas: UserNavArea[];
  vendorName: string;
  vendorLogoUrl: string | null;
  isOnline: boolean;
  branchName?: string | null;
  branch?: string | null;
  onMuteToggle?: (isMuted: boolean) => void;
  activeTab?: "scan" | "today";
  onTabChange?: (tab: "scan" | "today") => void;
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
  activeTab = "scan",
  onTabChange,
}: ScannerHeaderProps) {
  const [muted, setMuted] = useState(() => isScannerMuted());

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

  const navItems: AppNavItem[] = [
    {
      label: "Scan card",
      icon: QrCode,
      active: activeTab === "scan",
      onClick: () => onTabChange?.("scan"),
    },
    {
      label: "Today's scans",
      icon: Receipt,
      active: activeTab === "today",
      onClick: () => onTabChange?.("today"),
    },
  ];

  // Mobile Vendor Context card shown in the expanded drawer
  const mobileBrandContext = (
    <div className="p-2.5 rounded-xl flex items-center justify-between gap-2.5 bg-muted/60 border border-border">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {vendorLogoUrl ? (
          <Image
            src={vendorLogoUrl}
            alt={vendorName}
            width={32}
            height={32}
            className="size-8 rounded-lg object-contain shrink-0 bg-card p-1 border border-border"
            unoptimized
          />
        ) : (
          <div className="size-8 rounded-lg bg-gradient-to-br from-[#0F3056] to-[#0F548D] dark:from-[#0F548D]/40 dark:to-[#018BCE]/20 flex items-center justify-center text-white dark:text-sky-200 font-bold text-xs shrink-0">
            {getVendorInitials(vendorName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate leading-tight">
            {vendorName}
          </p>
          {showBranch ? (
            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <MapPin className="size-2.5 shrink-0" />
              <span className="truncate">{branchText}</span>
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground truncate">
              Partner Vendor
            </p>
          )}
        </div>
      </div>

      {!isOnline && (
        <span
          role="status"
          aria-label="Device is offline"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shrink-0"
        >
          <WifiOff className="size-3" />
          <span>Offline</span>
        </span>
      )}
    </div>
  );

  // Right actions slot: Sound toggle + Offline/Online status
  const rightSlot = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Offline Status Pill */}
      {!isOnline ? (
        <span
          role="status"
          aria-label="Device is offline"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shrink-0"
        >
          <span
            className="size-1.5 rounded-full bg-rose-500 animate-pulse motion-reduce:animate-none shrink-0"
            aria-hidden="true"
          />
          <WifiOff className="size-3 shrink-0" aria-hidden="true" />
          <span>Offline</span>
        </span>
      ) : null}

      {/* Sound Toggle Icon Button */}
      <button
        type="button"
        onClick={handleToggleMute}
        aria-label={muted ? "Unmute scanner sound" : "Mute scanner sound"}
        title={muted ? "Unmute scanner sound" : "Mute scanner sound"}
        aria-pressed={!muted}
        className={cn(
          "group/sound relative size-10 rounded-full flex items-center justify-center transition-[transform,background-color,color] duration-200 ease-out cursor-pointer active:scale-90 motion-reduce:transition-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "hover:bg-muted/80 dark:hover:bg-white/10"
        )}
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
    </div>
  );

  return (
    <AppNav
      items={navItems}
      homeHref="/scan"
      brandSubtitle="Student Union"
      mobileBrandContext={mobileBrandContext}
      user={user}
      areas={areas}
      currentArea="scanner"
      rightSlot={rightSlot}
      ariaLabel="Cashier Scanner Navigation"
    />
  );
}
