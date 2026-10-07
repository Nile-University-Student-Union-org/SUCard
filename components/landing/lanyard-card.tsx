"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import { StaticCard } from "./static-card";
import { LanyardSkeleton } from "./lanyard-skeleton";

const LanyardHeroDynamic = dynamic(
  () => import("./lanyard-hero").then((mod) => mod.LanyardHero),
  {
    ssr: false,
    loading: () => <LanyardSkeleton />,
  }
);

function useIsDesktop() {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia("(min-width: 768px)");
      query.addEventListener("change", callback);
      return () => query.removeEventListener("change", callback);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false
  );
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", callback);
      return () => query.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Lanyard card container:
 * - Prioritizes lightweight static presentation on mobile to optimize performance and prevent hero scroll delay.
 * - Loads interactive 3D WebGL hero automatically on desktop (or on-demand when mobile user taps "Play in 3D").
 * - Fully respects prefers-reduced-motion.
 */
export function LanyardCard() {
  const mounted = useMounted();
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mobileOptIn3D, setMobileOptIn3D] = useState(false);

  if (!mounted) {
    return (
      <div className="relative w-full h-[320px] sm:h-[440px] md:h-[520px] lg:h-[600px] flex items-center justify-center">
        <LanyardSkeleton />
      </div>
    );
  }


  const shouldRender3D = !prefersReducedMotion && (isDesktop || mobileOptIn3D);

  return (
    <div className="relative w-full h-[320px] sm:h-[440px] md:h-[520px] lg:h-[600px] flex items-center justify-center">
      {shouldRender3D ? (
        <LanyardHeroDynamic />
      ) : (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <StaticCard />
          {!isDesktop && !prefersReducedMotion && (
            <button
              type="button"
              onClick={() => setMobileOptIn3D(true)}
              className="absolute bottom-2 z-20 inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full bg-white/85 dark:bg-zinc-900/90 px-4 py-2 text-xs font-bold text-charcoal dark:text-white border-2 border-slate-200 dark:border-zinc-700 shadow-md backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Box className="size-3.5 text-macaw-blue" />
              <span>Play in 3D</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

