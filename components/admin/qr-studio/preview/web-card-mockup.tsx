"use client";

import React from "react";
import Image from "next/image";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { QrSvgPreview } from "../qr-svg-preview";
import { ShieldCheck } from "lucide-react";
import { cn } from "cn";

export interface WebCardMockupProps {
  config: QrStyleConfig;
  payload?: string;
  className?: string;
}

export const WebCardMockup: React.FC<WebCardMockupProps> = ({
  config,
  payload,
  className,
}) => {
  return (
    <div
      className={cn(
        "w-full max-w-[340px] rounded-[24px] overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-foreground select-none",
        className
      )}
    >
      {/* Top Brand Banner */}
      <div className="bg-[#0F3056] p-4 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="relative z-10 flex items-center justify-between">
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="SU Logo"
            width={100}
            height={28}
            className="h-5 w-auto object-contain"
          />
          <span className="font-heading text-xs uppercase tracking-wider text-sky-200">
            DIGITAL PASS
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col items-center text-center space-y-4">
        {/* Student dummy name & ID */}
        <div className="space-y-0.5">
          <h4 className="font-heading text-xl uppercase tracking-wide text-foreground">
            AHMED EL-SAYED
          </h4>
          <p className="font-mono text-xs font-bold text-muted-foreground">
            ID: 20230001 &bull; School of ITCS
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border-2 border-slate-200 dark:border-zinc-700/80 shadow-inner">
          <div className="w-48 h-48 sm:w-52 sm:h-52">
            <QrSvgPreview
              config={config}
              payload={payload}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Active Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <ShieldCheck className="size-3.5" />
          <span>Active Membership &bull; NUSU Verified</span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Present this dynamic QR code at campus vendors to claim your student discount.
        </p>
      </div>
    </div>
  );
};
