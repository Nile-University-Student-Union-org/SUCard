"use client";

import React from "react";
import {
  History,
  RotateCcw,
  AlertTriangle,
  Clock,
  Eye,
  Layers,
} from "lucide-react";
import type { AuditEntry } from "@/lib/staff/types";
import {
  groupAuditByDay,
  formatCairoTime,
  formatRelativeTime,
  getAuditActionSummary,
  getAuditActionBadge,
} from "./utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import { EmptyState } from "@/components/ui/empty-state";

interface AuditTimelineProps {
  entries: AuditEntry[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectEntry: (entry: AuditEntry) => void;
}

export function AuditTimeline({
  entries,
  isLoading,
  error,
  onRetry,
  onSelectEntry,
}: AuditTimelineProps) {
  if (error) {
    return (
      <div className="p-8">
        <StatusState
          layout="panel"
          variant="destructive"
          icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
          title="Failed to load audit logs"
          description={error}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="normal-case font-bold min-h-[44px] h-11 px-5 cursor-pointer"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading audit logs">
        {Array.from({ length: 3 }).map((_, groupIdx) => (
          <div key={groupIdx} className="space-y-3">
            <Skeleton className="h-5 w-28 rounded-md" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, itemIdx) => (
                <div
                  key={itemIdx}
                  className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" className="size-9" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<History className="size-6 text-muted-foreground" />}
          title="No audit events found"
          hint="No administrative activities matched your filter criteria."
        />
      </div>
    );
  }

  const dayGroups = groupAuditByDay(entries);

  return (
    <div className="space-y-8" aria-label="Audit Log Timeline">
      {dayGroups.map((group) => (
        <section key={group.dayLabel} className="space-y-3">
          {/* Day Group Sticky Header */}
          <div className="sticky top-16 z-10 py-1.5 bg-background/95 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-charcoal dark:text-zinc-200">
              <span>{group.dayLabel}</span>
              <span className="text-ash dark:text-zinc-400 font-normal">&bull;</span>
              <span className="text-ash dark:text-zinc-400 font-normal">
                {group.entries.length} event{group.entries.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Group Events List */}
          <div className="space-y-2.5">
            {group.entries.map((entry) => {
              const actionBadge = getAuditActionBadge(entry.action);
              const summary = getAuditActionSummary(entry);
              const actorDisplayName = entry.actorName || entry.actorEmail || "System";

              return (
                <div
                  key={entry.id}
                  className="p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-brand/40 dark:hover:border-brand-soft/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                    {/* Actor & Action Summary */}
                    <div className="flex items-start gap-3 min-w-0">
                      <UserAvatar
                        name={actorDisplayName}
                        size="sm"
                        className="mt-0.5"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-charcoal dark:text-white">
                            {actorDisplayName}
                          </span>
                          <Badge
                            variant={actionBadge.variant}
                            className="text-xs font-semibold"
                          >
                            {actionBadge.label}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-charcoal dark:text-zinc-200 leading-snug break-words">
                          {summary}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp & Inspect Details Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800 shrink-0">
                      <div
                        className="flex items-center gap-1 text-[11px] text-ash dark:text-zinc-400 shrink-0 cursor-help"
                        title={formatRelativeTime(entry.createdAt)}
                      >
                        <Clock className="size-3 shrink-0" />
                        <span>{formatCairoTime(entry.createdAt)}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectEntry(entry)}
                        className="min-h-[44px] h-11 px-4 text-xs font-bold normal-case text-brand dark:text-brand-soft border-slate-200 dark:border-zinc-700 hover:bg-muted inline-flex items-center cursor-pointer"
                        aria-label={`Inspect event ${entry.id}`}
                      >
                        <Eye className="size-3.5 mr-1" />
                        <span>Details</span>
                      </Button>
                    </div>
                  </div>

                  {/* Entity Tag / Data footer pill */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-ash dark:text-zinc-400 font-mono">
                    <span className="inline-flex items-center gap-1 font-semibold text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                      <Layers className="size-3 shrink-0" />
                      {entry.entity}
                    </span>
                    <span className="truncate max-w-[200px] sm:max-w-md">
                      ID: {entry.entityId}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
