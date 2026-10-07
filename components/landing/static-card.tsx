"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, QrCode } from "lucide-react";

export function StaticCard() {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 select-none pointer-events-none"
      aria-label="NUSU Membership Card"
    >
      {/* Static Lanyard Strap coming down from top */}
      <div className="relative flex flex-col items-center -mt-6 sm:-mt-10 mb-2 z-0">
        <div className="w-9 sm:w-12 h-24 sm:h-36 bg-gradient-to-b from-[#0B213D] via-[#0F3056] to-[#0B213D] shadow-md flex items-center justify-center overflow-hidden border-x-2 border-sky-400/40">
          <div className="w-full text-center text-[8px] sm:text-[9px] font-heading text-sky-200 tracking-widest rotate-90 whitespace-nowrap">
            ★ NUSU ★ NILE UNIVERSITY ★
          </div>
        </div>
        {/* Metal clasp */}
        <div className="w-11 sm:w-14 h-4 sm:h-5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-xs shadow-md border border-slate-300 flex items-center justify-center">
          <div className="w-3.5 sm:w-4 h-1 sm:h-1.5 bg-slate-600 rounded-full" />
        </div>
        {/* Metal ring */}
        <div className="size-5 sm:size-7 -mt-1 rounded-full border-[3px] sm:border-[3.5px] border-slate-300 shadow-inner" />
      </div>

      {/* 3D Tilted Card Preview */}
      <div
        className="relative z-10 w-full max-w-[320px] sm:max-w-[400px] md:max-w-[440px] aspect-[1.585/1] rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 shadow-2xl border-2 border-white/20 overflow-hidden text-white transition-transform duration-500 ease-out"
        style={{
          background:
            "linear-gradient(135deg, #081E38 0%, #0F3056 45%, #0F548D 100%)",
          transform: "perspective(1200px) rotateY(-5deg) rotateX(3deg)",
          transformStyle: "preserve-3d",
          boxShadow:
            "0 25px 50px -12px rgba(15, 48, 86, 0.45), 0 0 40px rgba(1, 139, 206, 0.2)",
        }}
      >
        {/* Ambient Sky Glow */}
        <div
          className="absolute -top-12 -right-12 size-48 rounded-full bg-sky-400/25 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Holographic vertical strip */}
        <div
          className="absolute top-0 bottom-0 left-5 sm:left-8 w-4 sm:w-6 opacity-45 bg-gradient-to-b from-sky-400 via-emerald-300 via-amber-300 via-pink-400 to-indigo-400 pointer-events-none"
          aria-hidden="true"
        />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="Nile University Student Union"
              width={160}
              height={48}
              className="h-6 sm:h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-sky-500/25 border border-sky-400/50 text-[10px] sm:text-xs font-bold text-sky-100">
            <Sparkles className="size-3 sm:size-3.5 text-sky-300" />
            <span>STUDENT</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 mt-4 sm:mt-7 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white tracking-wider leading-none mb-1 sm:mb-2 font-normal drop-shadow-sm">
              SU CARD
            </h2>
            <p className="text-[10px] sm:text-xs font-bold text-sky-200/90 tracking-wider uppercase truncate">
              Nile University Student Union
            </p>
          </div>

          {/* Decorative QR Container */}
          <div className="size-14 sm:size-20 rounded-xl sm:rounded-2xl bg-white p-1.5 sm:p-2.5 shadow-xl flex flex-col items-center justify-center shrink-0">
            <QrCode className="size-full text-brand" />
          </div>
        </div>

        {/* Card Footer Strip */}
        <div className="relative z-10 mt-3 sm:mt-5 pt-2 border-t border-white/15 flex items-center justify-between gap-2 text-[9px] sm:text-[11px] text-sky-200/80 font-medium">
          <span className="truncate">DIGITAL PASS & PARTNER SAVINGS</span>
          <span className="shrink-0 font-mono tracking-wider">VERIFIED</span>
        </div>
      </div>
    </div>
  );
}
