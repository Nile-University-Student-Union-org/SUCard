"use client";

import React from "react";
import Image from "next/image";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { QrSvgPreview } from "../qr-svg-preview";
import { cn } from "cn";

export interface CardMockupProps {
  config: QrStyleConfig;
  payload?: string;
  className?: string;
}

/**
 * CR80 standard card mockup (85.6 mm x 54 mm, aspect ratio ~ 1.585).
 * Renders the QR code scaled proportionally to the card height (54 mm).
 */
export const CardMockup: React.FC<CardMockupProps> = ({
  config,
  payload,
  className,
}) => {
  // Proportional QR height relative to CR80 card height (54 mm)
  // printSizeMm 25mm on 54mm card -> 46.3% of card height
  const printSizeMm = config.output?.printSizeMm || 25;
  const qrPercentOfHeight = Math.min(85, Math.max(20, (printSizeMm / 54) * 100));

  return (
    <div
      className={cn(
        "relative w-full max-w-[480px] aspect-[85.6/54] rounded-[18px] sm:rounded-[22px] overflow-hidden shadow-2xl border-2 border-[#1B4B82]/50 text-white select-none flex flex-col justify-between p-4 sm:p-5",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, #0F3056 0%, #08213F 60%, #041427 100%)",
      }}
    >
      {/* Decorative Card Background Patterns */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#018BCE]/20 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-[#0F548D]/30 blur-2xl pointer-events-none" />

      {/* Card Header: Brand Logo + Card Type */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="SU Logo"
            width={120}
            height={32}
            className="h-6 sm:h-7 w-auto object-contain drop-shadow-sm"
          />
        </div>
        <div className="text-right">
          <span className="font-heading text-sm sm:text-base tracking-wider text-sky-200">
            SU CARD
          </span>
          <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/60 tracking-widest">
            2026/2027
          </p>
        </div>
      </div>

      {/* Card Body: QR code positioned in center right or center with size matching configured print ratio */}
      <div className="relative z-10 flex-1 flex items-center justify-between gap-4 my-2">
        {/* Left student dummy info */}
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
          <div>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
              Cardholder
            </p>
            <p className="font-heading text-base sm:text-lg tracking-wide uppercase text-white truncate">
              AHMED EL-SAYED
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
              Student ID
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-sky-200">
              20230001
            </p>
          </div>
          <div className="pt-1 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
              NUSU Verified
            </span>
          </div>
        </div>

        {/* Right QR container proportioned to CR80 height */}
        <div
          className="flex items-center justify-center shrink-0 bg-white p-2 rounded-xl shadow-lg border border-white/20"
          style={{
            height: `${qrPercentOfHeight}%`,
            aspectRatio: "1/1",
          }}
        >
          <QrSvgPreview
            config={config}
            payload={payload}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Card Footer: Magnetic strip/branding mark */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[8px] sm:text-[9px] font-mono text-white/40">
        <span>CR80 &bull; 85.6 &times; 54 MM</span>
        <span>PRINT SIZE: {printSizeMm} MM</span>
      </div>
    </div>
  );
};
