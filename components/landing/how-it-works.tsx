"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { cn } from "cn";
import { BACK, CardFront, CardStage, VEIL, win } from "./how-it-works-stage";
import { lanyardHandoff, quadToMatrix3d, signedArea, type Quad } from "./lanyard-handoff";
import s from "./how-it-works.module.css";

const STEPS = [
  {
    title: "Sign in",
    body: "Sign in with your @nu.edu.eg Microsoft account. No new password, no sign-up form. Your SU Card is created for you on the spot.",
    /** Progress where this moment has fully played (rail jump target, still-frame for reduced motion). */
    at: 0.3,
    copy: { className: s.copyOut, style: win(0.29, 0.06) },
  },
  {
    title: "Collect & link",
    body: "Every card has its own unique QR, linked to your account. Add the digital pass to Google Wallet in a tap, or pick up a physical card at the SU office and scan it to link it.",
    at: 0.665,
    copy: { className: s.copyThrough, style: win(0.31, 0.42) },
  },
  {
    title: "Show & save",
    body: "Show the pass on your phone, or your physical card, at a partner. The cashier scans the QR and your student discount comes off the bill on the spot.",
    at: 1,
    copy: { className: s.copyIn, style: win(0.69, 0.07) },
  },
] as const;

const stepAt = (p: number) => (p < 0.34 ? 0 : p < 0.69 ? 1 : 2);

/** Size of the in-flight card box, in the artwork's proportions; matrix3d maps it onto any quad. */
const TRAVEL_W = 707;
const TRAVEL_H = 516;
/** Share of the flight over which the DOM card fades in over the WebGL one before that hides. */
const CROSSFADE = 0.04;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Carries the hero's 3D card down into the stage: between leaving the hero and the stage pinning,
 * a fixed DOM card is drawn on the corners of the WebGL card (snapshotted when it detaches, then
 * scrolled with the page) blended into the corners of the stage card, so both ends match exactly.
 */
function createHandoff(track: HTMLElement, travel: HTMLElement) {
  const box = travel.firstElementChild as HTMLElement;
  const part = (name: string) => travel.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
  const front = part("front");
  const back = part("back");
  const veil = part("veil");
  const sheen = part("sheen");
  const corners = Array.from(track.querySelectorAll<HTMLElement>("[data-corner]")).slice(0, 4);
  let snap: Quad | null = null; // hero card corners in document coordinates
  let mode = "";

  const setMode = (next: "attached" | "travel" | "landed" | "none") => {
    if (next === mode) return;
    mode = next;
    track.dataset.handoff = next;
    travel.style.display = next === "travel" ? "block" : "none";
    if (next !== "travel") lanyardHandoff.setDetached?.(next === "landed");
  };

  return (scrollY: number, landAt: number) => {
    const start = Math.max(1, landAt - window.innerHeight * 0.9);
    const t = (scrollY - start) / Math.max(1, landAt - start);
    if (t <= 0) {
      snap = null;
      return setMode("attached");
    }
    if (t >= 1) return setMode("landed");
    // Follow the live 3D card until it hides, then fly from where it was last seen.
    if (!snap || t <= CROSSFADE) {
      const seen = lanyardHandoff.probe?.();
      if (seen) snap = seen.map(([x, y]) => [x, y + scrollY]);
      else if (!snap) return setMode("none");
    }

    const e = easeInOut(t);
    const target = corners.map((c) => {
      const r = c.getBoundingClientRect();
      return [r.left, r.top];
    });
    let quad: Quad = snap.map(([x, y], i) => {
      const fromY = y - scrollY;
      return [x + (target[i][0] - x) * e, fromY + (target[i][1] - fromY) * e];
    });
    // Lift off: a little larger and turned mid-flight, settling exactly on both ends.
    const arc = Math.sin(Math.PI * e);
    const cx = quad.reduce((a, q) => a + q[0], 0) / 4;
    const cy = quad.reduce((a, q) => a + q[1], 0) / 4;
    const k = 1 + 0.07 * arc;
    const cos = Math.cos(-0.09 * arc);
    const sin = Math.sin(-0.09 * arc);
    quad = quad.map(([x, y]) => {
      const dx = (x - cx) * k;
      const dy = (y - cy) * k;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });

    box.style.transform = `matrix3d(${quadToMatrix3d(TRAVEL_W, TRAVEL_H, quad).join(",")})`;
    const facing = signedArea(quad) >= 0;
    front.style.visibility = facing ? "visible" : "hidden";
    back.style.visibility = facing ? "hidden" : "visible";
    veil.style.opacity = String(e);
    sheen.style.opacity = String(0.6 * e);
    travel.style.opacity = String(Math.min(1, t / CROSSFADE));
    setMode("travel");
    lanyardHandoff.setDetached?.(t > CROSSFADE);
  };
}

function Intro({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-heading text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.92] tracking-wide text-charcoal [text-wrap:balance] dark:text-white">
        From <span className="whitespace-nowrap">sign-in</span>{" "}
        <span className="text-brand dark:text-brand-soft">to savings</span>
      </h2>
      <p className="mt-3 hidden max-w-sm text-base leading-relaxed text-ash dark:text-zinc-300 md:block">
        One card, from your NU account to the checkout counter.
      </p>
    </div>
  );
}

