"use client";

import dynamic from "next/dynamic";
import { StaticCard } from "./static-card";

/**
 * Dynamic client-only import for LanyardHero to prevent SSR WebGL execution
 * while guaranteeing zero layout shift with StaticCard placeholder.
 */
export const LanyardCard = dynamic(
  () => import("./lanyard-hero").then((mod) => mod.LanyardHero),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[640px] flex items-center justify-center">
        <StaticCard />
      </div>
    ),
  }
);
