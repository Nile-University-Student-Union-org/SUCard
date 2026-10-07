"use client";

import React, { useState } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { QrSvgPreview } from "../qr-svg-preview";
import { CardMockup } from "./card-mockup";
import { WebCardMockup } from "./web-card-mockup";
import { CompareView } from "./compare-view";
import { getSampleTokens } from "../api";
import {
  QrCode,
  CreditCard,
  Smartphone,
  Sun,
  Moon,
  Shuffle,
  SplitSquareVertical,
  Loader2,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export type PreviewMode = "qr" | "card" | "web" | "compare";
export type SurroundMode = "light" | "dark" | "checker-light" | "checker-dark";
export type ZoomLevel = "fit" | "actual" | 1 | 2 | 4 | 8;

export interface LivePreviewPanelProps {
  config: QrStyleConfig;
  styleName: string;
  payload: string;
  onPayloadChange: (payload: string) => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  config,
  styleName,
  payload,
  onPayloadChange,
}) => {
  const [mode, setMode] = useState<PreviewMode>("qr");
  const [surround, setSurround] = useState<SurroundMode>("checker-light");
  const [zoom, setZoom] = useState<ZoomLevel>("fit");
  const [isRandomizing, setIsRandomizing] = useState(false);

  const handleRandomizeSample = async () => {
    setIsRandomizing(true);
    try {
      const res = await getSampleTokens(6);
      if (res.tokens && res.tokens.length > 0) {
        // Pick one that is different from current
        const next = res.tokens.find((t) => t !== payload) || res.tokens[0];
        onPayloadChange(next);
      }
    } catch {
      // Fallback local random token
      const randomHex = Array.from({ length: 20 }, () =>
        "0123456789ABCDEFGHJK"[Math.floor(Math.random() * 20)]
      ).join("");
      onPayloadChange(`NUSU1:${randomHex}`);
    } finally {
      setIsRandomizing(false);
    }
  };

  // Compute CSS scale/size based on zoom setting
  // Actual size at 96 DPI: 1 inch = 25.4 mm = 96 px -> px = (mm / 25.4) * 96
  const printSizeMm = config.output?.printSizeMm || 25;
  const actualPx = Math.round((printSizeMm / 25.4) * 96);

  const getContainerStyle = (): React.CSSProperties => {
    if (mode !== "qr") return {};
    if (zoom === "actual") {
      return { width: `${actualPx}px`, height: `${actualPx}px` };
    }
    if (zoom === 1) return { width: "240px", height: "240px" };
    if (zoom === 2) return { width: "360px", height: "360px" };
    if (zoom === 4) return { width: "480px", height: "480px" };
    if (zoom === 8) return { width: "640px", height: "640px" };
    return { width: "100%", maxWidth: "320px", maxHeight: "320px", aspectRatio: "1/1" };
  };

  const surroundBgClass = {
    light: "bg-white",
    dark: "bg-zinc-950",
    "checker-light":
      "bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] bg-slate-100",
    "checker-dark":
      "bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] bg-zinc-900",
  }[surround];

  return (
    <div className="flex flex-col h-full rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden select-none">
      {/* PREVIEW TOOLBAR */}
      <div className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-900/90 shrink-0">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setMode("qr")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              mode === "qr"
                ? "bg-brand text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-300 hover:text-foreground"
            )}
            title="Standard QR Preview"
          >
            <QrCode className="size-3.5" />
            <span>QR</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("card")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              mode === "card"
                ? "bg-brand text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-300 hover:text-foreground"
            )}
            title="CR80 Physical Card Mockup"
          >
            <CreditCard className="size-3.5" />
            <span>On Card</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("web")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              mode === "web"
                ? "bg-brand text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-300 hover:text-foreground"
            )}
            title="Digital Student Pass Mockup"
          >
            <Smartphone className="size-3.5" />
            <span>Web Pass</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("compare")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              mode === "compare"
                ? "bg-brand text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-300 hover:text-foreground"
            )}
            title="Side-by-side A/B Compare"
          >
            <SplitSquareVertical className="size-3.5" />
            <span>Compare</span>
          </button>
        </div>

        {/* Right Utility Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Randomize Sample Token */}
          <Button
            variant="surface"
            size="sm"
            onClick={handleRandomizeSample}
            disabled={isRandomizing}
            className="h-8 px-2.5 text-xs font-bold normal-case rounded-lg"
            title="Randomize payload to test density across different codes"
          >
            {isRandomizing ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Shuffle className="size-3.5 mr-1 text-sky-500" />
            )}
            <span className="hidden sm:inline">Randomize</span>
          </Button>

          {/* Surround switcher */}
          <div className="flex items-center bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() =>
                setSurround((s) => (s.startsWith("checker") ? "light" : "checker-light"))
              }
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer",
                surround === "light" || surround === "checker-light"
                  ? "bg-slate-200 dark:bg-zinc-700 text-foreground"
                  : "text-muted-foreground"
              )}
              title="Light surround"
            >
              <Sun className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setSurround((s) => (s.startsWith("checker") ? "dark" : "checker-dark"))
              }
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer",
                surround === "dark" || surround === "checker-dark"
                  ? "bg-slate-200 dark:bg-zinc-700 text-foreground"
                  : "text-muted-foreground"
              )}
              title="Dark surround"
            >
              <Moon className="size-3.5" />
            </button>
          </div>

          {/* Zoom controls (only in QR mode) */}
          {mode === "qr" && (
            <div className="hidden sm:flex items-center bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
              {(["fit", "actual", 1, 2, 4] as ZoomLevel[]).map((z) => (
                <button
                  key={String(z)}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-bold font-mono transition-colors cursor-pointer",
                    zoom === z
                      ? "bg-brand text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={
                    z === "fit"
                      ? "Fit to screen"
                      : z === "actual"
                      ? `Actual size (${printSizeMm} mm @ 96 DPI)`
                      : `${Number(z) * 100}% scale`
                  }
                >
                  {z === "fit"
                    ? "Fit"
                    : z === "actual"
                    ? "Actual"
                    : `${Number(z) * 100}%`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW CANVAS WORKSPACE */}
      <div
        className={cn(
          "flex-1 min-h-[360px] sm:min-h-[460px] p-4 sm:p-8 flex items-center justify-center overflow-auto transition-colors relative",
          surroundBgClass
        )}
      >
        {mode === "qr" ? (
          <div
            className="flex items-center justify-center p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-black/10 dark:border-white/10 transition-all duration-200"
            style={getContainerStyle()}
          >
            <QrSvgPreview
              config={config}
              payload={payload}
              className="w-full h-full"
            />
          </div>
        ) : mode === "card" ? (
          <CardMockup config={config} payload={payload} />
        ) : mode === "web" ? (
          <WebCardMockup config={config} payload={payload} />
        ) : (
          <CompareView
            currentConfig={config}
            currentName={styleName}
            payload={payload}
          />
        )}

        {/* Zoom notice for "actual size" */}
        {mode === "qr" && zoom === "actual" && (
          <div className="absolute bottom-3 left-3 bg-black/80 text-white text-[10px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md">
            Actual Print Scale: {printSizeMm} mm ({actualPx} px @ 96 DPI) &bull; Screens vary
          </div>
        )}
      </div>

      {/* FOOTER METRICS BAR */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <span>
            EC: <strong className="text-foreground">{config.encoding.ecLevel}</strong>
          </span>
          <span>
            Quiet Zone:{" "}
            <strong className="text-foreground">{config.encoding.quietZone} mod</strong>
          </span>
          <span>
            Print:{" "}
            <strong className="text-foreground">{config.output.printSizeMm} mm</strong>
          </span>
        </div>
        <div className="truncate max-w-[260px] text-right" title={payload}>
          Payload: <span className="text-foreground">{payload}</span>
        </div>
      </div>
    </div>
  );
};
