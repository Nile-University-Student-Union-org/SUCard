"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CreditCard, ShieldCheck, ChevronRight, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import type { Area } from "@/lib/student/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface ChooseTilesProps {
  areas: Area[];
  userName: string;
}

const AREA_METADATA: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  student: {
    icon: CreditCard,
    description: "Student portal — view your digital card and discounts",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  admin: {
    icon: ShieldCheck,
    description: "Admin console — manage cards, members, and settings",
    iconBg: "bg-brand/10 dark:bg-brand/20",
    iconColor: "text-brand dark:text-brand-soft",
  },
};

export function ChooseTiles({ areas, userName }: ChooseTilesProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{
    area: Area;
    message: string;
  } | null>(null);

  const handleSelectArea = async (area: Area) => {
    if (selectedKey) return;
    setSelectedKey(area.key);
    setSaveError(null);

    try {
      const res = await fetch("/api/me/area", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ key: area.key }),
      });

      if (res.ok) {
        const data = (await res.json()) as { href: string };
        window.location.assign(data.href || area.href);
        return;
      } else {
        setSaveError({
          area,
          message: "Unable to save your default area preference. You can still continue to the portal.",
        });
        setSelectedKey(null);
      }
    } catch {
      setSaveError({
        area,
        message: "Unable to connect to save your default area preference. You can still continue.",
      });
      setSelectedKey(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 text-foreground p-4 sm:p-8 relative isolate selection:bg-brand selection:text-white">
      <AmbientBackdrop />

      {/* Top Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Image
            src="/brand/su-logo-color.png"
            alt="Nile University SU"
            width={140}
            height={38}
            className="h-8 w-auto object-contain dark:hidden"
            priority
          />
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="Nile University SU"
            width={140}
            height={38}
            className="h-8 w-auto object-contain hidden dark:block"
            priority
          />
        </div>
        <ThemeToggle />
      </header>

      {/* Center Section: Tappable Tiles */}
      <main className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="size-3.5" />
            <span>Welcome, {userName.split(" ")[0]}</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wider text-charcoal dark:text-white leading-tight">
            WHERE TO?
          </h1>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
            Select an area to continue.
          </p>
        </div>

        {/* Save Preference Error Notice */}
        {saveError && (
          <div className="p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 space-y-3 animate-in fade-in-0 duration-150">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left min-w-0">
                <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Preference not saved
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  {saveError.message}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => window.location.assign(saveError.area.href)}
                className="min-h-[44px] text-xs font-bold w-full sm:w-auto normal-case"
              >
                Continue to {saveError.area.label}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleSelectArea(saveError.area)}
                className="min-h-[44px] text-xs font-bold w-full sm:w-auto normal-case border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                Retry saving
              </Button>
            </div>
          </div>
        )}

        {/* Big Tappable Area Cards */}
        <div className="space-y-4">
          {areas.map((area) => {
            const meta = AREA_METADATA[area.key] || {
              icon: CreditCard,
              description: area.label,
              iconBg: "bg-brand/10",
              iconColor: "text-brand",
            };
            const Icon = meta.icon;
            const isLoading = selectedKey === area.key;

            return (
              <button
                key={area.key}
                type="button"
                onClick={() => handleSelectArea(area)}
                disabled={selectedKey !== null}
                aria-label={`Go to ${area.label}`}
                className={cn(
                  "w-full p-5 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md",
                  "hover:border-brand/60 dark:hover:border-sky-500/60 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                  "motion-reduce:hover:transform-none motion-reduce:active:transform-none motion-reduce:transition-none",
                  "transition-all duration-200 cursor-pointer text-left flex items-center justify-between gap-4 group min-h-[96px]",
                  isLoading && "ring-2 ring-brand dark:ring-sky-400 opacity-90",
                  selectedKey && selectedKey !== area.key && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "size-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:scale-100 shadow-xs",
                      meta.iconBg,
                      meta.iconColor
                    )}
                  >
                    <Icon className="size-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h2 className="font-heading text-xl uppercase tracking-wider text-charcoal dark:text-white group-hover:text-brand dark:group-hover:text-brand-soft transition-colors truncate">
                      {area.label}
                    </h2>
                    <p className="text-xs text-ash dark:text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {isLoading ? (
                    <Loader2 className="size-6 animate-spin text-brand dark:text-brand-soft" />
                  ) : (
                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-ash dark:text-zinc-400 group-hover:bg-brand group-hover:text-white transition-colors">
                      <ChevronRight className="size-5 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 transition-transform" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Persistent Footnote */}
        <p className="text-center text-xs text-ash dark:text-zinc-400 font-medium px-4 leading-relaxed">
          We&apos;ll remember your choice. Switch any time from the account menu.
        </p>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pb-4 text-center text-xs text-ash dark:text-zinc-500">
        <p>SU Card &bull; Nile University Student Union</p>
      </footer>
    </div>
  );
}
