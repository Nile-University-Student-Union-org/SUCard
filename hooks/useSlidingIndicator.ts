"use client";

import { useEffect, useState, type RefObject } from "react";

interface UseSlidingIndicatorProps {
  containerRef: RefObject<HTMLElement | null>;
  selectedSelector: string;
  value: unknown;
  items: unknown;
  size?: "md" | "sm";
  fullWidth?: boolean;
}

interface IndicatorState {
  left: number;
  top: number;
  width: number;
  height: number;
  animate: boolean;
}

export function useSlidingIndicator({
  containerRef,
  selectedSelector,
  value,
  items,
  size,
  fullWidth,
}: UseSlidingIndicatorProps): IndicatorState | null {
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const selectedEl = container.querySelector<HTMLElement>(selectedSelector);
      if (!selectedEl) {
        setIndicator(null);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const selectedRect = selectedEl.getBoundingClientRect();

      const left = selectedRect.left - containerRect.left + container.scrollLeft;
      const top = selectedRect.top - containerRect.top + container.scrollTop;
      const width = selectedRect.width;
      const height = selectedRect.height;

      setIndicator((prev) => {
        if (
          prev &&
          prev.left === left &&
          prev.top === top &&
          prev.width === width &&
          prev.height === height
        ) {
          return prev;
        }
        return {
          left,
          top,
          width,
          height,
          animate: prev !== null,
        };
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);

    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => resizeObserver.observe(btn));

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, selectedSelector, value, items, size, fullWidth]);

  return indicator;
}
