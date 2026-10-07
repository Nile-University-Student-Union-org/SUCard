"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, QrCode } from "lucide-react";

export function StaticCard() {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none pointer-events-none"
      aria-label="Nile University Student Union Card Mockup"
    >
      {/* Static Lanyard Strap hanging from top */}
      <div className="relative flex flex-col items-center -mt-6 sm:-mt-8 mb-2 z-0">
        <div className="w-8 sm:w-10 h-28 sm:h-36 bg-gradient-to-b from-[#0B213D] via-[#0F3056] to-[#0B213D] rounded-t-sm shadow-md flex items-center justify-center overflow-hidden border-x border-sky-400/30">
          <div className="w-full text-center text-[8px] font-heading text-sky-300/80 tracking-widest rotate-90 whitespace-nowrap">
            ★ NUSU ★ NILE UNIVERSITY ★
          </div>
        </div>
        {/* Metal clasp */}
        <div className="w-10 sm:w-12 h-5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-sm shadow-md border border-slate-300 flex items-center justify-center">
          <div className="w-3 h-1.5 bg-slate-600 rounded-full" />
        </div>
        {/* Metal ring */}
        <div className="size-5 sm:size-6 -mt-1 rounded-full border-[3px] border-slate-300 shadow-inner" />
      </div>

      {/* 3D Tilted Card Preview */}
      <div
        className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] aspect-[1.585/1] rounded-[18px] sm:rounded-[22px] p-4 sm:p-6 shadow-2xl border-2 border-white/20 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #07172F 0%, #0F3056 45%, #0F548D 100%)",
          transform: "perspective(1200px) rotateY(-8deg) rotateX(6deg)",
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
          className="absolute top-0 bottom-0 left-6 sm:left-8 w-4 sm:w-5 opacity-40 bg-gradient-to-b from-sky-400 via-emerald-300 via-amber-300 via-pink-400 to-indigo-400"
          aria-hidden="true"
        />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="Nile University Student Union"
              width={140}
              height={40}
              className="h-6 sm:h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] sm:text-xs font-bold text-sky-200">
            <Sparkles className="size-3 text-sky-300" />
            <span>STUDENT</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 mt-3 sm:mt-5 flex items-end justify-between">
          <div>
            {/* Smart Chip preview */}
            <div className="w-9 sm:w-11 h-7 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 shadow-xs mb-3 flex items-center justify-center">
              <div className="w-5 h-3 border border-amber-800/40 rounded-xs" />
            </div>

            <h2 className="font-heading text-2xl sm:text-4xl text-white tracking-wider leading-none mb-1 font-normal drop-shadow-sm">
              SU CARD
            </h2>
            <p className="text-[10px] sm:text-xs font-semibold text-sky-200/90 tracking-widest uppercase">
              Nile University Student Union
            </p>
          </div>

          {/* Decorative QR Container */}
          <div className="size-16 sm:size-20 rounded-xl bg-white p-1.5 sm:p-2 shadow-lg flex flex-col items-center justify-center">
            <QrCode className="size-full text-brand" />
          </div>
        </div>

        {/* Card Footer Strip */}
        <div className="relative z-10 mt-3 sm:mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] text-sky-200/70">
          <span>VALID NUSU PASS</span>
          <span className="font-mono">ID: NUSU-OFFICIAL</span>
        </div>
      </div>
    </div>
  );
}
