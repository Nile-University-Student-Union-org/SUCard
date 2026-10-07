"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, ScanLine, Store } from "lucide-react";
import { cn } from "cn";
import { GoogleWalletLogo } from "@/components/student/student-card-view";

const STEPS = [
  {
    title: "Sign in",
    body: "Use your NU Microsoft account. We confirm you're a student and make your card on the spot.",
  },
  {
    title: "Get your card",
    body: "Your SU Card lives on your phone. Add it to Google Wallet so it's one tap away.",
  },
  {
    title: "Show & save",
    body: "At a partner, show your QR. The cashier scans it and your student discount is applied.",
  },
] as const;

/**
 * "How it works": a sticky, scroll-driven walkthrough. The section is several screens tall;
 * while it scrolls past, the steps advance along their connector and the phone shows the matching screen.
 */
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  /** Connector through the step badges (px from the top of the list): its ends, and how far it is filled. */
  const [rail, setRail] = useState({ first: 0, last: 0, fill: 0 });

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
      const f = Math.min(STEPS.length - 1, Math.max(0, p * STEPS.length - 0.5));
      const i = Math.min(STEPS.length - 2, Math.floor(f));
      const at = centres[i] + (centres[i + 1] - centres[i]) * (f - i);
      const first = centres[0];
      const last = centres[STEPS.length - 1];
      setRail({ first, last, fill: at - first });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // The active step expands, which moves the badges below it: keep the connector on them.
    const observer = new ResizeObserver(schedule);
    if (listRef.current) observer.observe(listRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const active = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));

  /** Scrolls so step `i` sits in the middle of its slice of the section. */
  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / STEPS.length) * total, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative border-t border-border/80 h-[300vh]"
    >
      <div className="sticky top-0 h-svh flex items-center overflow-hidden">
        {/* Dot-grid texture, fading out toward the edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgb(15_48_86/0.13)_1px,transparent_1px)] dark:[background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_60%_50%,#000_20%,transparent_75%)]"
        />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-5 px-5 sm:px-8 md:grid-cols-[minmax(0,32rem)_auto] md:justify-center md:gap-16 lg:gap-28">
          {/* Copy */}
          <div>
            <p className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.22em] uppercase text-macaw-blue">
              <span aria-hidden="true" className="h-px w-6 bg-current" />
              How it works
            </p>
            <h2
              id="how-it-works-title"
              className="mt-3 font-heading uppercase tracking-wide leading-[0.95] text-charcoal dark:text-white text-[clamp(1.75rem,4.6vw,3.5rem)]"
            >
              Three steps
              <br /> to{" "}
              <span className="bg-gradient-to-r from-brand to-macaw-blue bg-clip-text text-transparent dark:from-brand-soft dark:to-macaw-blue">
                student savings
              </span>
            </h2>
            <p className="mt-4 max-w-md text-balance text-base leading-relaxed text-ash dark:text-zinc-400 max-md:hidden">
              From sign-in to checkout, everything happens on your phone.
            </p>

            {/* Desktop: steps as cards on a connector; the active one lifts and opens */}
            <ol ref={listRef} className="relative mt-8 hidden space-y-1.5 md:block">
              <li
                aria-hidden="true"
                className="absolute z-[1] left-[2.375rem] w-px -translate-x-1/2 bg-border"
                style={{ top: rail.first, height: Math.max(0, rail.last - rail.first) }}
              >
                <span className="absolute inset-x-0 top-0 bg-brand dark:bg-brand-soft" style={{ height: Math.max(0, rail.fill) }} />
              </li>
              {STEPS.map((step, i) => {
                const on = i === active;
                const done = i < active;
                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={on ? "step" : undefined}
                      className={cn(
                        "group relative flex w-full items-start gap-4 rounded-2xl px-5 py-4 text-left transition-[background-color,box-shadow] duration-500",
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
                          "relative z-10 mt-0.5 grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm tabular-nums transition-all duration-500",
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
                            "block font-heading uppercase tracking-wide text-2xl leading-none transition-colors duration-300",
                            on
                              ? "text-charcoal dark:text-white"
                              : "text-ash/60 dark:text-zinc-600 group-hover:text-ash dark:group-hover:text-zinc-400",
                          )}
                        >
                          {step.title}
                        </span>
                        <span
                          className={cn(
                            "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
                            on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <span className="overflow-hidden">
                            <span className="block pt-2 max-w-[40ch] text-[0.9375rem] leading-relaxed text-ash dark:text-zinc-400">
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

            {/* Mobile: story-style progress, then the active step crossfading in place */}
            <div className="md:hidden">
              <div aria-hidden="true" className="mt-4 flex gap-1.5">
                {STEPS.map((step, i) => (
                  <span key={step.title} className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="absolute inset-0 origin-left rounded-full bg-brand dark:bg-brand-soft"
                      style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress * STEPS.length - i))})` }}
                    />
                  </span>
                ))}
              </div>
              <div className="relative mt-3 h-[5.25rem]">
                {STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    aria-hidden={i !== active}
                    className={cn(
                      "absolute inset-x-0 top-0 transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]",
                      i === active
                        ? "opacity-100 translate-y-0 duration-500"
                        : cn("pointer-events-none opacity-0 duration-200", i < active ? "-translate-y-3" : "translate-y-3"),
                    )}
                    // The outgoing step clears first, then the new one rises in.
                    style={{ transitionDelay: i === active ? "160ms" : "0ms" }}
                  >
                    <p className="font-heading uppercase tracking-wide text-lg text-charcoal dark:text-white">
                      <span className="text-macaw-blue mr-2">0{i + 1}</span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ash dark:text-zinc-400">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phone on its stage */}
          <div className="relative flex justify-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute h-[78%] aspect-square rounded-full bg-gradient-to-br from-brand/30 via-macaw-blue/25 to-transparent blur-3xl dark:from-brand-soft/25" />
              <div className="absolute h-[104%] aspect-square rounded-full border border-brand/10 dark:border-white/[0.06]" />
              <div className="absolute h-[132%] aspect-square rounded-full border border-brand/[0.07] dark:border-white/[0.04]" />
            </div>
            <div className="relative">
              <div className="motion-safe:animate-[phone-float_7s_ease-in-out_infinite]">
                <Phone active={active} />
              </div>
              {/* Contact shadow */}
              <div
                aria-hidden="true"
                className="absolute -bottom-6 left-1/2 h-5 w-[70%] -translate-x-1/2 rounded-[50%] bg-[rgb(15_48_86/0.28)] blur-xl dark:bg-black/60"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Phone({ active }: { active: number }) {
  return (
    <div aria-hidden="true" className="relative h-[min(540px,52svh)] md:h-[min(640px,78svh)] aspect-[9/19.2]">
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-[18%] h-[7%] w-[3px] rounded-l bg-zinc-500 dark:bg-zinc-700" />
      <span className="absolute -left-[3px] top-[28%] h-[11%] w-[3px] rounded-l bg-zinc-500 dark:bg-zinc-700" />
      <span className="absolute -right-[3px] top-[24%] h-[14%] w-[3px] rounded-r bg-zinc-500 dark:bg-zinc-700" />

      {/* Titanium frame */}
      <div className="absolute inset-0 rounded-[17%/8%] bg-gradient-to-br from-zinc-400 via-zinc-700 to-zinc-900 p-[2.5%] shadow-[0_40px_80px_-30px_rgb(15_48_86/0.6),0_20px_40px_-20px_rgb(0_0_0/0.5)]">
        <div className="relative size-full overflow-hidden rounded-[15%/7%] bg-black p-[1.2%]">
          {/* Screen */}
          <div className="@container relative size-full overflow-hidden rounded-[14%/6.5%] bg-[#06121F] text-white">
            {/* Ambient light on the screen */}
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

            {/* Screens, laid out left to right like app navigation */}
            <div className="absolute inset-0 top-[11cqw]">
              <Screen index={0} active={active}>
                <SignInScreen on={active === 0} />
              </Screen>
              <Screen index={1} active={active}>
                <CardScreen on={active === 1} />
              </Screen>
              <Screen index={2} active={active}>
                <ScanScreen on={active === 2} />
              </Screen>

              {/* One card shared by the sign-in and card screens, so it morphs from one into the other */}
              <div
                className="pointer-events-none absolute left-[6cqw] top-[19cqw] z-10 w-[88cqw] will-change-transform transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={CARD_POSES[active]}
              >
                <MiniCard />
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-[2.4cqw] left-1/2 z-30 h-[1.2cqw] w-[34cqw] -translate-x-1/2 rounded-full bg-white/80" />
          </div>
        </div>
      </div>

      {/* Glass reflection across the frame */}
      <div className="pointer-events-none absolute inset-0 rounded-[17%/8%] bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.10]" />
    </div>
  );
}

/** Shared card pose per step: tilted hero on sign-in, in place on "My card", tucked away at checkout. */
const CARD_POSES: React.CSSProperties[] = [
  { transform: "translateY(22cqw) rotate(-7deg) scale(0.8)", opacity: 1 },
  { transform: "none", opacity: 1 },
  // Leaves quickly, so it never sits over the incoming checkout screen.
  {
    transform: "translateX(-16cqw) scale(0.94)",
    opacity: 0,
    transition: "transform 650ms cubic-bezier(0.22,1,0.36,1), opacity 180ms ease-out",
  },
];

const EASE_OUT = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Earlier screens wait off to the left, later ones to the right; only transform and opacity animate. */
function Screen({ index, active, children }: { index: number; active: number; children: React.ReactNode }) {
  const offset = Math.sign(index - active);
  return (
    <div
      aria-hidden={offset !== 0}
      className={cn(
        "absolute inset-0 will-change-transform transition-[opacity,transform] duration-[650ms]",
        EASE_OUT,
        offset === 0 ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={{ transform: `translateX(${offset * 16}cqw)` }}
    >
      {children}
    </div>
  );
}

/** Staggered entrance for a screen's parts: rises in after `delay` ms when its screen arrives. */
function rise(on: boolean, delay: number) {
  return {
    className: cn(
      "transition-[opacity,transform] duration-500",
      EASE_OUT,
      on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[3cqw]",
    ),
    style: { transitionDelay: on ? `${delay}ms` : "0ms" },
  };
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className}>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function SignInScreen({ on }: { on: boolean }) {
  const title = rise(on, 220);
  const sub = rise(on, 280);
  const cta = rise(on, 360);
  return (
    <div className="relative h-full px-[9cqw] text-center">
      {/* Glow behind the shared card */}
      <div className="absolute left-1/2 top-[69cqw] size-[60cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-macaw-blue/35 blur-[12cqw]" />
      <div className="absolute inset-x-[9cqw] top-[106cqw]">
        <p className={cn("font-heading text-[8cqw] uppercase leading-none tracking-wide", title.className)} style={title.style}>
          Welcome
        </p>
        <p className={cn("mt-[2.5cqw] text-[3.6cqw] leading-snug text-white/55", sub.className)} style={sub.style}>
          Sign in to get your student card
        </p>
      </div>

      <div className={cn("absolute inset-x-[9cqw] top-[134cqw]", cta.className)} style={cta.style}>
        <span
          className={cn(
            "absolute -inset-[1.4cqw] rounded-[4.5cqw] bg-macaw-blue/40 blur-[3cqw]",
            on ? "motion-safe:animate-pulse" : "opacity-0",
          )}
        />
        <div className="relative flex items-center justify-center gap-[2.5cqw] rounded-[3.5cqw] bg-white py-[4cqw] text-[3.9cqw] font-semibold text-[#1f1f1f] shadow-lg">
          <MicrosoftLogo className="w-[4.2cqw]" />
          Sign in with Microsoft
        </div>
        <p className="mt-[3.5cqw] text-[3.2cqw] text-white/55">Use your NU email</p>
      </div>
    </div>
  );
}

function useDemoQr() {
  return useMemo(() => {
    const qr = QRCode.create("NUSU1:DEMO0000000000000000", { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
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

function MiniCard() {
  return (
    <div className="relative aspect-[1.585/1] w-full overflow-hidden rounded-[4cqw] bg-gradient-to-br from-[#16477A] via-[#0F3056] to-[#0A2140] p-[5cqw] ring-1 ring-inset ring-white/15 shadow-[0_6cqw_12cqw_-6cqw_rgb(0_0_0/0.8)]">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
      <div className="absolute left-0 top-[34%] h-[1.2cqw] w-[45%] bg-gradient-to-r from-macaw-blue to-transparent" />
      <div className="relative flex h-full flex-col justify-between">
        <Image src="/brand/su-logo-white@hd.png" alt="" width={120} height={36} className="h-[6cqw] w-auto self-start" />
        <div>
          <p className="font-heading text-[9cqw] uppercase leading-none tracking-wide">SU Card</p>
          <span className="mt-[2cqw] inline-block rounded-full bg-macaw-blue px-[2.6cqw] py-[0.6cqw] text-[2.6cqw] font-bold tracking-wider">
            STUDENT
          </span>
        </div>
      </div>
    </div>
  );
}

function CardScreen({ on }: { on: boolean }) {
  const head = rise(on, 0);
  const qr = rise(on, 260);
  const wallet = rise(on, 380);
  return (
    <div className="flex h-full flex-col px-[6cqw] pt-[5cqw]">
      <div className={cn("flex h-[9cqw] items-center justify-between", head.className)} style={head.style}>
        <p className="font-heading text-[6.4cqw] uppercase leading-none tracking-wide">My card</p>
        <span className="flex size-[8cqw] items-center justify-center rounded-full bg-white/10 text-[3.4cqw] font-semibold">
          S
        </span>
      </div>
      {/* Slot the shared card lands in */}
      <div className="mt-[5cqw] aspect-[1.585/1] w-full" />
      <div className={cn("flex flex-1 flex-col items-center justify-center", qr.className)} style={qr.style}>
        <div className="rounded-[4cqw] bg-white p-[3cqw] shadow-[0_4cqw_10cqw_-4cqw_rgb(0_0_0/0.6)]">
          <DemoQr className="block w-[44cqw]" />
        </div>
        <p className="mt-[3cqw] text-[3.2cqw] text-white/55">Show this at partner stores</p>
      </div>
      <div
        className={cn(
          "mb-[10cqw] flex items-center justify-center gap-[2.4cqw] rounded-full bg-black py-[3.6cqw] text-[3.6cqw] font-semibold ring-1 ring-white/20",
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

function ScanScreen({ on }: { on: boolean }) {
  const head = rise(on, 0);
  const store = rise(on, 140);
  const qr = rise(on, 260);
  return (
    <div className="relative flex h-full flex-col items-center px-[6cqw] pt-[5cqw]">
      <div className={cn("self-start", head.className)} style={head.style}>
        <p className="font-heading text-[6.4cqw] uppercase tracking-wide">Checkout</p>
        <p className="mt-[1cqw] text-[3.2cqw] text-white/55">Hold your phone up to the cashier</p>
      </div>

      {/* Where you are */}
      <div
        className={cn(
          "mt-[5cqw] flex w-full items-center gap-[3cqw] rounded-[4cqw] bg-white/[0.06] p-[3cqw] ring-1 ring-inset ring-white/10",
          store.className,
        )}
        style={store.style}
      >
        <span className="flex size-[10cqw] shrink-0 items-center justify-center rounded-[3cqw] bg-macaw-blue/20 text-macaw-blue">
          <Store className="size-[5cqw]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[3.6cqw] font-semibold leading-tight">Partner store</p>
          <p className="text-[3cqw] text-white/50">Student offer available</p>
        </div>
        <span className="rounded-full bg-macaw-blue px-[2.6cqw] py-[1cqw] text-[2.6cqw] font-bold tracking-wider">NUSU</span>
      </div>

      {/* QR with a scanning beam, centred in the space above the result sheet */}
      <div className={cn("flex w-full flex-1 flex-col items-center justify-center pb-[26cqw]", qr.className)} style={qr.style}>
        <div className="relative rounded-[5cqw] bg-white p-[4cqw] shadow-[0_0_0_1.6cqw_rgb(1_139_206/0.25),0_6cqw_14cqw_-6cqw_rgb(0_0_0/0.7)]">
          <DemoQr className="block w-[56cqw]" />
          <div className="absolute inset-[4cqw] overflow-hidden">
            <div
              className={cn(
                "absolute inset-x-0 h-[14cqw] bg-gradient-to-b from-transparent via-macaw-blue/35 to-macaw-blue/0 border-b-2 border-macaw-blue",
                on ? "motion-safe:animate-[scan-beam_1.6s_ease-in-out_infinite]" : "opacity-0",
              )}
            />
          </div>
          {/* Viewfinder corners */}
          {["left-0 top-0 border-l-2 border-t-2 rounded-tl-[3cqw]", "right-0 top-0 border-r-2 border-t-2 rounded-tr-[3cqw]", "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-[3cqw]", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-[3cqw]"].map((c) => (
            <span key={c} className={cn("absolute -m-[3cqw] size-[8cqw] border-macaw-blue", c)} />
          ))}
        </div>
        <p
          className={cn(
            "mt-[6cqw] flex items-center gap-[1.6cqw] text-[3.4cqw] text-white/60 transition-opacity duration-300",
            on && "opacity-0 delay-[1200ms]",
          )}
        >
          <ScanLine className="size-[4cqw]" /> Scanning…
        </p>
      </div>

      {/* Success sheet slides up once the scan "lands" */}
      <div
        className={cn(
          "absolute inset-x-[4cqw] bottom-[8cqw] rounded-[6cqw] bg-white p-[5cqw] text-[#0F3056] shadow-[0_-4cqw_16cqw_-4cqw_rgb(0_0_0/0.6)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          on ? "opacity-100 translate-y-0 delay-[1200ms]" : "opacity-0 translate-y-[12cqw] delay-0",
        )}
      >
        <div className="flex items-center gap-[3.5cqw]">
          <span className="flex size-[11cqw] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="size-[6cqw]" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-[5.4cqw] uppercase leading-none tracking-wide">Verified</p>
            <p className="mt-[1.2cqw] text-[3.2cqw] text-[#0F3056]/65">Student discount applied</p>
          </div>
        </div>
      </div>
    </div>
  );
}
