"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, CreditCard, QrCode, ScanLine, ShieldCheck, Smartphone, Store } from "lucide-react";
import { cn } from "cn";
import { GoogleWalletLogo } from "@/components/student/student-card-view";
import { CARD_ART } from "./card-art";

type IssuanceFlow = "digital" | "physical";

const FLOW_CONFIG: Record<
  IssuanceFlow,
  {
    label: string;
    icon: typeof Smartphone;
    steps: readonly [
      { title: string; subtitle: string; body: string },
      { title: string; subtitle: string; body: string },
      { title: string; subtitle: string; body: string },
    ];
  }
> = {
  digital: {
    label: "Digital Pass (Instant)",
    icon: Smartphone,
    steps: [
      {
        title: "Sign in",
        subtitle: "NU Microsoft Account",
        body: "Sign in with your @nu.edu.eg university email. No separate password or sign-up needed.",
      },
      {
        title: "Get your card",
        subtitle: "Instant Digital Activation",
        body: "Your digital SU Card is generated instantly on your phone. Add it to Google Wallet for one-tap access.",
      },
      {
        title: "Show & save",
        subtitle: "Partner Discounts",
        body: "Show your QR code at partner spots. The cashier scans it and your student discount is applied instantly.",
      },
    ],
  },
  physical: {
    label: "Physical Card (SU Office)",
    icon: CreditCard,
    steps: [
      {
        title: "Sign in",
        subtitle: "NU Microsoft Account",
        body: "Sign in with your @nu.edu.eg university email to open your student profile.",
      },
      {
        title: "Collect & link",
        subtitle: "SU Office Pickup",
        body: "Pick up your physical card from the SU office and scan its unique QR code to link it to your account.",
      },
      {
        title: "Show & save",
        subtitle: "Card or Wallet Pass",
        body: "Present your physical card or wallet QR at checkout. The cashier scans it to verify and apply your discount.",
      },
    ],
  },
};

/**
 * "How it works":
 * - A sticky, scroll-driven walkthrough across all screen sizes (mobile through desktop).
 * - Compact and responsive on phones (360-430px) without overflow or URL bar jumps (svh).
 * - Interactive step labels allowing one-tap scrolling jump.
 * - Accurately presents both Digital Pass and Physical Card issuance modes.
 */
