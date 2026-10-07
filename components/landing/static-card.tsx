"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, QrCode } from "lucide-react";

export function StaticCard() {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none pointer-events-none"
      aria-label="NUSU Membership Card"
    >
      {/* Static Lanyard Strap coming down from top */}
      <div className="relative flex flex-col items-center -mt-8 sm:-mt-10 mb-2 z-0">
        <div className="w-10 sm:w-12 h-32 sm:h-40 bg-gradient-to-b from-[#0B213D] via-[#0F3056] to-[#0B213D] shadow-md flex items-center justify-center overflow-hidden border-x-2 border-sky-400/40">
          <div className="w-full text-center text-[9px] font-heading text-sky-200 tracking-widest rotate-90 whitespace-nowrap">
            ★ NUSU ★ NILE UNIVERSITY ★
          </div>
        </div>
        {/* Metal clasp */}
        <div className="w-12 sm:w-14 h-5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-sm shadow-md border border-slate-300 flex items-center justify-center">
          <div className="w-4 h-1.5 bg-slate-600 rounded-full" />
        </div>
        {/* Metal ring */}
        <div className="size-6 sm:size-7 -mt-1 rounded-full border-[3.5px] border-slate-300 shadow-inner" />
      </div>

      {/* 3D Tilted Card Preview */}
      <div
        className="relative z-10 w-full max-w-[360px] sm:max-w-[440px] aspect-[1.585/1] rounded-[20px] sm:rounded-[24px] p-5 sm:p-7 shadow-2xl border-2 border-white/20 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #081E38 0%, #0F3056 45%, #0F548D 100%)",
          transform: "perspective(1200px) rotateY(-6deg) rotateX(4deg)",
          transformStyle: "preserve-3d",
          boxShadow:
            "0 25px 50px -12px rgba(15, 48, 86, 0.45), 0 0 40px rgba(1, 139, 206, 0.2)",
        }}
      >
        {/* Ambient Sky Glow */}
        <div
          className="absolute -top-12 -right-12 size-48 rounded-full bg-sky-400/25 blur-2xl"
          aria-hidden="true"
        />

        {/* Holographic vertical strip */}
        <div
          className="absolute top-0 bottom-0 left-6 sm:left-8 w-5 sm:w-6 opacity-45 bg-gradient-to-b from-sky-400 via-emerald-300 via-amber-300 via-pink-400 to-indigo-400"
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
              className="h-7 sm:h-9 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/25 border border-sky-400/50 text-[11px] sm:text-xs font-bold text-sky-100">
            <Sparkles className="size-3.5 text-sky-300" />
            <span>STUDENT</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 mt-6 sm:mt-8 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-4xl sm:text-5xl text-white tracking-wider leading-none mb-2 font-normal drop-shadow-sm">
              SU CARD
            </h2>
            <p className="text-[11px] sm:text-xs font-bold text-sky-200/90 tracking-wider uppercase">
              Nile University Student Union
            </p>
          </div>

          {/* Decorative QR Container */}
          <div className="size-18 sm:size-22 rounded-2xl bg-white p-2 sm:p-2.5 shadow-xl flex flex-col items-center justify-center">
            <QrCode className="size-full text-brand" />
          </div>
        </div>

        {/* Card Footer Strip */}
        <div className="relative z-10 mt-4 sm:mt-5 pt-2.5 border-t border-white/15 flex items-center justify-between text-[10px] sm:text-[11px] text-sky-200/80 font-medium">
          <span>DIGITAL VERIFICATION & PARTNER SAVINGS</span>
          <span className="font-mono">SCAN TO VERIFY</span>
        </div>
      </div>
    </div>
  );
}
