"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { StaticCard } from "./static-card";
import { LanyardSkeleton } from "./lanyard-skeleton";

const LanyardHeroDynamic = dynamic(
  () => import("./lanyard-hero").then((mod) => mod.LanyardHero),
  {
    ssr: false,
    loading: () => <LanyardSkeleton />,
  }
);

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
 * - Interactive 3D WebGL hero on every device.
 * - Static card when prefers-reduced-motion is on.
 */
export function LanyardCard() {
  const mounted = useMounted();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!mounted) {
    return (
      <div className="relative w-full h-[320px] sm:h-[440px] md:h-[520px] lg:h-[600px] flex items-center justify-center">
        <LanyardSkeleton />
      </div>
    );
  }


  return (
    <div className="relative w-full h-[320px] sm:h-[440px] md:h-[520px] lg:h-[600px] flex items-center justify-center">
      {prefersReducedMotion ? <StaticCard /> : <LanyardHeroDynamic />}
    </div>
  );
}

