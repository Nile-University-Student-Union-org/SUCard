"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  children,
  backHref,
  onBack,
  backLabel = "Back",
  className,
}: PageHeaderProps) {
  const actionSlot = actions ?? children;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        {(backHref || onBack) && (
          <div className="mb-2">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ash dark:text-zinc-400 hover:text-brand dark:hover:text-brand-soft transition-colors min-h-[36px] py-1"
              >
                <ArrowLeft className="size-3.5" />
                <span>{backLabel}</span>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ash dark:text-zinc-400 hover:text-brand dark:hover:text-brand-soft transition-colors h-auto py-1 px-2 -ml-2"
              >
                <ArrowLeft className="size-3.5" />
                <span>{backLabel}</span>
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl uppercase tracking-wider text-charcoal dark:text-white leading-tight">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {description && (
          <div className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium leading-relaxed max-w-2xl">
            {description}
          </div>
        )}
      </div>

      {actionSlot && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start sm:self-center">
          {actionSlot}
        </div>
      )}
    </div>
  );
}