export function HowItWorks() {
  const [flow, setFlow] = useState<IssuanceFlow>("digital");
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [progress, setProgress] = useState(0);

  /** Connector through desktop step badges: endpoints and fill distance */
  const [rail, setRail] = useState({ first: 0, last: 0, fill: 0 });

  const activeFlow = FLOW_CONFIG[flow];
  const steps = activeFlow.steps;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setProgress(p);

      const list = listRef.current;
      if (!list) return;
      const top = list.getBoundingClientRect().top;
      const centres = badgeRefs.current.map((b) => {
        const r = b?.getBoundingClientRect();
        return r ? r.top + r.height / 2 - top : 0;
      });
      // Glide from one badge to the next, arriving as that step becomes active.
      const f = Math.min(steps.length - 1, Math.max(0, p * steps.length - 0.5));
      const i = Math.min(steps.length - 2, Math.max(0, Math.floor(f)));
      const at = centres[i] + (centres[i + 1] - centres[i]) * (f - i);
      const first = centres[0] ?? 0;
      const last = centres[steps.length - 1] ?? 0;
      setRail({ first, last, fill: at - first });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    if (listRef.current) observer.observe(listRef.current);
    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [steps.length]);

  const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));

  /** Scrolls so step `i` sits in the middle of its slice of the section, respecting reduced motion. */
  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (total <= 0) {
      setProgress(i / Math.max(1, steps.length - 1));
      return;
    }
    window.scrollTo({
      top: top + ((i + 0.5) / steps.length) * total,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative border-t border-border/80 h-[240svh] md:h-[220svh]"
    >
      <div className="sticky top-0 h-svh max-h-svh flex items-center justify-center overflow-hidden">
        {/* Dot-grid texture, fading out toward the edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgb(15_48_86/0.13)_1px,transparent_1px)] dark:[background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_60%_50%,#000_20%,transparent_75%)]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8 py-3 sm:py-6 md:py-0">
          <div className="grid w-full grid-cols-1 items-center gap-3 xs:gap-4 sm:gap-6 md:grid-cols-[minmax(0,32rem)_auto] md:justify-center md:gap-16 lg:gap-24">
            {/* Copy & Step Selection */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase text-macaw-blue">
                  <span aria-hidden="true" className="h-px w-5 sm:w-6 bg-current" />
                  How it works
                </p>

                {/* Mode Toggle: Digital Pass vs Physical Card */}
                <div
                  role="tablist"
                  aria-label="Issuance mode"
                  className="inline-flex items-center rounded-full bg-slate-100/90 dark:bg-white/[0.06] p-0.5 sm:p-1 border border-slate-200/80 dark:border-white/10 shadow-xs"
                >
                  {(["digital", "physical"] as const).map((mode) => {
                    const isSelected = flow === mode;
                    const Icon = FLOW_CONFIG[mode].icon;
                    return (
                      <button
                        key={mode}
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setFlow(mode)}
                        className={cn(
                          "inline-flex min-h-[38px] sm:min-h-[44px] items-center gap-1.5 rounded-full px-3 sm:px-4 text-xs font-bold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          isSelected
                            ? "bg-brand text-white shadow-xs dark:bg-brand-soft dark:text-midnight"
                            : "text-ash hover:text-charcoal dark:text-zinc-400 dark:hover:text-white",
                        )}
                      >
                        <Icon className="size-3.5" />
                        <span>{mode === "digital" ? "Digital Pass" : "Physical Card"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <h2
                id="how-it-works-title"
                className="mt-2 sm:mt-4 font-heading uppercase tracking-wide leading-[0.95] text-charcoal dark:text-white text-[clamp(1.5rem,4.2vw,3.25rem)]"
              >
                Three steps
                <br /> to{" "}
                <span className="text-brand dark:text-brand-soft">
                  student savings
                </span>
              </h2>

              <p className="mt-2 sm:mt-3 hidden md:block max-w-md text-sm sm:text-base leading-relaxed text-ash dark:text-zinc-400">
                {flow === "digital"
                  ? "Sign in, get your digital card on your phone, and save at partners."
                  : "Sign in, collect your card at the SU office, scan to link, and save."}
              </p>

              {/* Desktop: steps as cards on a vertical connector; the active one lifts and opens */}
              <ol ref={listRef} className="relative mt-6 sm:mt-8 hidden space-y-2 md:block">
                <li
                  aria-hidden="true"
                  className="absolute z-[1] left-[2.375rem] w-px -translate-x-1/2 bg-border"
                  style={{ top: rail.first, height: Math.max(0, rail.last - rail.first) }}
                >
                  <span
                    className="absolute inset-x-0 top-0 bg-brand dark:bg-brand-soft transition-all duration-300 motion-reduce:transition-none"
                    style={{ height: Math.max(0, rail.fill) }}
                  />
                </li>
                {steps.map((step, i) => {
                  const on = i === active;
                  const done = i < active;
                  return (
                    <li key={step.title}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={on ? "step" : undefined}
                        className={cn(
                          "group relative flex min-h-[44px] w-full items-start gap-4 rounded-2xl px-5 py-3.5 text-left transition-[background-color,box-shadow] duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          on
                            ? "bg-white/85 shadow-[0_14px_36px_-16px_rgb(15_48_86/0.35)] ring-1 ring-slate-200/90 dark:bg-white/[0.05] dark:ring-white/10 dark:shadow-none"
                            : "hover:bg-white/40 dark:hover:bg-white/[0.02]",
                        )}
                      >
                        <span
                          ref={(node) => {
                            badgeRefs.current[i] = node;
                          }}
                          className={cn(
                            "relative z-10 mt-0.5 grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm tabular-nums transition-all duration-300 motion-reduce:transition-none",
                            on && "bg-brand text-white shadow-[0_0_0_6px_rgb(15_84_141/0.12)] dark:bg-brand-soft dark:text-midnight",
                            done && "bg-background text-brand ring-1 ring-brand/30 dark:text-brand-soft dark:ring-brand-soft/30",
                            !on && !done && "bg-background text-ash/70 ring-1 ring-border dark:text-zinc-500",
                          )}
                        >
                          {done ? <Check className="size-4" strokeWidth={3} /> : `0${i + 1}`}
                        </span>
                        <span className="min-w-0 flex-1 pt-1">
                          <span
                            className={cn(
                              "block font-heading uppercase tracking-wide text-xl leading-none transition-colors duration-200",
                              on
                                ? "text-charcoal dark:text-white"
                                : "text-ash/60 dark:text-zinc-600 group-hover:text-ash dark:group-hover:text-zinc-400",
                            )}
                          >
                            {step.title}
                          </span>
                          <span
                            className={cn(
                              "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                              on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                            )}
                          >
                            <span className="overflow-hidden">
                              <span className="block pt-1.5 max-w-[42ch] text-[0.875rem] leading-relaxed text-ash dark:text-zinc-400">
                                {step.body}
                              </span>
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Mobile: Horizontal step rail + active step card */}
              <div className="md:hidden mt-3 xs:mt-4 space-y-2">
                {/* Step selector pills with connected progress line */}
                <div className="relative" role="tablist" aria-label="Walkthrough steps">
                  {/* Background connecting track */}
                  <div
                    aria-hidden="true"
                    className="absolute top-1/2 left-[16.67%] right-[16.67%] h-0.5 -translate-y-1/2 bg-border"
                  >
                    <div
                      className="h-full bg-brand dark:bg-brand-soft transition-all duration-300 motion-reduce:transition-none"
                      style={{
                        width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                      }}
                    />
                  </div>

                  {/* 3 Step Buttons */}
                  <div className="relative z-10 grid grid-cols-3 gap-1.5 xs:gap-2">
                    {steps.map((step, i) => {
                      const on = i === active;
                      const done = i < active;
                      return (
                        <button
                          key={step.title}
                          type="button"
                          role="tab"
                          aria-selected={on}
                          onClick={() => goTo(i)}
                          className={cn(
                            "group flex min-h-[44px] flex-col items-center justify-center rounded-xl p-1.5 text-center transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                            on
                              ? "bg-white/90 dark:bg-white/[0.08] shadow-xs ring-1 ring-slate-200/90 dark:ring-white/15"
                              : "bg-slate-100/70 hover:bg-white/60 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-6 xs:size-7 place-items-center rounded-full font-heading text-xs tabular-nums transition-all duration-300 motion-reduce:transition-none",
                              on && "bg-brand text-white shadow-xs dark:bg-brand-soft dark:text-midnight",
                              done && "bg-background text-brand ring-1 ring-brand/30 dark:text-brand-soft dark:ring-brand-soft/30",
                              !on && !done && "bg-background text-ash/70 ring-1 ring-border dark:text-zinc-500",
                            )}
                          >
                            {done ? <Check className="size-3.5" strokeWidth={3} /> : `0${i + 1}`}
                          </span>
                          <span
                            className={cn(
                              "mt-1 block max-w-full truncate font-heading text-[11px] xs:text-xs uppercase tracking-wide transition-colors duration-200",
                              on
                                ? "text-charcoal dark:text-white"
                                : "text-ash/70 dark:text-zinc-500 group-hover:text-charcoal dark:group-hover:text-zinc-300",
                            )}
                          >
                            {step.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Step Content Card */}
                <div className="rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 px-3 py-2 text-left shadow-2xs">
                  <p className="font-heading uppercase tracking-wide text-xs xs:text-sm text-charcoal dark:text-white">
                    <span className="text-macaw-blue mr-1.5">0{active + 1}</span>
                    {steps[active].title}
                    <span className="ml-1.5 text-[11px] font-normal normal-case text-ash dark:text-zinc-400 font-body">
                      • {steps[active].subtitle}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ash dark:text-zinc-300 line-clamp-2">
                    {steps[active].body}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone Demonstration */}
            <div className="relative flex justify-center mt-1 xs:mt-2 md:mt-0">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="absolute h-[78%] aspect-square rounded-full bg-gradient-to-br from-brand/30 via-macaw-blue/25 to-transparent blur-2xl md:blur-3xl dark:from-brand-soft/25" />
                <div className="absolute h-[104%] aspect-square rounded-full border border-brand/10 dark:border-white/[0.06]" />
                <div className="absolute h-[132%] aspect-square rounded-full border border-brand/[0.07] dark:border-white/[0.04]" />
              </div>
              <div className="relative">
                <div className="motion-safe:animate-[phone-float_7s_ease-in-out_infinite] motion-reduce:animate-none">
                  <Phone active={active} flow={flow} />
                </div>
                {/* Contact shadow */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 md:-bottom-6 left-1/2 h-4 md:h-5 w-[70%] -translate-x-1/2 rounded-[50%] bg-[rgb(15_48_86/0.28)] blur-lg md:blur-xl dark:bg-black/60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Phone({ active, flow }: { active: number; flow: IssuanceFlow }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-[min(340px,36svh)] xs:h-[min(390px,40svh)] sm:h-[min(460px,46svh)] md:h-[min(580px,70svh)] lg:h-[min(620px,74svh)] aspect-[9/19.2]"
    >
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-[18%] h-[7%] w-[3px] rounded-l bg-zinc-500 dark:bg-zinc-700" />
      <span className="absolute -left-[3px] top-[28%] h-[11%] w-[3px] rounded-l bg-zinc-500 dark:bg-zinc-700" />
      <span className="absolute -right-[3px] top-[24%] h-[14%] w-[3px] rounded-r bg-zinc-500 dark:bg-zinc-700" />

      {/* Frame */}
      <div className="absolute inset-0 rounded-[17%/8%] bg-gradient-to-br from-zinc-400 via-zinc-700 to-zinc-900 p-[2.5%] shadow-[0_40px_80px_-30px_rgb(15_48_86/0.6),0_20px_40px_-20px_rgb(0_0_0/0.5)]">
        <div className="relative size-full overflow-hidden rounded-[15%/7%] bg-black p-[1.2%]">
          {/* Screen */}
          <div className="@container relative size-full overflow-hidden rounded-[14%/6.5%] bg-[#06121F] text-white">
            {/* Ambient light on screen */}
            <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 size-[120cqw] rounded-full bg-[#0F548D]/40 blur-[18cqw]" />

            {/* Status bar */}
            <div className="relative z-20 flex items-center justify-between px-[9cqw] pt-[4.5cqw] text-[3.6cqw] font-semibold">
              <span>9:41</span>
              <span className="flex items-center gap-[1.2cqw]">
                <span className="flex items-end gap-[0.5cqw] h-[2.6cqw]">
                  {[40, 60, 80, 100].map((h) => (
                    <span key={h} className="w-[0.8cqw] rounded-sm bg-white" style={{ height: `${h}%` }} />
                  ))}
                </span>
                <span className="h-[2.6cqw] w-[5.2cqw] rounded-[0.8cqw] border border-white/70 p-[0.4cqw]">
                  <span className="block h-full w-3/4 rounded-[0.3cqw] bg-white" />
                </span>
              </span>
            </div>

            {/* Dynamic island */}
            <div className="absolute left-1/2 top-[2.6cqw] z-30 h-[7.5cqw] w-[28cqw] -translate-x-1/2 rounded-full bg-black" />

            {/* Screen Content Layers */}
            <div className="absolute inset-0 top-[11cqw]">
              <Screen index={0} active={active}>
                <SignInScreen on={active === 0} />
              </Screen>

              <Screen index={1} active={active}>
                {flow === "digital" ? (
                  <DigitalCardScreen on={active === 1} />
                ) : (
                  <PhysicalCardScreen on={active === 1} />
                )}
              </Screen>

              <Screen index={2} active={active}>
                <ScanScreen on={active === 2} />
              </Screen>

              {/* Shared Card pose morphing between screen 0 and screen 1 */}
              <div
                className="pointer-events-none absolute left-[6cqw] top-[19cqw] z-10 w-[88cqw] will-change-transform motion-safe:transition-[transform,opacity] motion-safe:duration-[700ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={CARD_POSES[active]}
              >
                <MiniCard flipped={active === 1 && flow === "digital"} />
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-[2.4cqw] left-1/2 z-30 h-[1.2cqw] w-[34cqw] -translate-x-1/2 rounded-full bg-white/80" />
          </div>
        </div>
      </div>

      {/* Glass reflection */}
      <div className="pointer-events-none absolute inset-0 rounded-[17%/8%] bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.10]" />
    </div>
  );
}

/** Shared card pose per step: tilted hero on sign-in, in place on "My card", tucked away at checkout. */
const CARD_POSES: React.CSSProperties[] = [
  { transform: "translateY(20cqw) rotate(-7deg) scale(0.8)", opacity: 1 },
  { transform: "none", opacity: 1 },
  {
    transform: "translateX(-16cqw) scale(0.94)",
    opacity: 0,
    transition: "transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 150ms ease-out",
  },
];

const EASE_OUT = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Screens transition with transform and opacity only */
function Screen({ index, active, children }: { index: number; active: number; children: React.ReactNode }) {
  const offset = Math.sign(index - active);
  return (
    <div
      aria-hidden={offset !== 0}
      className={cn(
        "absolute inset-0 will-change-transform transition-[opacity,transform] duration-[500ms] motion-reduce:transition-none",
        EASE_OUT,
        offset === 0 ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={{ transform: `translateX(${offset * 14}cqw)` }}
    >
      {children}
    </div>
  );
}

function rise(on: boolean, delay: number) {
  return {
    className: cn(
      "transition-[opacity,transform] duration-400 motion-reduce:transition-none",
      EASE_OUT,
      on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[2.5cqw]",
    ),
    style: { transitionDelay: on ? `${delay}ms` : "0ms" },
  };
}

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

function SignInScreen({ on }: { on: boolean }) {
  const title = rise(on, 180);
  const sub = rise(on, 240);
  const cta = rise(on, 300);
  return (
    <div className="relative h-full px-[9cqw] text-center">
      <div className="absolute left-1/2 top-[69cqw] size-[60cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-macaw-blue/35 blur-[12cqw]" />
      <div className="absolute inset-x-[9cqw] top-[106cqw]">
        <p className={cn("font-heading text-[8cqw] uppercase leading-none tracking-wide", title.className)} style={title.style}>
          Welcome
        </p>
        <p className={cn("mt-[2.5cqw] text-[3.6cqw] leading-snug text-white/60", sub.className)} style={sub.style}>
          Sign in to access your SU Card
        </p>
      </div>

      <div className={cn("absolute inset-x-[9cqw] top-[134cqw]", cta.className)} style={cta.style}>
        <div className="relative flex items-center justify-center gap-[2.5cqw] rounded-[3.5cqw] bg-white py-[4cqw] text-[3.9cqw] font-semibold text-[#1f1f1f] shadow-lg">
          <MicrosoftLogo className="w-[4.2cqw]" />
          Sign in with Microsoft
        </div>
        <p className="mt-[3.5cqw] text-[3.2cqw] text-white/60 font-mono">@nu.edu.eg</p>
      </div>
    </div>
  );
}

function useDemoQr() {
  return useMemo(() => {
    const qr = QRCode.create("NUSU1:DEMO0000000000000000", { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let d = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { n, d };
  }, []);
}

function DemoQr({ className }: { className?: string }) {
  const { n, d } = useDemoQr();
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className={className} shapeRendering="crispEdges">
      <path d={d} fill="#0F3056" />
    </svg>
  );
}

function MiniCard({ flipped = false }: { flipped?: boolean }) {
  const frontArt = CARD_ART.front ?? "/card/front.png";
  const backArt = CARD_ART.back ?? "/card/back.png";

  return (
    <div className="relative aspect-[1.37/1] w-full [perspective:1000px]">
      <div
        className={cn(
          "relative size-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [transform-style:preserve-3d] [-webkit-transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
        style={{
          transitionDelay: flipped ? "200ms" : "0ms",
        }}
      >
        {/* Front Face */}
        <div className="absolute inset-0 size-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] drop-shadow-[0_4cqw_10cqw_rgba(0,0,0,0.65)]">
          <Image
            src={frontArt}
            alt="SU Card front"
            fill
            sizes="(max-width: 768px) 60vw, 320px"
            className="object-contain select-none pointer-events-none"
            priority
          />
        </div>

        {/* Back Face (QR Code side) */}
        <div className="absolute inset-0 size-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] drop-shadow-[0_4cqw_10cqw_rgba(0,0,0,0.65)]">
          <Image
            src={backArt}
            alt="SU Card back"
            fill
            sizes="(max-width: 768px) 60vw, 320px"
            className="object-contain select-none pointer-events-none"
            priority
          />
        </div>
      </div>
    </div>
  );
}

function DigitalCardScreen({ on }: { on: boolean }) {
  const head = rise(on, 0);
  const info = rise(on, 200);
  const wallet = rise(on, 300);
  return (
    <div className="flex h-full flex-col px-[6cqw] pt-[5cqw]">
      <div className={cn("flex h-[9cqw] items-center justify-between", head.className)} style={head.style}>
        <p className="font-heading text-[6.4cqw] uppercase leading-none tracking-wide">My card</p>
        <span className="flex size-[8cqw] items-center justify-center rounded-full bg-white/10 text-[3.4cqw] font-semibold">
          S
        </span>
      </div>
      <div className="mt-[5cqw] aspect-[1.37/1] w-full" />
      <div className={cn("flex flex-1 flex-col items-center justify-center text-center", info.className)} style={info.style}>
        <p className="text-[3.4cqw] font-semibold text-white/90">Instant Digital Pass</p>
        <p className="mt-[1.5cqw] text-[2.8cqw] text-white/50">Ready to use • Valid 2026/2027</p>
      </div>
      <div
        className={cn(
          "mb-[8cqw] flex items-center justify-center gap-[2.4cqw] rounded-full bg-black py-[3.6cqw] text-[3.6cqw] font-semibold ring-1 ring-white/20",
          wallet.className,
        )}
        style={wallet.style}
      >
        <GoogleWalletLogo className="w-[5cqw] h-auto" />
        Add to Google Wallet
      </div>
    </div>
  );
}

function PhysicalCardScreen({ on }: { on: boolean }) {
  const head = rise(on, 0);
  const info = rise(on, 200);
  const action = rise(on, 300);
  return (
    <div className="flex h-full flex-col px-[6cqw] pt-[5cqw]">
      <div className={cn("flex h-[9cqw] items-center justify-between", head.className)} style={head.style}>
        <p className="font-heading text-[6.4cqw] uppercase leading-none tracking-wide">Link card</p>
        <span className="rounded-full bg-macaw-blue/20 text-macaw-blue px-[2.5cqw] py-[0.8cqw] text-[2.6cqw] font-bold">
          SU Office
        </span>
      </div>
      <div className="mt-[5cqw] aspect-[1.37/1] w-full" />
      <div className={cn("flex flex-1 flex-col items-center justify-center text-center", info.className)} style={info.style}>
        <p className="text-[3.4cqw] font-semibold text-white/90">Physical Card Linked</p>
        <p className="mt-[1.5cqw] text-[2.8cqw] text-white/50">Scan QR on printed card to link</p>
      </div>
      <div
        className={cn(
          "mb-[8cqw] flex items-center justify-center gap-[2.4cqw] rounded-full bg-brand py-[3.6cqw] text-[3.6cqw] font-semibold text-white ring-1 ring-brand-soft/40 shadow-md",
          action.className,
        )}
        style={action.style}
      >
        <QrCode className="size-[4.5cqw]" />
        Scan Card QR to Link
      </div>
    </div>
  );
}

function ScanScreen({ on }: { on: boolean }) {
  const head = rise(on, 0);
  const card = rise(on, 120);
  return (
    <div className="relative flex h-full flex-col px-[5cqw] pt-[4cqw]">
      {/* Top Bar: Show & Save Header + Breadfast Partner Chip */}
      <div className={cn("flex items-center justify-between w-full", head.className)} style={head.style}>
        <div>
          <p className="font-heading text-[5.4cqw] uppercase tracking-wide leading-none text-white">
            Show &amp; Save
          </p>
          <p className="mt-[0.8cqw] text-[2.7cqw] text-white/60 font-body">
            Present QR at checkout
          </p>
        </div>
        <div className="inline-flex items-center gap-[1.4cqw] rounded-full bg-[#018BCE]/20 border border-[#018BCE]/40 px-[2.6cqw] py-[0.8cqw] text-[#38BDF8] shadow-2xs">
          <Store className="size-[3cqw] shrink-0" />
          <span className="text-[2.5cqw] font-bold tracking-wide">Breadfast · 15% off</span>
        </div>
      </div>

      {/* Beat 1 & 2: Student's SU Card with QR, Scan Brackets & Laser */}
      <div className={cn("relative mt-[3.5cqw] w-full", card.className)} style={card.style}>
        <div className="relative w-full rounded-[4cqw] bg-[#0F3056] border-2 border-[#0F548D]/70 ring-1 ring-inset ring-white/15 p-[3.6cqw] shadow-[0_4cqw_16cqw_-2cqw_rgba(0,0,0,0.7)] text-white overflow-hidden select-none">
          {/* Subtle Ambient Brand Glows & Arcs */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-[12cqw] -right-[12cqw] size-[32cqw] rounded-full bg-[#018BCE]/30 blur-[10cqw]" />
            <div className="absolute -bottom-[12cqw] -left-[12cqw] size-[32cqw] rounded-full bg-[#0F548D]/40 blur-[10cqw]" />
            <svg
              className="absolute inset-0 size-full opacity-15"
              viewBox="0 0 360 420"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="320" cy="70" r="130" stroke="#018BCE" strokeWidth="1.5" strokeDasharray="6 6" />
              <circle cx="320" cy="70" r="170" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.3" />
              <circle cx="40" cy="370" r="110" stroke="#018BCE" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Card Top Branding Header: NUSU Logo + "SU CARD" Wordmark + Active Badge */}
          <div className="relative z-10 flex items-center justify-between gap-[2cqw] mb-[2.5cqw]">
            <div className="flex items-center gap-[2cqw]">
              <Image
                src="/brand/su-logo-white@hd.png"
                alt="NUSU"
                width={80}
                height={22}
                className="h-[3.6cqw] w-auto object-contain"
              />
              <div className="w-[1px] h-[3.2cqw] bg-white/25" aria-hidden="true" />
              <span className="font-heading text-[3.2cqw] uppercase tracking-[0.08em] text-white leading-none">
                SU CARD
              </span>
            </div>
            <span className="inline-flex items-center gap-[1cqw] rounded-full bg-emerald-500/20 border border-emerald-500/35 px-[2cqw] py-[0.4cqw] text-[2.1cqw] font-bold text-emerald-300">
              <span className="size-[1.2cqw] rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          </div>

          {/* Centered High-Contrast QR Code Box with Crisp Scan Brackets & Laser */}
          <div className="relative z-10 mx-auto my-[1cqw] flex flex-col items-center justify-center">
            <div className="relative rounded-[3.2cqw] bg-white p-[2.6cqw] shadow-2xl ring-2 ring-black/10 flex items-center justify-center w-[40cqw] aspect-square">
              <DemoQr className="w-full h-full object-contain" />

              {/* Scan Frame: Crisp corner brackets in macaw-blue (#018BCE) */}
              <span className="absolute -left-[1.2cqw] -top-[1.2cqw] size-[3.8cqw] border-l-[2.5px] border-t-[2.5px] border-[#018BCE] rounded-tl-[1.8cqw]" />
              <span className="absolute -right-[1.2cqw] -top-[1.2cqw] size-[3.8cqw] border-r-[2.5px] border-t-[2.5px] border-[#018BCE] rounded-tr-[1.8cqw]" />
              <span className="absolute -left-[1.2cqw] -bottom-[1.2cqw] size-[3.8cqw] border-l-[2.5px] border-b-[2.5px] border-[#018BCE] rounded-bl-[1.8cqw]" />
              <span className="absolute -right-[1.2cqw] -bottom-[1.2cqw] size-[3.8cqw] border-r-[2.5px] border-b-[2.5px] border-[#018BCE] rounded-br-[1.8cqw]" />

              {/* Laser scan beam - sweeps across the QR code */}
              <div className="absolute inset-[2.6cqw] overflow-hidden rounded-[1.8cqw] pointer-events-none">
                <div
                  className={cn(
                    "absolute inset-x-0 h-[8cqw] bg-gradient-to-b from-[#018BCE]/35 via-[#018BCE]/15 to-transparent border-t-[2px] border-[#018BCE] shadow-[0_0_8px_#018BCE] transition-opacity duration-300",
                    on ? "motion-safe:animate-[scan-beam_1.6s_ease-in-out_infinite]" : "opacity-0",
                  )}
                />
              </div>
            </div>
          </div>

          {/* Card Bottom: Student Identity */}
          <div className="relative z-10 pt-[2cqw] mt-[1.5cqw] border-t border-white/15 flex items-end justify-between gap-[2cqw]">
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[3.8cqw] uppercase tracking-wide text-white leading-none truncate">
                AHMED HASSAN
              </p>
              <p className="text-[2.5cqw] font-mono font-bold text-sky-200 tracking-wider mt-[0.8cqw]">
                ID 202201489
              </p>
            </div>
            <span className="text-[2.2cqw] font-mono text-white/50 pb-[0.2cqw]">
              2026/2027
            </span>
          </div>
        </div>

        {/* Scan Status Prompt (visible during scanning beat, fades when verified) */}
        <div
          className={cn(
            "mt-[3cqw] flex items-center justify-center gap-[1.8cqw] text-[2.9cqw] text-sky-200/80 transition-all duration-300",
            on ? "opacity-0 scale-95 delay-[850ms] motion-reduce:opacity-0 motion-reduce:delay-0" : "opacity-100 scale-100",
          )}
        >
          <ScanLine className="size-[3.6cqw] text-[#018BCE] animate-pulse" />
          <span>Cashier scanning QR…</span>
        </div>
      </div>

      {/* Beat 3: Result — Confident Cashier Verification Success Panel */}
      <div
        className={cn(
          "absolute inset-x-[4cqw] bottom-[4cqw] z-30 rounded-[4.5cqw] bg-[#0A2240] border-2 border-emerald-500/60 p-[3.8cqw] text-white shadow-[0_12cqw_36cqw_rgba(0,0,0,0.95)] ring-1 ring-white/15 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          on
            ? "opacity-100 translate-y-0 delay-[850ms] motion-reduce:delay-0"
            : "opacity-0 translate-y-[12cqw] pointer-events-none delay-0",
        )}
      >
        {/* Top Row: Emerald Badge + Offer Applied Tag */}
        <div className="flex items-center gap-[3cqw]">
          <div className="relative shrink-0">
            <div
              aria-hidden="true"
              className="absolute -inset-[0.8cqw] rounded-full bg-emerald-500/30 blur-[1.5cqw] animate-ring-pulse motion-reduce:opacity-0"
            />
            <div className="relative size-[9.2cqw] rounded-[2.8cqw] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Check className="size-[5.6cqw] stroke-[3.5]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-[1.2cqw] text-[2.2cqw] font-bold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="size-[2.8cqw]" />
              <span>Discount Applied</span>
            </div>
            <p className="font-heading text-[5cqw] uppercase tracking-wide leading-none text-white mt-[0.5cqw]">
              15% OFF
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-[2.2cqw] py-[0.6cqw] text-[2.2cqw] font-bold font-mono text-emerald-300 shrink-0">
            -24.00 EGP
          </span>
        </div>

        {/* Details Receipt Card */}
        <div className="mt-[2.8cqw] rounded-[2.6cqw] bg-black/40 border border-white/10 p-[2.5cqw] text-[2.4cqw] space-y-[1.2cqw]">
          <div className="flex items-center justify-between text-white/70">
            <span className="font-medium">Store</span>
            <span className="font-bold text-white">Breadfast · Campus Branch</span>
          </div>
          <div className="flex items-center justify-between pt-[1cqw] border-t border-white/10">
            <span className="text-white/60 font-mono">Bill 160.00 EGP</span>
            <span className="font-mono font-bold text-emerald-400">Paid 136.00 EGP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
