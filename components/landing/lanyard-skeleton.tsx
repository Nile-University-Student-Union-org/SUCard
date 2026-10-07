import { cn } from "cn";
import type { CSSProperties } from "react";

/** Soft placeholder bar on the navy card; breathes while loading. */
const bar = "rounded-full bg-white/[0.09] motion-safe:animate-[skeleton-breathe_2.4s_ease-in-out_infinite]";

/** Navy woven strap, matching the real lanyard's colours. */
const STRAP_STYLE: CSSProperties = {
  backgroundImage: [
    // Sky centre stripe
    "linear-gradient(to right, transparent 46%, rgb(1 139 206 / 0.55) 46%, rgb(1 139 206 / 0.55) 54%, transparent 54%)",
    // Twill weave
    "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.05) 0 2px, transparent 2px 5px)",
    // Rounded fabric: darker selvedges, lighter middle
    "linear-gradient(to right, #0A2340, #154778 30%, #18508A 50%, #154778 70%, #0A2340)",
  ].join(", "),
};

/** Brushed-metal look for the crimp and split ring. */
const METAL = "linear-gradient(to bottom, #F1F5F9, #94A3B8 45%, #E2E8F0 60%, #64748B)";

/**
 * Placeholder shaped like the hanging card (strap, crimp, ring, card) shown while the 3D scene loads.
 * It is styled like the real card (navy, glossy, metal hardware) and sways gently so the swap to 3D feels continuous.
 */
export function LanyardSkeleton({ className, done = false }: { className?: string; done?: boolean }) {
  return (
    <div
      className={cn("absolute inset-0 pointer-events-none select-none", className)}
      role={done ? undefined : "status"}
      aria-label={done ? undefined : "Loading the SU Card preview"}
      aria-hidden={done || undefined}
    >
      {/* Soft glow behind the card */}
      <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[min(70%,420px)] aspect-square rounded-full bg-macaw-blue/15 dark:bg-macaw-blue/20 blur-3xl" />

      {/* Hanging assembly, pivoting from the top edge */}
      <div className="relative h-full flex flex-col items-center origin-top motion-safe:animate-[lanyard-sway_5s_ease-in-out_infinite]">
        {/* Strap, fading in from the top */}
        <div
          className="w-[11%] max-w-14 min-w-9 flex-1 max-h-[36%] shadow-[inset_0_-6px_8px_-6px_rgb(0_0_0/0.5)] [mask-image:linear-gradient(to_bottom,transparent,#000_72px)]"
          style={STRAP_STYLE}
        />
        {/* Crimp */}
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

        {/* Card */}
        <div className="relative -mt-[22px] w-[min(78%,440px)] aspect-[1.585/1]">
          <div className="absolute inset-0 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#16477A] via-[#0F3056] to-[#0A2140] ring-1 ring-inset ring-white/15 shadow-[0_30px_60px_-20px_rgb(15_48_86/0.55),0_12px_24px_-12px_rgb(0_0_0/0.35)]">
            {/* Top highlight, like clearcoat catching the light */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.10] to-transparent" />
            {/* Slot punched for the ring */}
            <div className="absolute left-1/2 top-[4.5%] -translate-x-1/2 w-[15.6%] h-[4.5%] rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)]" />
            {/* Sky foil strip */}
            <div className="absolute left-0 top-[16%] h-[1.5%] w-[38%] bg-gradient-to-r from-macaw-blue/70 to-transparent" />

            {/* Placeholder content */}
            <div className="absolute inset-0 p-[6%] pt-[13%] flex justify-between gap-[6%]">
              <div className="flex flex-col justify-between w-[52%]">
                <div className={cn(bar, "h-[10%] w-[34%] rounded-md")} />
                <div className="space-y-[6%]">
                  <div className={cn(bar, "h-7 sm:h-10 w-full rounded-lg bg-white/[0.13]")} />
                  <div className={cn(bar, "h-2 sm:h-2.5 w-4/5 [animation-delay:150ms]")} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(bar, "h-4 sm:h-5 w-[38%] bg-macaw-blue/35 [animation-delay:300ms]")} />
                  <div className={cn(bar, "h-2 sm:h-2.5 w-[42%] [animation-delay:450ms]")} />
                </div>
              </div>
              {/* QR placeholder: a white tile with a faint dot grid */}
              <div className="self-end aspect-square w-[33%] rounded-xl bg-white/[0.92] p-[5%] shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]">
                <div className="size-full rounded-md [background-image:radial-gradient(rgb(15_48_86/0.28)_32%,transparent_36%)] [background-size:12.5%_12.5%] motion-safe:animate-[skeleton-breathe_2.4s_ease-in-out_infinite] [animation-delay:200ms]" />
              </div>
            </div>

            {/* Diagonal sheen sweeping across the gloss */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.14] to-transparent motion-safe:animate-[card-sheen_2.8s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      {/* Contact shadow that follows the sway */}
      <div className="absolute left-1/2 bottom-[7%] -ml-[min(30%,170px)] w-[min(60%,340px)] h-5 rounded-[50%] bg-black/25 dark:bg-black/50 blur-xl motion-safe:animate-[lanyard-shadow_5s_ease-in-out_infinite]" />

      {!done && <span className="sr-only">Loading…</span>}
    </div>
  );
}
