import type { CSSProperties } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check } from "lucide-react";
import { cn } from "cn";
import { GoogleWalletLogo } from "@/components/student/student-card-view";
import { CARD_ART, SAMPLE_PATCH_STYLE } from "./card-art";
import s from "./how-it-works.module.css";

/** Window [start, start + dur] of overall scroll progress in which a layer plays its keyframes. */
export function win(start: number, dur: number) {
  return { "--s": start, "--d": dur } as CSSProperties;
}

export const FRONT = CARD_ART.front ?? "/card/front.png";
export const BACK = CARD_ART.back ?? "/card/back.png";

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

/** The generic card front: the artwork with the sample name/ID area covered. */
export function CardFront({ sizes, eager }: { sizes: string; eager?: boolean }) {
  return (
    <>
      <Image src={FRONT} alt="" fill sizes={sizes} loading={eager ? "eager" : undefined} className="object-cover" draggable={false} />
      <div className="absolute" style={SAMPLE_PATCH_STYLE} />
    </>
  );
}

/** Unissued look of the front before sign-in; the handoff card fades the same veil in. */
export const VEIL = "bg-[#06142A]/65";

const CORNER = "absolute size-[26%] border-[#5CC8FF] border-[max(1.5px,0.5cqw)]";
const CHIP =
  "flex items-center gap-[2cqw] whitespace-nowrap rounded-full bg-white py-[1.6cqw] pl-[1.6cqw] pr-[3.6cqw] text-[max(11px,3.1cqw)] font-medium leading-none text-[#0A1E38] shadow-[0_0.4cqw_0.8cqw_rgb(6_20_40/0.08),0_2cqw_4cqw_-1.6cqw_rgb(6_20_40/0.3)] ring-1 ring-[#0F3056]/10 dark:bg-zinc-800 dark:text-white dark:ring-white/10";
const DEVICE =
  "bg-gradient-to-b from-[#1A2F4D] to-[#060E1A] ring-1 ring-white/10";

function QrCode({ className, fill, style }: { className?: string; fill: string; style?: CSSProperties }) {
  return (
    <svg viewBox={`0 0 ${QR.n} ${QR.n}`} className={className} style={style} shapeRendering="crispEdges">
      <path d={QR.code} fill={fill} />
    </svg>
  );
}

