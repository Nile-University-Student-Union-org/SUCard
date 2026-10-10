import type { CSSProperties } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check } from "lucide-react";
import { cn } from "cn";
import { GoogleWalletLogo } from "@/components/student/student-card-view";
import { CARD_ART } from "./card-art";
import s from "./how-it-works.module.css";

/** Window [start, start + dur] of overall scroll progress in which a layer plays its keyframes. */
export function win(start: number, dur: number) {
  return { "--s": start, "--d": dur } as CSSProperties;
}

const FRONT = CARD_ART.front ?? "/card/front.png";
const BACK = CARD_ART.back ?? "/card/back.png";

const NAME = "YARA A. HASSAN";
const STUDENT_ID = "231004587";

/** QR path for the demo payload, and a same-size field of noise it resolves out of. */
const QR = (() => {
  const qr = QRCode.create("NUSU1:DEMO0000000000000000", { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  let code = "";
  let noise = "";
  let seed = 7;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.modules.get(y, x)) code += `M${x} ${y}h1v1h-1z`;
      seed = (seed * 16807) % 2147483647;
      if (seed % 100 < 46) noise += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { n, code, noise };
})();

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

/** Characters printed left to right, each timed to when the print head passes over it. */
function Printed({ text, start, step }: { text: string; start: number; step: number }) {
  return [...text].map((ch, i) =>
    ch === " " ? (
      <span key={i}> </span>
    ) : (
      <span key={i} className={cn(s.scrub, s.ink, "inline-block")} style={win(start + i * step, 0.03)}>
        {ch}
      </span>
    ),
  );
}

const CORNER = "absolute size-[26%] border-[#5CC8FF] border-[max(1.5px,0.5cqw)]";

/**
 * The card's journey, purely decorative. Everything is positioned in container units of the
 * square stage, so it scales from a 300px phone stage to a 640px desktop one.
 * `still` freezes it at one progress value (reduced-motion layout).
 */
export function CardStage({ still, className }: { still?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(s.stage, "relative aspect-square w-full select-none", className)}
      style={still === undefined ? undefined : ({ "--p": still } as CSSProperties)}
    >
      {/* Ambient light */}
      <div className="absolute left-1/2 top-1/2 size-[96cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(1_139_206/0.16),rgb(15_84_141/0.06)_55%,transparent)] dark:bg-[radial-gradient(closest-side,rgb(1_139_206/0.22),rgb(15_84_141/0.1)_55%,transparent)]" />

      {/* Contact shadow */}
      <div className={cn(s.scrub, s.shadow, "absolute left-1/2 top-[76cqw] h-[8cqw] w-[64cqw]")} />

      {/* Moment 3 hardware: receipt printer (left) and cashier scanner (right) */}
      <div className={cn(s.scrub, s.drop, "absolute left-[5cqw] top-[5.4cqw] h-[3.8cqw] w-[44cqw] rounded-full bg-gradient-to-b from-[#1A2F4D] to-[#060E1A] shadow-[0_1.2cqw_2.4cqw_-1cqw_rgb(6_20_40/0.5)] ring-1 ring-white/10")} style={win(0.69, 0.06)}>
        <div className="absolute inset-x-[6%] top-1/2 h-[18%] -translate-y-1/2 rounded-full bg-black/70" />
      </div>
      <div className="absolute left-[7cqw] top-[7.4cqw] h-[66cqw] w-[40cqw] overflow-hidden">
        <div className={cn(s.scrub, s.feed, s.paper, "bg-[#FBFCFE] px-[3cqw] pb-[5cqw] pt-[3.4cqw] text-[#0F3056] shadow-[0_1cqw_3cqw_rgb(6_20_40/0.25)]")} style={win(0.835, 0.12)}>
          <p className="text-center font-heading text-[max(10px,3.6cqw)] uppercase leading-none tracking-wide">Campus Café</p>
          <p className="mt-[1cqw] text-center text-[max(7px,2.2cqw)] text-[#0F3056]/60">Nile University · Till 2</p>
          <div className="mt-[2.4cqw] space-y-[1.1cqw] border-t border-dashed border-[#0F3056]/25 pt-[2.2cqw] text-[max(8px,2.6cqw)] tabular-nums leading-tight">
            <p className="flex justify-between"><span>Flat white</span><span>85.00</span></p>
            <p className="flex justify-between"><span>Croissant</span><span>75.00</span></p>
            <p className="flex justify-between font-semibold text-[#0F548D]"><span>SU Card 15%</span><span>-24.00</span></p>
          </div>
          <p className="mt-[2.2cqw] flex justify-between border-t border-dashed border-[#0F3056]/25 pt-[2cqw] text-[max(8px,2.8cqw)] font-semibold tabular-nums">
            <span>Total</span>
            <span>136.00 EGP</span>
          </p>
          <div className="mt-[3.2cqw] flex justify-center">
            <div className={cn(s.scrub, s.stamp, "rounded-[1.6cqw] border-[max(1.5px,0.5cqw)] border-[#018BCE] px-[2.4cqw] py-[1.4cqw] text-center text-[#018BCE]")} style={win(0.955, 0.04)}>
              <p className="font-heading text-[max(13px,5.4cqw)] uppercase leading-none tracking-wide">15% off</p>
              <p className="mt-[0.6cqw] text-[max(8px,2.4cqw)] font-semibold leading-none">applied</p>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(s.scrub, s.drop, "absolute left-[70cqw] top-[22cqw] h-[8cqw] w-[26cqw] rounded-[2cqw] bg-gradient-to-b from-[#1A2F4D] to-[#060E1A] shadow-[0_1.6cqw_3cqw_-1cqw_rgb(6_20_40/0.55)] ring-1 ring-white/10")} style={win(0.7, 0.06)}>
        <div className="absolute inset-x-[16%] bottom-[14%] h-[16%] rounded-full bg-[#018BCE] shadow-[0_0_1.4cqw_#018BCE]" />
      </div>
      <div
        className={cn(s.scrub, s.cone, "absolute left-[75cqw] top-[30cqw] h-[20.5cqw] w-[16cqw] bg-gradient-to-b from-[#018BCE]/45 to-[#018BCE]/5 [clip-path:polygon(28%_0,72%_0,100%_100%,0_100%)]")}
        style={win(0.735, 0.21)}
      />

      {/* The card */}
      <div className={cn(s.scrub, s.pose, "absolute left-[15cqw] top-[24.5cqw] aspect-[707/516] w-[70cqw]")}>
        <div className={cn(s.scrub, s.flip, "relative size-full")}>
          {/* Front: printed with the student's name and ID */}
          <div className={cn(s.face, "absolute inset-0 overflow-hidden")}>
            <Image src={FRONT} alt="" fill sizes="(max-width: 768px) 70vw, 450px" className="object-cover" draggable={false} />
            {/* Unprinted name area, matched to the artwork's navy */}
            <div className="absolute left-[6.5%] top-[60%] h-[17%] w-[54.3%] bg-[#082441]" />
            <div className={cn(s.scrub, s.flash, "absolute left-[4%] top-[57%] h-[24%] w-[56%] bg-[radial-gradient(closest-side,rgb(92_200_255/0.55),transparent)]")} style={win(0.125, 0.05)} />
            <div className="absolute left-[8.06%] top-[61.4%] whitespace-pre text-[4.2cqw] font-semibold uppercase leading-none tracking-[0.04em] text-white/95">
              <Printed text={NAME} start={0.136} step={0.0088} />
            </div>
            <div className="absolute left-[8.06%] top-[70.6%] whitespace-pre text-[2.6cqw] font-medium tabular-nums leading-none tracking-[0.04em] text-white/85">
              Student ID{"  "}
              <Printed text={STUDENT_ID} start={0.2} step={0.007} />
            </div>
            <div className={cn(s.scrub, s.head, "absolute left-[6cqw] top-[58%] h-[22%] w-[0.8cqw] rounded-full bg-gradient-to-b from-transparent via-[#7FD4FF] to-transparent shadow-[0_0_2.4cqw_0.4cqw_rgb(1_139_206/0.75)]")} style={win(0.13, 0.155)} />
            <div className={cn(s.scrub, s.sheen, s.sheenFront, "absolute inset-y-0 -left-1/2 w-[200%]")} style={win(0, 1)} />
          </div>

          {/* Back: the QR that gets linked to the student */}
          <div className={cn(s.face, s.back, "absolute inset-0 overflow-hidden")}>
            <Image src={BACK} alt="" fill sizes="(max-width: 768px) 70vw, 450px" className="object-cover" draggable={false} />
            <div className="absolute left-[76.66%] top-[10.47%] aspect-square w-[15.7%]">
              <div className="absolute -inset-[7%] bg-[#0A2D4F]" />
              <div className="absolute inset-0 overflow-hidden">
                <svg viewBox={`0 0 ${QR.n} ${QR.n}`} className={cn(s.scrub, s.noise, "absolute inset-0 size-full")} style={win(0.515, 0.07)} shapeRendering="crispEdges">
                  <path d={QR.noise} fill="#FFFFFF" fillOpacity="0.55" />
                </svg>
                <svg viewBox={`0 0 ${QR.n} ${QR.n}`} className={cn(s.scrub, s.resolve, "absolute inset-0 size-full")} style={win(0.515, 0.08)} shapeRendering="crispEdges">
                  <path d={QR.code} fill="#FFFFFF" />
                </svg>
                <div className={cn(s.scrub, s.edge, "absolute inset-0")} style={win(0.515, 0.08)}>
                  <div className="h-[6%] bg-[#7FD4FF] shadow-[0_0_1cqw_#018BCE]" />
                </div>
                <div className={cn(s.scrub, s.beam, "absolute inset-0")} style={win(0.75, 0.1)}>
                  <div className="h-[8%] bg-[#BFE9FF] shadow-[0_0_1.6cqw_0.4cqw_#018BCE]" />
                </div>
                <div className={cn(s.scrub, s.pop, "absolute inset-0 bg-white")} style={win(0.845, 0.04)} />
              </div>
              <div className={cn(s.scrub, s.lock, "absolute -inset-[22%]")} style={win(0.48, 0.05)}>
                <span className={cn(CORNER, "left-0 top-0 rounded-tl-[30%] border-b-0 border-r-0")} />
                <span className={cn(CORNER, "right-0 top-0 rounded-tr-[30%] border-b-0 border-l-0")} />
                <span className={cn(CORNER, "bottom-0 left-0 rounded-bl-[30%] border-r-0 border-t-0")} />
                <span className={cn(CORNER, "bottom-0 right-0 rounded-br-[30%] border-l-0 border-t-0")} />
              </div>
            </div>
            <div className={cn(s.scrub, s.sheen, s.sheenBack, "absolute inset-y-0 -left-1/2 w-[200%]")} style={win(0, 1)} />
          </div>
        </div>
      </div>

      {/* Microsoft sign-in tile that docks into the card */}
      <div className={cn(s.scrub, s.tile, "absolute left-1/2 top-[6cqw]")} style={win(0.02, 0.12)}>
        <div className="relative flex items-center gap-[2.2cqw] whitespace-nowrap rounded-[2.6cqw] bg-white px-[4.4cqw] py-[3cqw] text-[max(11px,3.4cqw)] font-semibold leading-none text-[#1F1F1F] shadow-[0_0.4cqw_0.8cqw_rgb(6_20_40/0.12),0_2.4cqw_5cqw_-1.6cqw_rgb(6_20_40/0.35)] ring-1 ring-black/5">
          <MicrosoftLogo className="size-[max(13px,4cqw)] shrink-0" />
          Sign in with Microsoft
          <span className={cn(s.scrub, s.ring, "absolute -inset-[1.2cqw] rounded-[3.6cqw] border-2 border-[#018BCE]")} style={win(0.035, 0.05)} />
        </div>
      </div>

      {/* Moment 2 confirmations */}
      <div className={cn(s.scrub, s.leave, "absolute inset-x-0 top-[10cqw] flex justify-center")} style={win(0.665, 0.04)}>
        <div className={cn(s.scrub, s.rise, "flex items-center gap-[2cqw] whitespace-nowrap rounded-full bg-white py-[1.6cqw] pl-[1.6cqw] pr-[3.6cqw] text-[max(11px,3.1cqw)] font-medium leading-none text-[#0A1E38] shadow-[0_0.4cqw_0.8cqw_rgb(6_20_40/0.08),0_2cqw_4cqw_-1.6cqw_rgb(6_20_40/0.3)] ring-1 ring-[#0F3056]/10 dark:bg-zinc-800 dark:text-white dark:ring-white/10")} style={win(0.575, 0.06)}>
          <span className="grid size-[max(18px,5.4cqw)] place-items-center rounded-full bg-[#018BCE] text-white">
            <Check className="size-[62%]" strokeWidth={3} />
          </span>
          Linked to Yara A. Hassan
        </div>
      </div>
      <div className={cn(s.scrub, s.leave, "absolute inset-x-0 top-[81cqw] flex justify-center")} style={win(0.665, 0.04)}>
        <div className={cn(s.scrub, s.rise, "flex items-center gap-[2cqw] whitespace-nowrap rounded-full bg-[#1F1F1F] px-[4.4cqw] py-[2.6cqw] text-[max(11px,3.2cqw)] font-medium leading-none text-white shadow-[0_2cqw_4cqw_-1.6cqw_rgb(6_20_40/0.45)] ring-1 ring-white/10")} style={win(0.6, 0.06)}>
          <GoogleWalletLogo className="size-[max(16px,4.8cqw)] shrink-0" />
          Add to Google Wallet
        </div>
      </div>
    </div>
  );
}
