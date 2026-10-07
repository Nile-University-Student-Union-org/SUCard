"use client";

import React, { useState, useEffect } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import { QrSvgPreview } from "../qr-svg-preview";
import { listStyles } from "../api";
import { ArrowLeftRight, SplitSquareVertical } from "lucide-react";

export interface CompareViewProps {
  currentConfig: QrStyleConfig;
  currentName: string;
  payload?: string;
}

export const CompareView: React.FC<CompareViewProps> = ({
  currentConfig,
  currentName,
  payload,
}) => {
  const [styles, setStyles] = useState<QrStyleDto[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");
  const [compareConfig, setCompareConfig] = useState<QrStyleConfig | null>(null);
  const [compareName, setCompareName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listStyles()
      .then((res) => {
        if (active) {
          setStyles(res.styles || []);
          if (res.styles?.length > 0) {
            const firstOther = res.styles[0];
            setSelectedStyleId(firstOther.id);
            setCompareConfig(firstOther.latestVersion?.config ?? firstOther.draftConfig);
            setCompareName(firstOther.name);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load styles for comparison:", err);
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStyleSelect = (id: string) => {
    setSelectedStyleId(id);
    const target = styles.find((s) => s.id === id);
    if (target) {
      setCompareConfig(target.latestVersion?.config ?? target.draftConfig);
      setCompareName(target.name);
    }
  };

  const getDiffs = () => {
    if (!compareConfig) return [];
    const diffs: { label: string; a: string; b: string }[] = [];

    if (currentConfig.encoding.ecLevel !== compareConfig.encoding.ecLevel) {
      diffs.push({
        label: "Error Correction",
        a: currentConfig.encoding.ecLevel,
        b: compareConfig.encoding.ecLevel,
      });
    }

    if (currentConfig.encoding.quietZone !== compareConfig.encoding.quietZone) {
      diffs.push({
        label: "Quiet Zone",
        a: `${currentConfig.encoding.quietZone} mod`,
        b: `${compareConfig.encoding.quietZone} mod`,
      });
    }

    if (currentConfig.modules.shape !== compareConfig.modules.shape) {
      diffs.push({
        label: "Dot Shape",
        a: currentConfig.modules.shape,
        b: compareConfig.modules.shape,
      });
    }

    if (currentConfig.modules.scale !== compareConfig.modules.scale) {
      diffs.push({
        label: "Dot Scale",
        a: `${Math.round(currentConfig.modules.scale * 100)}%`,
        b: `${Math.round(compareConfig.modules.scale * 100)}%`,
      });
    }

    if (currentConfig.modules.paint.type !== compareConfig.modules.paint.type) {
      diffs.push({
        label: "Paint Type",
        a: currentConfig.modules.paint.type,
        b: compareConfig.modules.paint.type,
      });
    }

    if (currentConfig.logo.type !== compareConfig.logo.type) {
      diffs.push({
        label: "Logo Type",
        a: currentConfig.logo.type,
        b: compareConfig.logo.type,
      });
    }

    if (currentConfig.frame.shape !== compareConfig.frame.shape) {
      diffs.push({
        label: "Frame Shape",
        a: currentConfig.frame.shape,
        b: compareConfig.frame.shape,
      });
    }

    if (currentConfig.output.printSizeMm !== compareConfig.output.printSizeMm) {
      diffs.push({
        label: "Print Size",
        a: `${currentConfig.output.printSizeMm} mm`,
        b: `${compareConfig.output.printSizeMm} mm`,
      });
    }

    return diffs;
  };

  const diffs = getDiffs();

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Selector Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2">
          <SplitSquareVertical className="size-5 text-brand" />
          <h3 className="font-heading text-base uppercase text-foreground">
            SIDE-BY-SIDE A/B COMPARISON
          </h3>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-ash dark:text-zinc-400 whitespace-nowrap">
            Compare with:
          </span>
          <select
            value={selectedStyleId}
            onChange={(e) => handleStyleSelect(e.target.value)}
            disabled={isLoading || styles.length === 0}
            className="flex-1 sm:w-56 h-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
          >
            {styles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.latestVersion ? `v${s.latestVersion.version}` : "Draft"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Style A (Current) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-brand/50 shadow-md flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between w-full border-b border-slate-100 dark:border-zinc-800 pb-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand text-white">
                STYLE A (CURRENT)
              </span>
              <h4 className="font-heading text-lg text-foreground mt-1 truncate">
                {currentName}
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-ash">
              {currentConfig.output.printSizeMm} mm
            </span>
          </div>

          <div className="w-56 h-56 flex items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
            <QrSvgPreview config={currentConfig} payload={payload} className="w-full h-full" />
          </div>
        </div>

        {/* Style B (Selected) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-md flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between w-full border-b border-slate-100 dark:border-zinc-800 pb-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-800 text-charcoal dark:text-zinc-200">
                STYLE B (REFERENCE)
              </span>
              <h4 className="font-heading text-lg text-foreground mt-1 truncate">
                {compareName || "Reference Style"}
              </h4>
            </div>
            {compareConfig && (
              <span className="text-xs font-mono font-bold text-ash">
                {compareConfig.output.printSizeMm} mm
              </span>
            )}
          </div>

          <div className="w-56 h-56 flex items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
            {compareConfig ? (
              <QrSvgPreview config={compareConfig} payload={payload} className="w-full h-full" />
            ) : (
              <p className="text-xs text-muted-foreground">Select style to compare</p>
            )}
          </div>
        </div>
      </div>

      {/* Difference Breakdown Table */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
          Configuration Differences ({diffs.length})
        </h4>

        {diffs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Both styles have identical configuration parameters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
            {diffs.map((d, i) => (
              <div key={i} className="py-2 flex items-center justify-between gap-4">
                <span className="font-bold text-foreground w-1/3">{d.label}</span>
                <div className="flex items-center gap-2 w-2/3 justify-end font-mono">
                  <span className="px-2 py-0.5 rounded bg-brand/10 text-brand dark:text-brand-soft font-bold">
                    {d.a}
                  </span>
                  <ArrowLeftRight className="size-3 text-muted-foreground" />
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-foreground">
                    {d.b}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