/**
 * "How it works": one SU Card walked through three moments (sign in, collect & link, show & save).
 * A tall track pins the stage; scroll progress (--p) scrubs every layer, so scrolling back reverses it.
 * With reduced motion the three moments render as still frames instead.
 */
export function HowItWorks() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    const travel = travelRef.current;
    if (!track || !sticky || !travel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const handoff = createHandoff(track, travel);

    let raf = 0;
    let top = 0;
    let span = 1;
    let last = -1;

    const measure = () => {
      top = track.getBoundingClientRect().top + window.scrollY;
      span = Math.max(1, track.offsetHeight - sticky.offsetHeight);
    };
    const update = () => {
      raf = 0;
      handoff(window.scrollY, top);
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / span));
      if (p === last) return;
      last = p;
      track.style.setProperty("--p", p.toFixed(4));
      setStep(stepAt(p));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      last = -1;
      schedule();
    };

    measure();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    // Content above (the hero loads late) shifts the track, so watch the whole page height.
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      lanyardHandoff.setDetached?.(false);
    };
  }, []);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + STEPS[i].at * (track.offsetHeight - sticky.offsetHeight), behavior: "smooth" });
  };

  return (
    <section id="how-it-works" className="relative border-t border-border/70">
      {/* Scroll-driven version */}
      <div ref={trackRef} className="relative h-[270svh] md:h-[320svh] motion-reduce:hidden" style={{ "--p": 0 } as CSSProperties}>
        <div ref={stickyRef} className="sticky top-0 h-svh overflow-hidden">
          <div className="mx-auto flex h-full max-w-6xl flex-col px-4 pb-5 pt-[max(1.25rem,4svh)] sm:px-6 md:grid md:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] md:items-center md:gap-12 md:py-0 lg:gap-20 lg:px-8">
            <div className="contents md:block">
              <Intro className="order-1" />

              <nav aria-label="How it works steps" className="order-2 mt-4 md:mt-10">
                <ol className="grid grid-cols-3 gap-2 sm:gap-3">
                  {STEPS.map((item, i) => (
                    <li key={item.title}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={step === i ? "step" : undefined}
                        className="group flex min-h-11 w-full cursor-pointer flex-col justify-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background dark:focus-visible:ring-brand-soft"
                      >
                        <span className="block h-0.5 overflow-hidden rounded-full bg-charcoal/10 dark:bg-white/10">
                          <span className={cn(s.fill, "block h-full bg-brand dark:bg-brand-soft")} style={{ "--i": i } as CSSProperties} />
                        </span>
                        <span
                          className={cn(
                            "text-[0.8125rem] font-semibold leading-tight transition-colors duration-300 sm:text-sm",
                            step === i
                              ? "text-charcoal dark:text-white"
                              : "text-ash/70 group-hover:text-charcoal dark:text-zinc-500 dark:group-hover:text-zinc-200",
                          )}
                        >
                          {item.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              <ol className="order-4 grid md:mt-10">
                {STEPS.map((item) => (
                  <li key={item.title} className={cn(s.scrub, item.copy.className, "[grid-area:1/1]")} style={item.copy.style}>
                    <h3 className="font-heading text-[1.75rem] uppercase leading-none tracking-wide text-charcoal dark:text-white sm:text-4xl lg:text-5xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-ash dark:text-zinc-300 sm:mt-4 sm:text-base">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="order-3 my-3 flex min-h-0 flex-1 items-center [container-type:size] md:my-0 md:h-[min(82svh,640px)] md:flex-none">
              <CardStage className="mx-auto w-[min(100cqw,100cqh)]" />
            </div>
          </div>
        </div>
      </div>

      {/* The hero card in flight to the stage (see createHandoff) */}
      <div ref={travelRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-30 hidden">
        <div className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[3.2%/4.4%] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),0_2px_4px_rgb(6_20_40/0.22),0_16px_36px_-8px_rgb(6_20_40/0.35),0_48px_96px_-28px_rgb(15_48_86/0.45)]" style={{ width: TRAVEL_W, height: TRAVEL_H }}>
          <div data-part="front" className="absolute inset-0">
            <CardFront sizes="707px" eager />
            <div data-part="veil" className={cn(VEIL, "absolute inset-0 opacity-0")} />
            <div data-part="sheen" className={cn(s.sheen, "absolute inset-y-0 -left-1/2 w-[200%] -translate-x-[38%] opacity-0")} />
          </div>
          <div data-part="back" className="invisible absolute inset-0 -scale-x-100">
            <Image src={BACK} alt="" fill sizes="707px" loading="eager" className="object-cover" draggable={false} />
          </div>
        </div>
      </div>

      {/* Reduced motion: the three moments as still frames */}
      <div className="mx-auto hidden max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 motion-reduce:block">
        <Intro />
        <ol className="mt-12 space-y-14 md:space-y-20">
          {STEPS.map((item, i) => (
            <li key={item.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-16">
              <CardStage still={item.at} className={cn("mx-auto max-w-md", i % 2 === 1 && "md:order-2")} />
              <div>
                <h3 className="font-heading text-4xl uppercase leading-none tracking-wide text-charcoal dark:text-white lg:text-5xl">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ash dark:text-zinc-300">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
