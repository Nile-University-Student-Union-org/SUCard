"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type UIEventHandler,
  type WheelEventHandler,
} from "react";
import { cn } from "cn";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function getTabScrollEdges({
  scrollLeft,
  scrollWidth,
  clientWidth,
  direction,
}: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  direction: string;
}) {
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const progress = Math.min(
    maxScroll,
    Math.max(0, direction === "rtl" ? -scrollLeft : scrollLeft),
  );
  const canScrollToStart = progress > 1;
  const canScrollToEnd = progress < maxScroll - 1;
  return direction === "rtl"
    ? { left: canScrollToEnd, right: canScrollToStart }
    : { left: canScrollToStart, right: canScrollToEnd };
}

export type TabBadgeTone = "brand" | "warning" | "danger" | "success";

export interface TabBarItem<Id extends string = string> {
  id: Id;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  badgeTone?: TabBadgeTone;
  disabled?: boolean;
  hidden?: boolean;
}

export interface TabBarProps<Id extends string = string> {
  items: TabBarItem<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  ariaLabel: string;
  panelIdPrefix?: string;
  fullWidth?: boolean;
  size?: "md" | "sm";
  className?: string;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onScroll?: UIEventHandler<HTMLDivElement>;
  onWheel?: WheelEventHandler<HTMLDivElement>;
}

const badgeTones: Record<TabBadgeTone, string> = {
  brand: "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-soft",
  warning: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  danger: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  success: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
};

export function TabBar<Id extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  panelIdPrefix,
  fullWidth,
  size = "md",
  className,
  scrollRef,
  onScroll,
  onWheel,
}: TabBarProps<Id>) {
  const localTabListRef = useRef<HTMLDivElement>(null);
  const tabListRef = scrollRef ?? localTabListRef;
  const indicator = useSlidingIndicator({
    containerRef: tabListRef,
    selectedSelector: '[aria-selected="true"]',
    value,
    items,
    size,
    fullWidth,
  });
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const visibleTabs = items.filter((tab) => !tab.hidden);
  const enabledTabs = visibleTabs.filter((tab) => !tab.disabled);
  const focusableId =
    enabledTabs.find((tab) => tab.id === value)?.id ?? enabledTabs[0]?.id;

  useEffect(() => {
    const container = tabListRef.current;
    if (!container) return;
    const measure = () => {
      const next = getTabScrollEdges({
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
        direction: getComputedStyle(container).direction,
      });
      setScrollEdges((previous) =>
        previous.left === next.left && previous.right === next.right
          ? previous
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container
      .querySelectorAll('[role="tab"]')
      .forEach((tab) => observer.observe(tab));
    container.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [items, size, fullWidth, tabListRef]);

  useEffect(() => {
    const selectedTab = tabListRef.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    selectedTab?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [value, items, tabListRef]);

  function scrollTabs(side: "left" | "right") {
    const container = tabListRef.current;
    if (!container) return;
    container.scrollBy({
      left: container.clientWidth * 0.8 * (side === "left" ? -1 : 1),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, id: Id) {
    if (!enabledTabs.length) return;
    const rtl =
      (event.currentTarget.closest("[dir]")?.getAttribute("dir") ??
        document.dir) === "rtl";
    const currentIndex = enabledTabs.findIndex((tab) => tab.id === id);
    let nextIndex: number;
    switch (event.key) {
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = enabledTabs.length - 1;
        break;
      case "ArrowRight":
        nextIndex =
          (currentIndex + (rtl ? -1 : 1) + enabledTabs.length) %
          enabledTabs.length;
        break;
      case "ArrowLeft":
        nextIndex =
          (currentIndex + (rtl ? 1 : -1) + enabledTabs.length) %
          enabledTabs.length;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    tabListRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [
        visibleTabs.findIndex((tab) => tab.id === nextTab.id)
      ]?.focus({ preventScroll: true });
    onChange(nextTab.id);
  }

  return (
    <div
      className={cn(
        "relative inline-flex max-w-full min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        fullWidth && "w-full",
        className,
      )}
    >
      <div
        ref={tabListRef}
        onScroll={onScroll}
        onWheel={onWheel}
        role="tablist"
        aria-label={ariaLabel}
        className="relative inline-flex max-w-full min-w-0 flex-1 gap-1 overflow-x-auto no-scrollbar rounded-2xl p-1 scroll-px-14 motion-reduce:scroll-auto"
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0 rounded-xl bg-brand shadow-xs motion-reduce:transition-none",
            indicator?.animate &&
              "transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            visibleTabs.find((tab) => tab.id === value)?.disabled &&
              "opacity-50",
          )}
          style={
            indicator
              ? {
                  transform: `translateX(${indicator.left}px)`,
                  top: indicator.top,
                  width: indicator.width,
                  height: indicator.height,
                }
              : { display: "none" }
          }
        />
        {visibleTabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={
                panelIdPrefix ? `${panelIdPrefix}-${tab.id}` : undefined
              }
              tabIndex={tab.id === focusableId ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => navigateTabs(event, tab.id)}
              className={cn(
                "relative z-[1] inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand dark:focus-visible:ring-brand-soft disabled:cursor-not-allowed disabled:opacity-50",
                size === "sm" ? "px-3 text-xs" : "px-3.5 text-sm",
                fullWidth && "grow",
                selected
                  ? "text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                selected && !indicator && "bg-brand shadow-xs",
              )}
            >
              {tab.icon && (
                <span
                  aria-hidden="true"
                  className="shrink-0 text-current [&>svg]:h-4 [&>svg]:w-4"
                >
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined &&
                tab.badge !== null &&
                tab.badge !== false &&
                tab.badge !== 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      selected
                        ? "bg-white/20 text-current"
                        : badgeTones[tab.badgeTone ?? "brand"],
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
            </button>
          );
        })}
      </div>
      {(["left", "right"] as const).map(
        (side) =>
          scrollEdges[side] && (
            <div
              key={side}
              className={cn(
                "pointer-events-none absolute inset-y-1 z-10 flex w-14 items-center from-white to-transparent dark:from-zinc-900",
                side === "left"
                  ? "left-1 justify-start bg-gradient-to-r"
                  : "right-1 justify-end bg-gradient-to-l",
              )}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                tabIndex={-1}
                aria-label={`Scroll tabs ${side}`}
                onClick={() => scrollTabs(side)}
                className="pointer-events-auto hidden rounded-full shadow-xs motion-reduce:transition-none sm:inline-flex"
              >
                {side === "left" ? (
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                )}
              </Button>
            </div>
          ),
      )}
    </div>
  );
}
