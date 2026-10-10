"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Store,
} from "lucide-react";
import type { PublicOffer } from "@/lib/vendors/public-offers";
import { OfferCard } from "@/components/offers/offer-card";
import { cn } from "cn";

interface OffersCarouselProps {
  offers: PublicOffer[];
  isUnavailable?: boolean;
}

/**
 * "Current offers": live partner discounts as an image-first carousel of 4:5 cards that snap as you swipe.
 * Scroll-snap, peek of next card on mobile, desktop arrows, progress/dot indicators, keyboard navigation,
 * reduced-motion safe, and no autoplay jank (autoplay off). Centered when 1-2 items.
 */
export function OffersCarousel({
  offers,
  isUnavailable = false,
}: OffersCarouselProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const trackRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({
    start: true,
    end: true,
    thumb: 1,
    at: 0,
    activeIndex: 0,
  });
  const [userAnnouncement, setUserAnnouncement] = useState<string>("");

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const tile = el.querySelector<HTMLElement>("[data-tile]");
    const tileWidth = tile
      ? tile.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0")
      : 1;
    const activeIndex = Math.min(
      offers.length - 1,
      Math.max(0, Math.round(el.scrollLeft / (tileWidth || 1)))
    );

    setScroll({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft >= max - 4,
      thumb: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
      at: max > 0 ? el.scrollLeft / max : 0,
      activeIndex,
    });
  }, [offers.length]);

  /** Moves by one card */
  const step = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      const tile = el?.querySelector<HTMLElement>("[data-tile]");
      if (!el || !tile) return;
      const by =
        tile.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

      el.scrollBy({ left: dir * by, behavior });
    },
    []
  );

  /** User-driven step navigation: announces the slide to screen readers */
  const handleUserStep = useCallback(
    (dir: 1 | -1) => {
      const nextIndex = Math.min(
        offers.length - 1,
        Math.max(0, scroll.activeIndex + dir)
      );
      const targetOffer = offers[nextIndex];
      if (targetOffer) {
        setUserAnnouncement(
          `Viewing offer ${nextIndex + 1} of ${offers.length}: ${
            targetOffer.vendorName
          }, ${targetOffer.discountLabel}`
        );
      }
      step(dir);
    },
    [offers, scroll.activeIndex, step]
  );

  const scrollToSlide = useCallback(
    (targetIndex: number) => {
      const el = trackRef.current;
      const tiles = el?.querySelectorAll<HTMLElement>("[data-tile]");
      if (!el || !tiles || !tiles[targetIndex]) return;
      const targetTile = tiles[targetIndex];
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

      el.scrollTo({ left: targetTile.offsetLeft - el.offsetLeft, behavior });

      const targetOffer = offers[targetIndex];
      if (targetOffer) {
        setUserAnnouncement(
          `Viewing offer ${targetIndex + 1} of ${offers.length}: ${
            targetOffer.vendorName
          }, ${targetOffer.discountLabel}`
        );
      }
    },
    [offers]
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el || isUnavailable || offers.length === 0) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [isUnavailable, measure, offers.length]);

  const overflowing = scroll.thumb < 0.999;

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <section
      aria-labelledby="offers-title"
      className="relative w-full max-w-7xl mx-auto py-12 sm:py-20"
    >
      {/* Screen Reader Live Region: announces on user-driven slide changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {userAnnouncement}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
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
            <span className="text-brand dark:text-brand-soft">
              partner spots
            </span>
          </h2>
          <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-ash dark:text-zinc-400">
            Live discounts for SU Card holders. Show your card at checkout.
          </p>
        </div>

        {/* Carousel controls: available on both mobile and desktop when overflowing */}
        {overflowing && !isUnavailable && offers.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs font-medium text-ash dark:text-zinc-400 tabular-nums sm:hidden mr-1">
              {scroll.activeIndex + 1} / {offers.length}
            </span>
            <ArrowButton
              label="Previous offer"
              disabled={scroll.start}
              onClick={() => handleUserStep(-1)}
            >
              <ChevronLeft className="size-5" />
            </ArrowButton>
            <ArrowButton
              label="Next offer"
              disabled={scroll.end}
              onClick={() => handleUserStep(1)}
            >
              <ChevronRight className="size-5" />
            </ArrowButton>
          </div>
        )}
      </div>

      {isUnavailable ? (
        /* Database / Service Outage State */
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 dark:border-amber-400/20 dark:bg-amber-400/5">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-heading text-lg uppercase tracking-wide text-charcoal dark:text-white">
                Offers temporarily unavailable
              </p>
              <p className="text-sm text-ash dark:text-zinc-400 mt-0.5">
                We&apos;re having trouble loading current partner discounts. Please check back shortly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isPending}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-tactile px-5 py-2.5 text-sm font-semibold text-brand dark:text-brand-soft border-2 border-brand/20 hover:border-brand/40 hover:bg-brand/10 dark:border-brand-soft/20 dark:hover:border-brand-soft/40 dark:hover:bg-brand-soft/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
            <span>{isPending ? "Refreshing…" : "Retry"}</span>
          </button>
        </div>
      ) : offers.length === 0 ? (
        /* Genuine Empty State */
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-8 flex items-center gap-4 rounded-3xl border border-dashed border-border bg-white/50 p-6 sm:p-8 dark:bg-white/[0.02]">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand dark:bg-brand-soft/15 dark:text-brand-soft">
            <Store className="size-5" />
          </span>
          <div>
            <p className="font-heading text-lg uppercase tracking-wide text-charcoal dark:text-white">
              New offers are on the way
            </p>
            <p className="text-sm text-ash dark:text-zinc-400 mt-0.5">
              We&apos;re signing up partners around campus. Check back soon.
            </p>
          </div>
        </div>
      ) : (
        /* Live Offers Carousel with 4:5 Promo Cards */
        <>
          <div
            ref={trackRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Current partner offers"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") handleUserStep(-1);
              if (e.key === "ArrowRight") handleUserStep(1);
              if (e.key === "Home") scrollToSlide(0);
              if (e.key === "End") scrollToSlide(offers.length - 1);
            }}
            className={cn(
              "mt-8 flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain",
              "px-4 sm:px-6 lg:px-8 scroll-px-4 sm:scroll-px-6 lg:scroll-px-8 pt-2 pb-8",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none focus-visible:ring-2 focus-visible:ring-macaw-blue/50 rounded-3xl",
              // Few offers (1-2): centre them; auto margins collapse once the row overflows.
              offers.length <= 2
                ? "justify-center"
                : "[&>*:first-child]:ml-auto [&>*:last-child]:mr-auto"
            )}
          >
            {offers.map((offer, i) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                variant="carousel"
                index={i}
                total={offers.length}
                sizes="(max-width: 640px) 76vw, 272px"
                priority={i === 0}
                lazy={i > 0}
              />
            ))}
          </div>

          {/* Progress Bar and Indicator */}
          {overflowing && (
            <div className="flex flex-col items-center gap-2">
              <div
                aria-hidden="true"
                className="mx-auto h-1 w-28 overflow-hidden rounded-full bg-border"
              >
                <span
                  className="block h-full rounded-full bg-brand dark:bg-brand-soft transition-transform duration-150"
                  style={{
                    width: `${scroll.thumb * 100}%`,
                    transform: `translateX(${
                      (scroll.at * (1 - scroll.thumb) * 100) / scroll.thumb
                    }%)`,
                  }}
                />
              </div>

              {/* Dots on mobile for direct slide jumping */}
              {offers.length <= 8 && (
                <div
                  className="flex sm:hidden items-center justify-center gap-1.5 pt-1"
                  aria-label="Carousel slide indicator"
                >
                  {offers.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollToSlide(idx)}
                      aria-label={`Go to offer ${idx + 1}`}
                      className={cn(
                        "size-2 rounded-full transition-all cursor-pointer min-h-0 min-w-0 p-0",
                        scroll.activeIndex === idx
                          ? "w-5 bg-brand dark:bg-brand-soft"
                          : "bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 min-h-[44px] min-w-[44px] place-items-center rounded-full bg-white/80 text-charcoal shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white hover:text-brand disabled:pointer-events-none disabled:opacity-35 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer select-none"
    >
      {children}
    </button>
  );
}
