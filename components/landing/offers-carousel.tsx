"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { BookOpen, Briefcase, ChevronLeft, ChevronRight, Coffee, Dumbbell, ScanLine, Store, Utensils, type LucideIcon } from "lucide-react";
import type { PublicOffer } from "@/lib/vendors/public-offers";
import type { VendorCategory } from "@/lib/vendors/types";
import { cn } from "cn";

const CATEGORY: Record<VendorCategory, { label: string; icon: LucideIcon; glow: string }> = {
  food: { label: "Food", icon: Utensils, glow: "#F59E0B" },
  coffee: { label: "Coffee", icon: Coffee, glow: "#D6A26B" },
  fitness: { label: "Fitness", icon: Dumbbell, glow: "#34D399" },
  books: { label: "Books", icon: BookOpen, glow: "#A78BFA" },
  services: { label: "Services", icon: Briefcase, glow: "#38BDF8" },
  other: { label: "Partner", icon: Store, glow: "#5B9BE6" },
};

const AUTOPLAY_MS = 5000;

/**
 * "Current offers": live partner discounts as a row of card-shaped tiles that snap as you swipe.
 * Arrows and a progress thumb on wider screens; advances on its own until someone interacts.
 */
export function OffersCarousel({ offers }: { offers: PublicOffer[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ start: true, end: true, thumb: 1, at: 0 });
  const paused = useRef(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScroll({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft >= max - 2,
      thumb: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
      at: max > 0 ? el.scrollLeft / max : 0,
    });
  }, []);

  /** Moves by one tile (or wraps to the start from the end). */
  const step = useCallback((dir: 1 | -1, wrap = false) => {
    const el = trackRef.current;
    const tile = el?.querySelector<HTMLElement>("[data-tile]");
    if (!el || !tile) return;
    const by = tile.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    if (wrap && dir === 1 && el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * by, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = reduced
      ? 0
      : window.setInterval(() => {
          if (!paused.current && !document.hidden && el.scrollWidth > el.clientWidth + 2) step(1, true);
        }, AUTOPLAY_MS);
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
      window.clearInterval(timer);
    };
  }, [measure, step]);

  const overflowing = scroll.thumb < 0.999;
  const stop = () => (paused.current = true);

  return (
    <section aria-labelledby="offers-title" className="relative w-full max-w-7xl mx-auto py-14 sm:py-20">
      <div className="flex items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.22em] uppercase text-macaw-blue">
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            Current offers
          </p>
          <h2
            id="offers-title"
            className="mt-3 font-heading uppercase tracking-wide leading-[0.95] text-charcoal dark:text-white text-[clamp(1.75rem,4.6vw,3.5rem)]"
          >
            Save at{" "}
            <span className="bg-gradient-to-r from-brand to-macaw-blue bg-clip-text text-transparent dark:from-brand-soft dark:to-macaw-blue">
              partner spots
            </span>
          </h2>
          <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-ash dark:text-zinc-400">
            Live discounts for SU Card holders. Show your card at checkout.
          </p>
        </div>

        {overflowing && (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <ArrowButton label="Previous offers" disabled={scroll.start} onClick={() => (stop(), step(-1))}>
              <ChevronLeft className="size-5" />
            </ArrowButton>
            <ArrowButton label="Next offers" disabled={scroll.end} onClick={() => (stop(), step(1))}>
              <ChevronRight className="size-5" />
            </ArrowButton>
          </div>
        )}
      </div>

      {offers.length === 0 ? (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-8 flex items-center gap-4 rounded-3xl border border-dashed border-border bg-white/50 p-6 sm:p-8 dark:bg-white/[0.02]">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand dark:bg-brand-soft/15 dark:text-brand-soft">
            <Store className="size-5" />
          </span>
          <div>
            <p className="font-heading text-lg uppercase tracking-wide text-charcoal dark:text-white">New offers are on the way</p>
            <p className="text-sm text-ash dark:text-zinc-400">We&apos;re signing up partners around campus. Check back soon.</p>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={trackRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Current partner offers"
            tabIndex={0}
            onPointerDown={stop}
            onWheel={stop}
            onKeyDown={stop}
            onMouseEnter={() => (paused.current = true)}
            onFocus={stop}
            className={cn(
              "mt-8 flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain",
              "px-4 sm:px-6 lg:px-8 scroll-px-4 sm:scroll-px-6 lg:scroll-px-8 pt-2 pb-8",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none focus-visible:ring-2 focus-visible:ring-macaw-blue/50 rounded-3xl",
              // Few offers: centre them; auto margins collapse once the row overflows.
              "[&>*:first-child]:ml-auto [&>*:last-child]:mr-auto",
            )}
          >
            {offers.map((offer, i) => (
              <OfferTile key={offer.id} offer={offer} index={i} total={offers.length} />
            ))}
          </div>

          {overflowing && (
            <div aria-hidden="true" className="mx-auto h-1 w-28 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-brand dark:bg-brand-soft"
                style={{
                  width: `${scroll.thumb * 100}%`,
                  transform: `translateX(${(scroll.at * (1 - scroll.thumb) * 100) / scroll.thumb}%)`,
                }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function OfferTile({ offer, index, total }: { offer: PublicOffer; index: number; total: number }) {
  const meta = CATEGORY[offer.category];
  const Icon = meta.icon;
  const long = offer.discountLabel.length > 14;
  const showTitle = offer.title.trim().toLowerCase() !== offer.discountLabel.trim().toLowerCase();

  return (
    <article
      data-tile
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${offer.vendorName}, ${offer.discountLabel}`}
      style={{ "--glow": meta.glow } as CSSProperties}
      className={cn(
        "group relative isolate flex h-[12.5rem] w-[72%] max-w-[17rem] shrink-0 snap-start flex-col overflow-hidden rounded-[1.25rem] p-4 sm:h-[13.5rem] sm:w-[17rem] sm:p-5",
        "bg-gradient-to-br from-[#0F548D] via-[#0F3056] to-[#0A1E38] text-white ring-1 ring-inset ring-white/10",
        "shadow-[0_22px_44px_-22px_rgb(15_48_86/0.65)] dark:shadow-[0_22px_44px_-22px_rgb(0_0_0/0.9)]",
        "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1.5",
      )}
    >
      {/* Category glow, dot texture and a clearcoat highlight */}
      <span aria-hidden="true" className="absolute -right-10 -top-14 -z-10 size-48 rounded-full bg-[var(--glow)] opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-45" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom_left,#000,transparent_70%)]"
      />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent" />
      {/* Sheen that sweeps across on hover */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span className="absolute inset-y-0 -left-1/3 w-1/3 -translate-x-[160%] bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 motion-safe:group-hover:animate-[card-sheen_1.6s_ease-out]" />
      </span>

      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-brand shadow-md ring-1 ring-black/5">
          {offer.logoUrl ? (
            <Image src={offer.logoUrl} alt="" width={40} height={40} unoptimized className="size-full object-contain p-1" />
          ) : (
            <Icon className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold leading-tight">{offer.vendorName}</p>
          <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">{meta.label}</p>
        </div>
      </div>

      <div className="mt-auto">
        <p
          className={cn(
            "font-heading uppercase leading-[0.92] tracking-wide line-clamp-2 drop-shadow-sm",
            long ? "text-[1.45rem] sm:text-[1.6rem]" : "text-[2.2rem] sm:text-[2.45rem]",
          )}
        >
          {offer.discountLabel}
        </p>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-white/65">{showTitle ? offer.title : "With your SU Card"}</p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
            <ScanLine className="size-3" />
            SU Card
          </span>
        </div>
      </div>
    </article>
  );
}

function ArrowButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full bg-white/80 text-charcoal shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white hover:text-brand disabled:pointer-events-none disabled:opacity-35 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:hover:bg-white/[0.08]"
    >
      {children}
    </button>
  );
}
