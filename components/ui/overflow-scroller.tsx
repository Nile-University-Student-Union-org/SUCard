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

      el.scrollBy({ left: offset, behavior: "smooth" });
      setTimeout(checkScrollBounds, 350);
    };

    return (
      <div
        className={cn("relative flex items-center gap-2 sm:gap-2.5", className)}
      >
        {/* Left Scroll Button */}
        {hasOverflow && canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            type="button"
            aria-label={leftArrowLabel}
            className="flex w-11 h-11 min-h-[44px] min-w-[44px] rounded-[12px] 
                       border-2 border-slate-200 dark:border-zinc-800 
                       text-charcoal dark:text-zinc-200 bg-white dark:bg-zinc-900 
                       hover:border-brand/60 dark:hover:border-brand-soft/60 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-brand dark:hover:text-white 
                       shadow-xs items-center justify-center transition-all shrink-0 cursor-pointer select-none
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft focus-visible:ring-offset-2
                       active:scale-95 animate-in fade-in-0 duration-200"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Scroll Container with Gradients */}
        <div className="relative flex-1 min-w-0">
          {/* Left Gradient Cue */}
          {showGradients && hasOverflow && canScrollLeft && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-slate-50/95 dark:from-zinc-950/95 via-slate-50/50 dark:via-zinc-950/50 to-transparent z-10 transition-opacity duration-200"
            />
          )}

          <div
            ref={internalRef}
            role={role}
            aria-label={ariaLabel}
            className={cn(
              "flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2.5 px-1 scroll-smooth touch-pan-x",
              scrollerClassName,
            )}
          >
            {children}
          </div>

          {/* Right Gradient Cue */}
          {showGradients && hasOverflow && canScrollRight && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-slate-50/95 dark:from-zinc-950/95 via-slate-50/50 dark:via-zinc-950/50 to-transparent z-10 transition-opacity duration-200"
            />
          )}
        </div>

        {/* Right Scroll Button */}
        {hasOverflow && canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            type="button"
            aria-label={rightArrowLabel}
            className="flex w-11 h-11 min-h-[44px] min-w-[44px] rounded-[12px] 
                       border-2 border-slate-200 dark:border-zinc-800 
                       text-charcoal dark:text-zinc-200 bg-white dark:bg-zinc-900 
                       hover:border-brand/60 dark:hover:border-brand-soft/60 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-brand dark:hover:text-white 
                       shadow-xs items-center justify-center transition-all shrink-0 cursor-pointer select-none
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:focus-visible:ring-brand-soft focus-visible:ring-offset-2
                       active:scale-95 animate-in fade-in-0 duration-200"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>
    );
  },
);

OverflowScroller.displayName = "OverflowScroller";
