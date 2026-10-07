"use client";

import React, { useCallback, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Hand, Sparkles } from "lucide-react";
import { CAMERA_FOV, LanyardScene } from "./lanyard-scene";
import { StaticCard } from "./static-card";
import { LanyardSkeleton } from "./lanyard-skeleton";

/** Fades the 3D area into the page: strap comes in from the top, card swings out at the sides and bottom. */
const CANVAS_FADE =
  "linear-gradient(to bottom, transparent 0, #000 72px, #000 calc(100% - 96px), transparent 100%), " +
  "linear-gradient(to right, transparent 0, #000 64px, #000 calc(100% - 64px), transparent 100%)";

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGL2RenderingContext && canvas.getContext("webgl2") ||
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
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

function useIsTabVisible() {
  return useSyncExternalStore(
    (callback) => {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    () => document.visibilityState === "visible",
    () => true
  );
}

export function LanyardHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);
  const [inView, setInView] = useState(true);

  const prefersReducedMotion = usePrefersReducedMotion();
  const isTabActive = useIsTabVisible();
  const isWebGLSupported = checkWebGLSupport();

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setInView(entry.isIntersecting);
        },
        { threshold: 0.05 }
      );
      observer.observe(currentContainer);

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  const shouldRenderFallback = prefersReducedMotion || !isWebGLSupported;
  const isFrameloopActive = inView && isTabActive;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] sm:h-[560px] lg:h-[640px] flex items-center justify-center select-none touch-pan-y"
    >
      {/* Screen Reader Visually Hidden Description */}
      <div className="sr-only" aria-live="polite">
        Interactive 3D Nile University Student Union membership card. Can be dragged and rotated in 3D.
      </div>

      {shouldRenderFallback ? (
        <StaticCard />
      ) : (
        <>
          <Canvas
            dpr={[1, 2]}
            frameloop={isFrameloopActive ? "demand" : "never"}
            camera={{ position: [0, 0, 13], fov: CAMERA_FOV }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.NeutralToneMapping;
            }}
            aria-hidden="true"
            className={`w-full h-full transition-opacity duration-500 ${sceneReady ? "opacity-100" : "opacity-0"}`}
            style={{
              pointerEvents: "auto",
              maskImage: CANVAS_FADE,
              WebkitMaskImage: CANVAS_FADE,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          >
            <LanyardScene onCardGrab={() => setHasInteracted(true)} onReady={handleReady} />
          </Canvas>

          <LanyardSkeleton
            done={sceneReady}
            className={`transition-opacity ${sceneReady ? "opacity-0 duration-200" : "opacity-100 duration-500"}`}
          />

          {/* Interactive Tactile Hint Pill */}
          <div
            className={`absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500 ${
              hasInteracted ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 dark:bg-zinc-900/85 border-2 border-slate-200/80 dark:border-zinc-800 shadow-md backdrop-blur-md text-xs font-semibold text-charcoal dark:text-zinc-200">
              <Hand className="size-3.5 text-brand dark:text-brand-soft animate-bounce" />
              <span>DRAG · TAP TO FLIP</span>
              <Sparkles className="size-3 text-sky-500 animate-pulse" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
