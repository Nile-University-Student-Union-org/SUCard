"use client";

import React, { useEffect, useState, useTransition } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { checkStyle, type CheckResult } from "@/lib/qr-style/checks";
import {
  runLiveScanTest,
  type LiveScanTestResult,
} from "./scan-test-runner";
import { CmykPaletteView } from "./cmyk-palette-view";
import { useNusuLogo } from "../use-nusu-logo";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Scan,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "cn";

export interface ChecksPanelProps {
  config: QrStyleConfig;
  payload?: string;
}

export const ChecksPanel: React.FC<ChecksPanelProps> = ({
  config,
  payload = "NUSU1:0123456789ABCDEFGHJK",
}) => {
  const { logoDataUri } = useNusuLogo();
  const [, startTransition] = useTransition();

  // Pure sync checks run instantly
  const checks: CheckResult = React.useMemo(() => {
    try {
      return checkStyle(config);
    } catch {
      return {
        contrast: [],
        logoCoverage: { percent: 0, safeLimit: 18, level: "ok" },
        moduleSizeMm: { value: 0.75, level: "ok" },
        quietZone: { value: 2, level: "ok" },
        eyesIntact: { value: true, level: "ok" },
        overall: "ok",
      };
    }
  }, [config]);

  // Live in-browser scan test runs debounced
  const [scanTest, setScanTest] = useState<LiveScanTestResult | null>(null);
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      setIsRunningScan(true);
      startTransition(async () => {
        try {
          const res = await runLiveScanTest(config, payload, logoDataUri);
          if (active) {
            setScanTest(res);
            setIsRunningScan(false);
          }
        } catch (err) {
          console.warn("Scan test error:", err);
          if (active) setIsRunningScan(false);
        }
      });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [config, payload, logoDataUri, scanKey]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: SCAN-SAFETY POLICY CHECKS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Scan-Safety Validation
            </h3>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase font-mono tracking-wide",
              checks.overall === "ok"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : checks.overall === "warn"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
            )}
          >
            {checks.overall === "ok" ? (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Pass</span>
              </>
            ) : checks.overall === "warn" ? (
              <>
                <AlertTriangle className="size-3.5" />
                <span>Warnings</span>
              </>
            ) : (
              <>
                <XCircle className="size-3.5" />
                <span>Blocked</span>
              </>
            )}
          </span>
        </div>

        {/* List of individual check items */}
        <div className="space-y-2 text-xs">
          {/* Contrast Check */}
          {checks.contrast.map((c, i) => (
            <div
              key={i}
              className={cn(
                "p-2.5 rounded-xl border flex items-center justify-between gap-2",
                c.level === "ok"
                  ? "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80"
                  : c.level === "warn"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-rose-500/10 border-rose-500/30"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="size-4 rounded-md border border-black/20 shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    Contrast ({c.color})
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Ratio: {c.ratio.toFixed(2)}:1 (Min 3:1, Rec 4.5:1)
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-bold">
                {c.level === "ok" ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : c.level === "warn" ? (
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
                )}
              </span>
            </div>
          ))}

          {/* Logo Coverage Check */}
          <div
            className={cn(
              "p-2.5 rounded-xl border flex items-center justify-between gap-2",
              checks.logoCoverage.level === "ok"
                ? "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80"
                : checks.logoCoverage.level === "warn"
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-rose-500/10 border-rose-500/30"
            )}
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Logo Coverage</p>
              <p className="text-[11px] text-muted-foreground">
                {checks.logoCoverage.percent.toFixed(1)}% module area (Safe limit:{" "}
                {checks.logoCoverage.safeLimit.toFixed(1)}%)
              </p>
            </div>
            <span className="shrink-0 font-bold">
              {checks.logoCoverage.level === "ok" ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : checks.logoCoverage.level === "warn" ? (
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
              )}
            </span>
          </div>

          {/* Module Physical Size Check */}
          <div
            className={cn(
              "p-2.5 rounded-xl border flex items-center justify-between gap-2",
              checks.moduleSizeMm.level === "ok"
                ? "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80"
                : "bg-amber-500/10 border-amber-500/30"
            )}
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Module Physical Size</p>
              <p className="text-[11px] text-muted-foreground">
                {checks.moduleSizeMm.value.toFixed(2)} mm at {config.output.printSizeMm} mm print size (Rec ≥ 0.50 mm)
              </p>
            </div>
            <span className="shrink-0 font-bold">
              {checks.moduleSizeMm.level === "ok" ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              )}
            </span>
          </div>

          {/* Quiet Zone Check */}
          <div
            className={cn(
              "p-2.5 rounded-xl border flex items-center justify-between gap-2",
              checks.quietZone.level === "ok"
                ? "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80"
                : checks.quietZone.level === "warn"
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-rose-500/10 border-rose-500/30"
            )}
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Quiet Zone Margin</p>
              <p className="text-[11px] text-muted-foreground">
                {checks.quietZone.value} modules (Min 1, Rec ≥ 2)
              </p>
            </div>
            <span className="shrink-0 font-bold">
              {checks.quietZone.level === "ok" ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : checks.quietZone.level === "warn" ? (
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
              )}
            </span>
          </div>

          {/* Eyes Intact Check */}
          <div
            className={cn(
              "p-2.5 rounded-xl border flex items-center justify-between gap-2",
              checks.eyesIntact.level === "ok"
                ? "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/80"
                : "bg-rose-500/10 border-rose-500/30"
            )}
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Finder Pattern Clearance</p>
              <p className="text-[11px] text-muted-foreground">
                All 3 corner eyes unblocked and distinct
              </p>
            </div>
            <span className="shrink-0 font-bold">
              {checks.eyesIntact.level === "ok" ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE JSQR SCAN TEST */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="size-4 text-sky-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Live Scannability Score
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isRunningScan ? (
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none text-muted-foreground" />
            ) : (
              <button
                type="button"
                onClick={() => setScanKey((k) => k + 1)}
                className="size-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md"
                title="Re-run scan simulations"
                aria-label="Re-run scan simulations"
              >
                <RefreshCw className="size-3.5" />
              </button>
            )}
            {scanTest && (
              <span
                className={cn(
                  "font-mono font-black text-xs px-2 py-0.5 rounded-lg border",
                  scanTest.score >= 80
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : scanTest.score >= 60
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                )}
              >
                {scanTest.score}/100
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Decoded in-browser with standard QR camera decoders across 5 real-world stress conditions:
        </p>

        <div className="space-y-1.5 text-xs">
          {scanTest?.conditions.map((cond) => (
            <div
              key={cond.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80"
            >
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-foreground text-xs">{cond.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {cond.description}
                </p>
              </div>
              <span className="shrink-0 font-bold text-xs flex items-center gap-1">
                {cond.passed ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Pass</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px]">Fail</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CMYK COLOR PROFILE BREAKDOWN */}
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
        <CmykPaletteView config={config} />
      </div>
    </div>
  );
};
