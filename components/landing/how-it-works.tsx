"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, ScanLine } from "lucide-react";
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
 * while it scrolls past, the step list fills its rail and the phone shows the matching screen.
 */
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
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
        {/* Glow behind the phone */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-1/2 -translate-y-1/2 size-[36rem] max-md:left-1/2 max-md:right-auto max-md:top-[68%] max-md:-translate-x-1/2 rounded-full bg-macaw-blue/10 dark:bg-macaw-blue/15 blur-[110px]"
        />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-20">
          {/* Copy */}
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-macaw-blue">How it works</p>
            <h2
              id="how-it-works-title"
              className="mt-3 font-heading uppercase tracking-wide leading-[0.95] text-charcoal dark:text-white text-[clamp(1.75rem,5vw,3.75rem)]"
            >
              Three steps
              <br className="max-md:hidden" /> to student savings
            </h2>

            {/* Desktop: step list with a progress rail; the active step expands */}
            <div className="relative mt-10 hidden pl-8 md:block">
              <div aria-hidden="true" className="absolute inset-y-0 left-1 w-px bg-border">
                <span
                  className="absolute inset-x-0 top-0 h-full origin-top bg-brand dark:bg-brand-soft"
                  style={{ transform: `scaleY(${progress})` }}
                />
                <span
                  className="absolute -left-[4.5px] size-2.5 -translate-y-1/2 rounded-full bg-brand dark:bg-brand-soft ring-4 ring-brand/15 dark:ring-brand-soft/20"
                  style={{ top: `${progress * 100}%` }}
                />
              </div>
              <ol>
                {STEPS.map((step, i) => {
                  const on = i === active;
                  return (
                    <li key={step.title} className="border-t border-border/70 last:border-b">
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={on ? "step" : undefined}
                        className="group w-full py-5 text-left"
                      >
                        <span className="flex items-baseline gap-4">
                          <span
                            className={cn(
                              "font-heading text-sm tabular-nums transition-colors duration-300",
                              on ? "text-macaw-blue" : "text-ash/60 dark:text-zinc-600",
                            )}
                          >
                            0{i + 1}
                          </span>
                          <span
                            className={cn(
                              "font-heading uppercase tracking-wide text-2xl transition-colors duration-300",
                              on
                                ? "text-charcoal dark:text-white"
                                : "text-ash/60 dark:text-zinc-600 group-hover:text-ash dark:group-hover:text-zinc-400",
                            )}
                          >
                            {step.title}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
                            on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <span className="overflow-hidden">
                            <span className="block pl-9 pt-2 max-w-[40ch] text-[0.9375rem] leading-relaxed text-ash dark:text-zinc-400">
                              {step.body}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Mobile: the active step crossfades in place, with a progress bar */}
            <div className="md:hidden">
              <div className="relative mt-4 h-[5.75rem]">
                {STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    aria-hidden={i !== active}
                    className={cn(
                      "absolute inset-x-0 top-0 transition-[opacity,transform] duration-500",
                      i === active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
                    )}
                  >
                    <p className="font-heading uppercase tracking-wide text-lg text-charcoal dark:text-white">
                      <span className="text-macaw-blue mr-2">0{i + 1}</span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ash dark:text-zinc-400">{step.body}</p>
                  </div>
                ))}
              </div>
              <div aria-hidden="true" className="relative h-px bg-border">
                <span
                  className="absolute inset-0 origin-left bg-brand dark:bg-brand-soft"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex justify-center">
            <Phone active={active} />
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

            {/* Screens */}
            <div className="absolute inset-0 top-[11cqw]">
              <Screen on={active === 0}>
                <SignInScreen on={active === 0} />
              </Screen>
              <Screen on={active === 1}>
                <CardScreen />
              </Screen>
              <Screen on={active === 2}>
                <ScanScreen on={active === 2} />
              </Screen>
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

function Screen({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        on ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-[4cqw] scale-[0.97] blur-[1px] pointer-events-none",
      )}
    >
      {children}
    </div>
  );
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
  return (
    <div className="flex h-full flex-col items-center px-[9cqw] pt-[24cqw] text-center">
      <Image src="/brand/su-icon-white@hd.png" alt="" width={96} height={96} className="w-[22cqw] h-auto" />
      <p className="mt-[6cqw] font-heading text-[12cqw] uppercase leading-none tracking-wide">SU Card</p>
      <p className="mt-[2.5cqw] text-[3.6cqw] text-white/55">Nile University Student Union</p>

      <div className="relative mt-auto mb-[26cqw] w-full">
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
        <p className="mt-[3.5cqw] text-[3.2cqw] text-white/45">Use your NU email</p>
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

function CardScreen() {
  return (
    <div className="flex h-full flex-col px-[6cqw] pt-[5cqw]">
      <div className="flex items-center justify-between">
        <p className="font-heading text-[6.4cqw] uppercase tracking-wide">My card</p>
        <span className="flex size-[8cqw] items-center justify-center rounded-full bg-white/10 text-[3.4cqw] font-semibold">
          S
        </span>
      </div>
      <div className="mt-[5cqw]">
        <MiniCard />
      </div>
      <div className="mt-[6cqw] flex flex-col items-center">
        <div className="rounded-[4cqw] bg-white p-[3cqw] shadow-[0_4cqw_10cqw_-4cqw_rgb(0_0_0/0.6)]">
          <DemoQr className="block w-[44cqw]" />
        </div>
        <p className="mt-[3cqw] text-[3.2cqw] text-white/55">Show this at partner stores</p>
      </div>
      <div className="mt-auto mb-[10cqw] flex items-center justify-center gap-[2.4cqw] rounded-full bg-black py-[3.6cqw] text-[3.6cqw] font-semibold ring-1 ring-white/20">
        <GoogleWalletLogo className="w-[5cqw] h-auto" />
        Add to Google Wallet
      </div>
    </div>
  );
}

function ScanScreen({ on }: { on: boolean }) {
  return (
    <div className="relative flex h-full flex-col items-center px-[6cqw] pt-[5cqw]">
      <p className="self-start font-heading text-[6.4cqw] uppercase tracking-wide">Checkout</p>
      <p className="self-start mt-[1cqw] text-[3.2cqw] text-white/55">Hold your phone up to the cashier</p>

      {/* QR with a scanning beam */}
      <div className="relative mt-[9cqw] rounded-[5cqw] bg-white p-[4cqw] shadow-[0_0_0_1.6cqw_rgb(1_139_206/0.25),0_6cqw_14cqw_-6cqw_rgb(0_0_0/0.7)]">
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
