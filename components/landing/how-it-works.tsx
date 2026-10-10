"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "cn";
import { CardStage, win } from "./how-it-works-stage";
import s from "./how-it-works.module.css";

const STEPS = [
  {
    title: "Sign in",
    body: "Use your @nu.edu.eg Microsoft account. No new password, no sign-up form. Your name and university ID go straight onto your card.",
    /** Progress where this moment has fully played (rail jump target, still-frame for reduced motion). */
    at: 0.3,
    copy: { className: s.copyOut, style: win(0.29, 0.06) },
  },
  {
    title: "Collect & link",
    body: "Get the digital pass instantly and add it to Google Wallet. Prefer a physical card? Pick it up at the SU office and scan its QR to link it to you.",
    at: 0.64,
    copy: { className: s.copyThrough, style: win(0.31, 0.37) },
  },
  {
    title: "Show & save",
    body: "Show your card's QR at a partner. The cashier scans it and your student discount comes off the bill on the spot.",
    at: 1,
    copy: { className: s.copyIn, style: win(0.65, 0.07) },
  },
] as const;

const stepAt = (p: number) => (p < 0.34 ? 0 : p < 0.66 ? 1 : 2);

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
  const [step, setStep] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      <div ref={trackRef} className="relative h-[250svh] md:h-[300svh] motion-reduce:hidden" style={{ "--p": 0 } as CSSProperties}>
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
