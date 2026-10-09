"use client";

import React, { useCallback, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
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

let webGLSnapshot: boolean | undefined;
function getWebGLSnapshot() {
  webGLSnapshot ??= checkWebGLSupport();
  return webGLSnapshot;
}

function subscribeWebGL() {
  return () => {};
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
  const [sceneReady, setSceneReady] = useState(false);
  const [webGlError, setWebGlError] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);
  const [inView, setInView] = useState(true);

  const prefersReducedMotion = usePrefersReducedMotion();
  const isTabActive = useIsTabVisible();
  const webGlSupported = useSyncExternalStore(subscribeWebGL, getWebGLSnapshot, () => false);

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

  const shouldRenderFallback = prefersReducedMotion || !webGlSupported || webGlError;
  const isFrameloopActive = inView && isTabActive;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[440px] md:h-[520px] lg:h-[600px] flex items-center justify-center select-none touch-pan-y"
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
              const canvas = gl.domElement;
              const handleContextLost = (event: Event) => {
                event.preventDefault();
                setWebGlError(true);
              };
              canvas.addEventListener("webglcontextlost", handleContextLost, false);
            }}
            onError={() => setWebGlError(true)}
            aria-hidden="true"
            className={`w-full h-full transition-opacity duration-400 ease-in-out ${sceneReady ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{
              pointerEvents: "auto",
              maskImage: CANVAS_FADE,
              WebkitMaskImage: CANVAS_FADE,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          >
            <LanyardScene onReady={handleReady} />
          </Canvas>

          <LanyardSkeleton
            done={sceneReady}
            className={`transition-opacity duration-400 ease-in-out ${sceneReady ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          />
        </>
      )}
    </div>
  );
}
