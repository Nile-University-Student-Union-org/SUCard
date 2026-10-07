"use client";

import { Download, Inbox, RotateCcw, AlertTriangle, Calendar, User } from "lucide-react";
import type { Batch } from "@/lib/cards/types";
import { formatNumber, formatBatchNumber, formatCairoDate } from "./utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "cn";

interface BatchesTableProps {
  batches: Batch[];
  isLoading: boolean;
  error: string | null;
  highlightedBatchId: string | null;
  onRetry: () => void;
  onDownloadClick: (batch: Batch) => void;
}

export function BatchesTable({
  batches,
  isLoading,
  error,
  highlightedBatchId,
  onRetry,
  onDownloadClick,
}: BatchesTableProps) {
  return (
    <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
            Card Batches
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Historical list of generated physical batches, serial number allocations, and QR export archives.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" className="text-xs font-bold">
            {batches.length} {batches.length === 1 ? "Batch" : "Batches"} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Error State */}
        {error ? (
          <div className="p-8">
            <StatusState
              layout="panel"
              variant="destructive"
              icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
              title="Failed to load card batches"
              description={error}
              actions={
                <Button variant="outline" size="sm" onClick={onRetry} className="normal-case">
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Try again
                </Button>
              }
            />
          </div>
        ) : isLoading ? (
          /* Loading Skeleton State */
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading batches">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3 border-b border-slate-100 dark:border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          /* Empty State */
          <div className="p-8">
            <StatusState
              layout="panel"
              icon={<Inbox className="size-7 text-muted-foreground" />}
              title="No cards yet"
              description="Generate your first batch of physical membership cards using the form above."
            />
          </div>
        ) : (
          <>
            {/* Desktop Batches Table (hidden on mobile < 768px) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Batch</TableHead>
                    <TableHead className="min-w-44">Label</TableHead>
                    <TableHead className="min-w-48">Serials</TableHead>
                    <TableHead className="w-24 text-right">Cards</TableHead>
                    <TableHead className="min-w-56">Status</TableHead>
                    <TableHead className="min-w-44">Created</TableHead>
                    <TableHead className="min-w-36">Created By</TableHead>
                    <TableHead className="w-32 text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const isHighlighted = highlightedBatchId === batch.id;
                    const stats = batch.stats || { unassigned: batch.count, active: 0, void: 0 };

                    return (
                      <TableRow
                        key={batch.id}
                        className={cn(
                          "transition-all duration-700",
                          isHighlighted && "bg-sky-50 dark:bg-sky-950/40 ring-2 ring-inset ring-brand/60"
                        )}
                      >
                        {/* Batch Number */}
                        <TableCell className="font-semibold text-xs py-3.5">
                          <span className="font-mono text-xs text-brand dark:text-brand-soft font-bold">
                            {formatBatchNumber(batch.number)}
                          </span>
                        </TableCell>

                        {/* Batch Label */}
                        <TableCell className="text-xs font-medium max-w-xs truncate py-3.5" title={batch.label}>
                          {batch.label}
                        </TableCell>

                        {/* Serials Range */}
                        <TableCell className="text-xs font-mono py-3.5 whitespace-nowrap">
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[11px] font-bold text-charcoal dark:text-zinc-200">
                            {batch.firstSerial}
                          </span>
                          <span className="mx-1 text-ash dark:text-zinc-500">&rarr;</span>
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[11px] font-bold text-charcoal dark:text-zinc-200">
                            {batch.lastSerial}
                          </span>
                        </TableCell>

                        {/* Card Count */}
                        <TableCell className="text-right text-xs font-bold text-charcoal dark:text-white py-3.5">
                          {formatNumber(batch.count)}
                        </TableCell>

                        {/* Status Badges */}
                        <TableCell className="py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              {formatNumber(stats.unassigned)} unassigned
                            </span>
                            {stats.active > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {formatNumber(stats.active)} active
                              </span>
                            )}
                            {stats.void > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                {formatNumber(stats.void)} void
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Created Date (Africa/Cairo) */}
                        <TableCell className="text-xs text-ash dark:text-zinc-400 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="size-3 text-ash dark:text-zinc-400" />
                            <span>{formatCairoDate(batch.createdAt)}</span>
                          </div>
                        </TableCell>

                        {/* Created By */}
                        <TableCell className="text-xs text-ash dark:text-zinc-400 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[11px]">
                            <User className="size-3 text-ash dark:text-zinc-400" />
                            <span className="truncate max-w-[120px]" title={batch.createdByEmail || undefined}>
                              {batch.createdByEmail || "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right py-3.5 pr-4 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadClick(batch)}
                            className="h-8 px-2.5 text-xs font-bold normal-case text-brand dark:text-brand-soft border-slate-200 dark:border-zinc-700 hover:border-brand/40"
                          >
                            <Download className="size-3.5 mr-1 text-brand dark:text-brand-soft" />
                            Download ZIP
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800 p-3 space-y-3">
              {batches.map((batch) => {
                const isHighlighted = highlightedBatchId === batch.id;
                const stats = batch.stats || { unassigned: batch.count, active: 0, void: 0 };

                return (
                  <div
                    key={batch.id}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 transition-all",
                      isHighlighted && "ring-2 ring-brand"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-brand dark:text-brand-soft">
                        {formatBatchNumber(batch.number)}
                      </span>
                      <span className="text-xs font-bold text-charcoal dark:text-white">
                        {formatNumber(batch.count)} cards
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-charcoal dark:text-zinc-100">
                        {batch.label}
                      </p>
                      <p className="text-[11px] font-mono text-ash dark:text-zinc-400 mt-1">
                        Serials: {batch.firstSerial} &rarr; {batch.lastSerial}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {formatNumber(stats.unassigned)} unassigned
                      </span>
                      {stats.active > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {formatNumber(stats.active)} active
                        </span>
                      )}
                      {stats.void > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {formatNumber(stats.void)} void
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-ash dark:text-zinc-400">
                      <span>{formatCairoDate(batch.createdAt)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadClick(batch)}
                        className="min-h-[44px] px-3 text-xs font-bold normal-case text-brand dark:text-brand-soft"
                      >
                        <Download className="size-3.5 mr-1" />
                        Download ZIP
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
