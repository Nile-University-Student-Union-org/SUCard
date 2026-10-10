"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

export interface OverflowScrollerProps {
  children: React.ReactNode;
  className?: string;
  scrollerClassName?: string;
  scrollStep?: number;
  leftArrowLabel?: string;
  rightArrowLabel?: string;
  showGradients?: boolean;
  role?: string;
  ariaLabel?: string;
}

export const OverflowScroller = forwardRef<HTMLDivElement, OverflowScrollerProps>(
  (
    {
      children,
      className,
      scrollerClassName,
      scrollStep,
      leftArrowLabel = "Scroll left",
      rightArrowLabel = "Scroll right",
      showGradients = true,
      role,
      ariaLabel,
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

    const [hasOverflow, setHasOverflow] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollBounds = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      // Allow a 2px tolerance for fractional sub-pixel layout calculations
      const overflows = scrollWidth > clientWidth + 2;
      setHasOverflow(overflows);

      if (overflows) {
        setCanScrollLeft(scrollLeft > 4);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
      } else {
        setCanScrollLeft(false);
        setCanScrollRight(false);
      }
    }, []);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      checkScrollBounds();

      el.addEventListener("scroll", checkScrollBounds, { passive: true });
      window.addEventListener("resize", checkScrollBounds);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          checkScrollBounds();
        });
        resizeObserver.observe(el);
        if (el.firstElementChild) {
          resizeObserver.observe(el.firstElementChild);
        }
      }

      return () => {
        el.removeEventListener("scroll", checkScrollBounds);
        window.removeEventListener("resize", checkScrollBounds);
        resizeObserver?.disconnect();
      };
    }, [checkScrollBounds]);

    const handleScroll = (direction: "left" | "right") => {
      const el = internalRef.current;
      if (!el) return;

      const containerWidth = el.clientWidth;
      const step = scrollStep || Math.max(180, Math.floor(containerWidth * 0.7));
      const offset = direction === "left" ? -step : step;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollBy({ left: offset, behavior: reducedMotion ? "instant" : "smooth" });
    };

    // Arrows and fades overlay the edges instead of sitting in the flex row: mounting them in-flow
    // changed the scroller width mid-scroll, which re-triggered the bounds check and made the row jump.
    const arrowClass =
      "absolute top-1/2 -translate-y-1/2 z-20 flex size-11 rounded-[12px] border-2 border-slate-200 dark:border-zinc-800 text-charcoal dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:border-brand/60 dark:hover:border-brand-soft/60 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-brand dark:hover:text-white shadow-xs items-center justify-center cursor-pointer select-none transition-[opacity,transform,background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft active:scale-95 motion-reduce:transition-none";
    const fadeClass =
      "pointer-events-none absolute top-0 bottom-0 w-16 sm:w-20 z-10 transition-opacity duration-200 motion-reduce:transition-none";
    const showLeft = hasOverflow && canScrollLeft;
    const showRight = hasOverflow && canScrollRight;

    return (
      <div className={cn("relative", className)}>
        {showGradients && (
          <div
            aria-hidden="true"
            className={cn(fadeClass, "left-0 bg-gradient-to-r from-slate-50 dark:from-zinc-950 via-slate-50/70 dark:via-zinc-950/70 to-transparent", showLeft ? "opacity-100" : "opacity-0")}
          />
        )}
        <button
          onClick={() => handleScroll("left")}
          type="button"
          aria-label={leftArrowLabel}
          tabIndex={showLeft ? 0 : -1}
          aria-hidden={!showLeft}
          className={cn(arrowClass, "left-0", showLeft ? "opacity-100" : "opacity-0 pointer-events-none")}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div
          ref={internalRef}
          role={role}
          aria-label={ariaLabel}
          className={cn(
            "flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2.5 px-1 touch-pan-x",
            scrollerClassName,
          )}
        >
          {children}
        </div>

        {showGradients && (
          <div
            aria-hidden="true"
            className={cn(fadeClass, "right-0 bg-gradient-to-l from-slate-50 dark:from-zinc-950 via-slate-50/70 dark:via-zinc-950/70 to-transparent", showRight ? "opacity-100" : "opacity-0")}
          />
        )}
        <button
          onClick={() => handleScroll("right")}
          type="button"
          aria-label={rightArrowLabel}
          tabIndex={showRight ? 0 : -1}
          aria-hidden={!showRight}
          className={cn(arrowClass, "right-0", showRight ? "opacity-100" : "opacity-0 pointer-events-none")}
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    );
  },
);

OverflowScroller.displayName = "OverflowScroller";
