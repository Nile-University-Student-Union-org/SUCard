"use client";

import { Download, Inbox, RotateCcw, AlertTriangle, Calendar, User } from "lucide-react";
import type { Batch } from "@/lib/cards/types";
import { formatNumber, formatBatchNumber, formatCairoDate } from "./utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Card className="border-slate-200/80 bg-white dark:bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
            Card Batches
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Historical list of generated physical batches, serial number allocations, and QR export archives.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold text-slate-700 bg-slate-50">
            {batches.length} Batch{batches.length === 1 ? "" : "es"} Total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Error State */}
        {error ? (
          <div className="p-8 text-center space-y-3" role="alert" aria-live="assertive">
            <div className="size-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200">
              <AlertTriangle className="size-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-slate-900">Failed to load card batches</p>
              <p className="text-xs text-slate-600">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-slate-300 text-slate-700"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          /* Loading Skeleton State */
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading batches">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3 border-b border-slate-100 last:border-0">
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
          <div className="py-16 px-4 text-center space-y-3" aria-live="polite">
            <div className="size-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="size-7" />
            </div>
            <div className="space-y-1 max-w-xs mx-auto">
              <p className="text-sm font-bold text-slate-800">No cards yet</p>
              <p className="text-xs text-slate-500">
                Generate your first batch of physical membership cards using the form above.
              </p>
            </div>
          </div>
        ) : (
          /* Batches Table */
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="w-28 text-xs font-semibold text-slate-700">Batch</TableHead>
                  <TableHead className="min-w-44 text-xs font-semibold text-slate-700">Label</TableHead>
                  <TableHead className="min-w-48 text-xs font-semibold text-slate-700">Serials</TableHead>
                  <TableHead className="w-24 text-right text-xs font-semibold text-slate-700">Cards</TableHead>
                  <TableHead className="min-w-56 text-xs font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="min-w-44 text-xs font-semibold text-slate-700">Created</TableHead>
                  <TableHead className="min-w-36 text-xs font-semibold text-slate-700">Created By</TableHead>
                  <TableHead className="w-32 text-right text-xs font-semibold text-slate-700 pr-4">Actions</TableHead>
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
                        "transition-all duration-700 border-b border-slate-100 last:border-0 hover:bg-slate-50/60",
                        isHighlighted && "bg-sky-50 dark:bg-sky-950/40 ring-2 ring-inset ring-[#018BCE]/60"
                      )}
                    >
                      {/* Batch Number */}
                      <TableCell className="font-semibold text-slate-900 text-xs py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-[#0F3056] font-bold">
                            {formatBatchNumber(batch.number)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Batch Label */}
                      <TableCell className="text-xs text-slate-800 font-medium max-w-xs truncate py-3.5" title={batch.label}>
                        {batch.label}
                      </TableCell>

                      {/* Serials Range */}
                      <TableCell className="text-xs font-mono text-slate-600 py-3.5 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm text-[11px] font-semibold text-slate-700">
                          {batch.firstSerial}
                        </span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm text-[11px] font-semibold text-slate-700">
                          {batch.lastSerial}
                        </span>
                      </TableCell>

                      {/* Card Count */}
                      <TableCell className="text-right text-xs font-bold text-slate-900 py-3.5">
                        {formatNumber(batch.count)}
                      </TableCell>

                      {/* Status Badges */}
                      <TableCell className="py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                            {formatNumber(stats.unassigned)} unassigned
                          </span>
                          {stats.active > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {formatNumber(stats.active)} active
                            </span>
                          )}
                          {stats.void > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              {formatNumber(stats.void)} void
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Created Date (Africa/Cairo) */}
                      <TableCell className="text-xs text-slate-600 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="size-3 text-slate-400" />
                          <span>{formatCairoDate(batch.createdAt)}</span>
                        </div>
                      </TableCell>

                      {/* Created By */}
                      <TableCell className="text-xs text-slate-600 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <User className="size-3 text-slate-400" />
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
                          className="h-7.5 px-2.5 text-xs font-semibold text-[#0F3056] border-slate-300 hover:border-[#018BCE] hover:text-[#018BCE] hover:bg-sky-50/50 transition-colors"
                        >
                          <Download className="size-3 mr-1 text-[#018BCE]" />
                          Download ZIP
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
