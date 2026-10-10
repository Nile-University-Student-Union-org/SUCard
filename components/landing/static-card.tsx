"use client";

import React, { type CSSProperties } from "react";
import Image from "next/image";
import { CARD_ART } from "./card-art";

/** Navy woven strap, matching the real lanyard's colours. */
const STRAP_STYLE: CSSProperties = {
  backgroundImage: [
    "linear-gradient(to right, transparent 46%, rgb(1 139 206 / 0.55) 46%, rgb(1 139 206 / 0.55) 54%, transparent 54%)",
    "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.05) 0 2px, transparent 2px 5px)",
    "linear-gradient(to right, #0A2340, #154778 30%, #18508A 50%, #154778 70%, #0A2340)",
  ].join(", "),
};

/** Brushed-metal look for the crimp and split ring. */
const METAL = "linear-gradient(to bottom, #F1F5F9, #94A3B8 45%, #E2E8F0 60%, #64748B)";

export function StaticCard() {
  const frontArt = CARD_ART.front ?? "/card/front.png";

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 select-none pointer-events-none"
      role="img"
      aria-label="Nile University Student Union Membership Card"
    >
      {/* Ambient soft glow behind card */}
      <div
        className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[min(70%,420px)] aspect-square rounded-full bg-[radial-gradient(ellipse_at_center,rgb(1_139_206/0.18)_0%,rgb(1_139_206/0.06)_50%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgb(1_139_206/0.24)_0%,rgb(1_139_206/0.09)_50%,transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Hanging lanyard assembly */}
      <div className="relative w-full h-full flex flex-col items-center origin-top will-change-transform motion-safe:animate-[lanyard-sway_5s_ease-in-out_infinite] motion-reduce:animate-none">
        {/* Strap, fading in from the top */}
        <div
          className="w-[11%] max-w-14 min-w-9 flex-1 max-h-[36%] shadow-[inset_0_-6px_8px_-6px_rgb(0_0_0/0.5)] [mask-image:linear-gradient(to_bottom,transparent,#000_72px)]"
          style={STRAP_STYLE}
        />
        {/* Metal Crimp */}
        <div
          className="relative z-10 w-[12.5%] max-w-16 min-w-10 h-3.5 rounded-[5px] shadow-[0_2px_4px_rgb(0_0_0/0.25)]"
          style={{ backgroundImage: METAL }}
        />
        {/* Split ring */}
        <div
          className="relative z-10 size-7 -mt-1 rounded-full p-[3px] shadow-[0_2px_3px_rgb(0_0_0/0.2)]"
          style={{ backgroundImage: METAL }}
        >
          <div className="size-full rounded-full bg-background" />
        </div>

        {/* Real SU Card Artwork Container */}
        <div className="relative -mt-[22px] w-[min(78%,440px)] aspect-[1.37/1] drop-shadow-[0_25px_50px_rgba(15,48,86,0.55)] drop-shadow-[0_0_30px_rgba(1,139,206,0.25)]">
          <Image
            src={frontArt}
            alt="Nile University Student Union Card"
            fill
            sizes="(max-width: 640px) 78vw, 440px"
            className="object-contain select-none pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Contact shadow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 bottom-[7%] -ml-[min(30%,170px)] w-[min(60%,340px)] h-5 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.25)_0%,rgb(0_0_0/0.10)_45%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.50)_0%,rgb(0_0_0/0.20)_45%,transparent_70%)] will-change-transform motion-safe:animate-[lanyard-shadow_5s_ease-in-out_infinite] motion-reduce:animate-none pointer-events-none"
      />
    </div>
  );
}