/**
 * The card's journey, purely decorative. Everything is positioned in container units of the square
 * stage, so it scales from a 300px phone stage to a 640px desktop one.
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

      {/* Contact shadow under the card */}
      <div className={cn(s.scrub, s.shadow, "absolute left-1/2 top-[76cqw] h-[8cqw] w-[64cqw]")} />

      {/* Moment 3 hardware: receipt printer (left) and cashier scanner (right) */}
      <div className={cn(s.scrub, s.drop, DEVICE, "absolute left-[5cqw] top-[5.4cqw] h-[3.8cqw] w-[44cqw] rounded-full shadow-[0_1.2cqw_2.4cqw_-1cqw_rgb(6_20_40/0.5)]")} style={win(0.69, 0.06)}>
        <div className="absolute inset-x-[6%] top-1/2 h-[18%] -translate-y-1/2 rounded-full bg-black/70" />
      </div>
      <div className="absolute left-[7cqw] top-[7.4cqw] h-[66cqw] w-[40cqw] overflow-hidden">
        <div className={cn(s.scrub, s.feed, s.paper, "bg-[#FBFCFE] px-[3cqw] pb-[5cqw] pt-[3.4cqw] text-[#0F3056] shadow-[0_1cqw_3cqw_rgb(6_20_40/0.25)]")} style={win(0.845, 0.11)}>
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
            <div className={cn(s.scrub, s.stamp, "rounded-[1.6cqw] border-[max(1.5px,0.5cqw)] border-[#018BCE] px-[2.4cqw] py-[1.4cqw] text-center text-[#018BCE]")} style={win(0.958, 0.038)}>
              <p className="font-heading text-[max(13px,5.4cqw)] uppercase leading-none tracking-wide">15% off</p>
              <p className="mt-[0.6cqw] text-[max(8px,2.4cqw)] font-semibold leading-none">applied</p>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(s.scrub, s.drop, DEVICE, "absolute left-[61cqw] top-[3cqw] h-[7cqw] w-[26cqw] rounded-[2cqw] shadow-[0_1.6cqw_3cqw_-1cqw_rgb(6_20_40/0.55)]")} style={win(0.705, 0.06)}>
        <div className="absolute inset-x-[16%] bottom-[14%] h-[16%] rounded-full bg-[#018BCE] shadow-[0_0_1.4cqw_#018BCE]" />
      </div>

      {/* The phone with the digital pass (moments 2 and 3) */}
      <div className={cn(s.scrub, s.phoneMove, "absolute left-[30cqw] top-[9cqw] h-[82cqw] w-[40cqw]")} style={win(0.69, 0.09)}>
        <div className={cn(s.scrub, s.phoneIn, "absolute inset-0 rounded-[6.4cqw] bg-gradient-to-br from-[#5F7A9A] via-[#1A2F4D] to-[#0A1628] p-[1.2cqw] shadow-[0_1cqw_2cqw_rgb(6_20_40/0.25),0_6cqw_12cqw_-4cqw_rgb(6_20_40/0.55)]")} style={win(0.596, 0.05)}>
          <div className="relative size-full overflow-hidden rounded-[5.3cqw] bg-[#0A1628] ring-1 ring-black/40">
            <div className="absolute left-1/2 top-[1.6cqw] h-[2.6cqw] w-[11cqw] -translate-x-1/2 rounded-full bg-black" />
            <div className="absolute left-[3.4cqw] top-[5.2cqw] flex items-center gap-[1.2cqw] text-[max(8px,2.6cqw)] font-medium leading-none text-white/85">
              <GoogleWalletLogo className="size-[max(10px,3.4cqw)] shrink-0" />
              Wallet
            </div>
            <p className="absolute inset-x-0 top-[66cqw] text-center text-[max(7px,2.3cqw)] leading-snug text-white/55">Show this QR at checkout</p>
            <div className="absolute bottom-[1.4cqw] left-1/2 h-[0.8cqw] w-[13cqw] -translate-x-1/2 rounded-full bg-white/60" />
          </div>
        </div>

        {/* The pass: unfolds out of the card's shape */}
        <div className={cn(s.scrub, s.unfold, "absolute left-[3.8cqw] top-[10cqw] h-[52cqw] w-[32.4cqw] bg-[#0F3056] text-white ring-1 ring-inset ring-white/10")} style={win(0.6, 0.05)}>
          <div className={cn(s.scrub, s.fadeIn, "absolute inset-0")} style={win(0.625, 0.03)}>
            <Image src="/brand/su-logo-white@hd.png" alt="" width={200} height={57} className="absolute left-[2.6cqw] top-[2.8cqw] h-[4.2cqw] w-auto" draggable={false} />
            <div className="absolute inset-x-[2.6cqw] top-[8.6cqw] h-px bg-white/15" />
            <p className="absolute left-[2.6cqw] top-[10.6cqw] font-heading text-[max(15px,6.6cqw)] uppercase leading-none tracking-wide">SU Card</p>
            <p className="absolute left-[2.6cqw] right-[2.6cqw] top-[18.2cqw] text-[max(7px,2.2cqw)] leading-snug text-white/70">Nile University Student Union</p>
          </div>
          <div className={cn(s.scrub, s.qrFly, "absolute left-[5.2cqw] top-[26cqw] size-[22cqw] overflow-hidden rounded-[2.2cqw] bg-white p-[1.8cqw]")} style={win(0.6, 0.045)}>
            <QrCode fill="#0F3056" className="size-full" />
            <div className={cn(s.scrub, s.beam, "absolute inset-0")} style={win(0.765, 0.09)}>
              <div className="h-[7%] bg-[#7FD4FF] shadow-[0_0_1.6cqw_0.4cqw_#018BCE]" />
            </div>
            <div className={cn(s.scrub, s.pop, "absolute inset-0 bg-[#BFE9FF]")} style={win(0.85, 0.035)} />
          </div>
        </div>
      </div>

      <div
        className={cn(s.scrub, s.cone, "absolute left-[66cqw] top-[10cqw] h-[40cqw] w-[16cqw] bg-gradient-to-b from-[#018BCE]/45 via-[#018BCE]/25 to-[#018BCE]/30 [clip-path:polygon(28%_0,72%_0,100%_100%,0_100%)]")}
        style={win(0.745, 0.2)}
      />

      {/* The card */}
      <div className={cn(s.scrub, s.pose, "absolute left-[15cqw] top-[24.5cqw] aspect-[707/516] w-[70cqw]")}>
        <div className={cn(s.scrub, s.flip, "relative size-full")}>
          {/* Front: identical on every card */}
          <div className={cn(s.face, "absolute inset-0 overflow-hidden")}>
            <CardFront sizes="(max-width: 768px) 70vw, 450px" />
            {/* Unissued veil, wiped away by the activation sweep */}
            <div className={cn(s.scrub, s.activate, VEIL, "absolute inset-0")} style={win(0.13, 0.15)} />
            <div className={cn(s.scrub, s.head, "absolute -left-[1cqw] inset-y-[4%] w-[0.8cqw] rounded-full bg-gradient-to-b from-transparent via-[#7FD4FF] to-transparent shadow-[0_0_2.4cqw_0.4cqw_rgb(1_139_206/0.75)]")} style={win(0.13, 0.15)} />
            <div className={cn(s.scrub, s.sheen, s.sheenFront, "absolute inset-y-0 -left-1/2 w-[200%]")} style={win(0, 1)} />
            {/* Corner markers: where the hero card hands off to */}
            <span data-corner="" className="absolute left-0 top-0" />
            <span data-corner="" className="absolute right-0 top-0" />
            <span data-corner="" className="absolute bottom-0 right-0" />
            <span data-corner="" className="absolute bottom-0 left-0" />
          </div>

          {/* Back: the one thing unique to each card, its QR */}
          <div className={cn(s.scrub, s.face, s.back, s.vanish, "absolute inset-0 overflow-hidden")} style={win(0.602, 0.022)}>
            <Image src={BACK} alt="" fill sizes="(max-width: 768px) 70vw, 450px" className="object-cover" draggable={false} />
            <div className="absolute left-[76.66%] top-[10.47%] aspect-square w-[15.7%]">
              <div className="absolute -inset-[7%] bg-[#0A2D4F]" />
              <div className="absolute inset-0 overflow-hidden">
                <svg viewBox={`0 0 ${QR.n} ${QR.n}`} className={cn(s.scrub, s.noise, "absolute inset-0 size-full")} style={win(0.475, 0.07)} shapeRendering="crispEdges">
                  <path d={QR.noise} fill="#FFFFFF" fillOpacity="0.55" />
                </svg>
                <QrCode fill="#FFFFFF" className={cn(s.scrub, s.resolve, "absolute inset-0 size-full")} style={win(0.475, 0.075)} />
                <div className={cn(s.scrub, s.edge, "absolute inset-0")} style={win(0.475, 0.075)}>
                  <div className="h-[6%] bg-[#7FD4FF] shadow-[0_0_1cqw_#018BCE]" />
                </div>
              </div>
              <div className={cn(s.scrub, s.lock, "absolute -inset-[22%]")} style={win(0.445, 0.045)}>
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

      {/* Confirmations live in the app, outside the card */}
      <div className={cn(s.scrub, s.leave, "absolute inset-x-0 top-[10cqw] flex justify-center")} style={win(0.335, 0.04)}>
        <div className={cn(s.scrub, s.rise, CHIP)} style={win(0.235, 0.06)}>
          <MicrosoftLogo className="ml-[1cqw] size-[max(14px,4cqw)] shrink-0" />
          Signed in · student@nu.edu.eg
        </div>
      </div>
      <div className={cn(s.scrub, s.leave, "absolute inset-x-0 top-[10cqw] flex justify-center")} style={win(0.565, 0.025)}>
        <div className={cn(s.scrub, s.rise, CHIP)} style={win(0.515, 0.045)}>
          <span className="grid size-[max(18px,5.4cqw)] place-items-center rounded-full bg-[#018BCE] text-white">
            <Check className="size-[62%]" strokeWidth={3} />
          </span>
          Card linked to your account
        </div>
      </div>
      <div className={cn(s.scrub, s.leave, "absolute inset-x-0 top-[81cqw] flex justify-center")} style={win(0.578, 0.025)}>
        <div className={cn(s.scrub, s.rise, "relative flex items-center gap-[2cqw] whitespace-nowrap rounded-full bg-[#1F1F1F] px-[4.4cqw] py-[2.6cqw] text-[max(11px,3.2cqw)] font-medium leading-none text-white shadow-[0_2cqw_4cqw_-1.6cqw_rgb(6_20_40/0.45)] ring-1 ring-white/10")} style={win(0.53, 0.04)}>
          <GoogleWalletLogo className="size-[max(16px,4.8cqw)] shrink-0" />
          Add to Google Wallet
          <span className={cn(s.scrub, s.ring, "absolute -inset-[1.2cqw] rounded-full border-2 border-[#018BCE]")} style={win(0.552, 0.03)} />
        </div>
      </div>
    </div>
  );
}
