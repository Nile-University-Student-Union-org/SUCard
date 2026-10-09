"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Inbox,
  RotateCcw,
  AlertTriangle,
  Ban,
  Palette,
  Truck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { Batch } from "@/lib/cards/types";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import { formatNumber, formatBatchNumber, formatCairoDate } from "./utils";
import { voidBatch, updateBatch } from "./api";
import { listStyles } from "@/components/admin/qr-studio/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "cn";

interface BatchesTableProps {
  batches: Batch[];
  isLoading: boolean;
  error: string | null;
  highlightedBatchId: string | null;
  onRetry: () => void;
  onDownloadClick: (batch: Batch) => void;
}

interface StatusMeta {
  label: string;
  badgeClass: string;
  next?: Batch["printStatus"];
  nextLabel?: string;
  nextActionText?: string;
  consequenceText?: string;
}

const PRINT_STATUS_MAP: Record<Batch["printStatus"], StatusMeta> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700 font-semibold",
    next: "sent_to_printer",
    nextLabel: "Send to Printer",
    nextActionText: "Send to Printer",
    consequenceText: "Advancing to Sent to Printer locks the QR visual style for this batch so print archive files match the physical cards.",
  },
  sent_to_printer: {
    label: "Sent to Printer",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-bold",
    next: "received",
    nextLabel: "Mark Received",
    nextActionText: "Mark Received",
    consequenceText: "Confirms that physical printed cards have arrived at Nile University Student Union office.",
  },
  received: {
    label: "Cards Received",
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-bold",
    next: "distributing",
    nextLabel: "Start Distributing",
    nextActionText: "Start Distributing",
    consequenceText: "Marks cards as actively available at the desk for student collection and linkage.",
  },
  distributing: {
    label: "Active Distribution",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold",
  },
};

export function BatchesTable({
  batches,
  isLoading,
  error,
  highlightedBatchId,
  onRetry,
  onDownloadClick,
}: BatchesTableProps) {
  // Void modal state
  const [voidingBatch, setVoidingBatch] = useState<Batch | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  // Print Status modal state
  const [statusBatch, setStatusBatch] = useState<Batch | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Restyle modal state
  const [restyleBatch, setRestyleBatch] = useState<Batch | null>(null);
  const [restyleVersionId, setRestyleVersionId] = useState<string>("");
  const [publishedStyles, setPublishedStyles] = useState<QrStyleDto[]>([]);
  const [isRestyling, setIsRestyling] = useState(false);

  useEffect(() => {
    listStyles()
      .then((res) => {
        setPublishedStyles(
          (res.styles || []).filter(
            (s) => s.status === "published" && s.latestVersion !== null
          )
        );
      })
      .catch((err) => console.warn("Failed to load styles for restyle:", err));
  }, []);

  const handleVoidUnassigned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingBatch) return;

    setIsVoiding(true);
    setVoidError(null);

    try {
      await voidBatch(
        voidingBatch.id,
        voidReason.trim() || "Batch unassigned cards voided"
      );

      toast.success(
        `Voided unassigned cards in ${formatBatchNumber(voidingBatch.number)}`
      );
      setVoidingBatch(null);
      setVoidReason("");
      onRetry();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setVoidError(errorObj.message || "Failed to void unassigned cards");
    } finally {
      setIsVoiding(false);
    }
  };

  const handleAdvanceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusBatch) return;
    const next = PRINT_STATUS_MAP[statusBatch.printStatus]?.next;
    if (!next) return;

    setIsUpdatingStatus(true);
    try {
      await updateBatch(statusBatch.id, {
        printStatus: next,
        printStatusNote: statusNote.trim() || undefined,
      });
      toast.success(
        `Updated ${formatBatchNumber(statusBatch.number)} status to ${PRINT_STATUS_MAP[next].label}`
      );
      setStatusBatch(null);
      setStatusNote("");
      onRetry();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRestyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restyleBatch || !restyleVersionId) return;

    setIsRestyling(true);
    try {
      await updateBatch(restyleBatch.id, {
        qrStyleVersionId: restyleVersionId,
      });
      toast.success(`Updated QR style for ${formatBatchNumber(restyleBatch.number)}`);
      setRestyleBatch(null);
      onRetry();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restyle batch";
      toast.error(msg);
    } finally {
      setIsRestyling(false);
    }
  };

  return (
    <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs rounded-xl overflow-hidden">
      <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80">
        <div>
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
            Card batches
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Historical list of generated physical batches, print lifecycle progression, and export downloads.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" className="text-xs font-semibold">
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
                <Button variant="outline" size="sm" onClick={onRetry} className="normal-case min-h-[44px]">
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
            <EmptyState
              icon={<Inbox className="size-7" />}
              title="No cards yet"
              hint="Generate your first batch of physical membership cards using the form above."
            />
          </div>
        ) : (
          <>
            {/* Desktop Batches Table (hidden on mobile < 1024px) */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Batch</TableHead>
                    <TableHead className="min-w-40">Label &amp; Style</TableHead>
                    <TableHead className="min-w-36">Print State</TableHead>
                    <TableHead className="min-w-44">Serials Range</TableHead>
                    <TableHead className="w-20 text-right">Cards</TableHead>
                    <TableHead className="min-w-44">Stock Breakdown</TableHead>
                    <TableHead className="min-w-44">Next Step</TableHead>
                    <TableHead className="text-right pr-4 min-w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const isHighlighted = highlightedBatchId === batch.id;
                    const stats = batch.stats || { unassigned: batch.count, active: 0, void: 0 };
                    const isDraft = batch.printStatus === "draft";
                    const statusInfo = PRINT_STATUS_MAP[batch.printStatus] || PRINT_STATUS_MAP.draft;

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
                          <span className="font-mono text-xs text-brand dark:text-brand-soft font-bold block">
                            {formatBatchNumber(batch.number)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-sans">
                            {formatCairoDate(batch.createdAt)}
                          </span>
                        </TableCell>

                        {/* Batch Label & Style */}
                        <TableCell className="text-xs py-3.5">
                          <p className="font-bold text-foreground truncate max-w-[180px]" title={batch.label}>
                            {batch.label}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate max-w-[180px]">
                            <Palette className="size-3 text-brand shrink-0" />
                            <span className="truncate">
                              {batch.styleVersion
                                ? `${batch.styleVersion.styleName} v${batch.styleVersion.version}`
                                : "Default Print"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Print Status */}
                        <TableCell className="py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border w-fit",
                                statusInfo.badgeClass
                              )}
                            >
                              {statusInfo.label}
                            </span>
                            {batch.printStatusNote && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[130px]" title={batch.printStatusNote}>
                                {batch.printStatusNote}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Serials Range */}
                        <TableCell className="text-xs font-mono py-3.5 whitespace-nowrap tabular-nums">
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-charcoal dark:text-zinc-200">
                            {batch.firstSerial}
                          </span>
                          <span className="mx-1 text-ash dark:text-zinc-500">&rarr;</span>
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-charcoal dark:text-zinc-200">
                            {batch.lastSerial}
                          </span>
                        </TableCell>

                        {/* Card Count */}
                        <TableCell className="text-right text-xs font-bold text-charcoal dark:text-white py-3.5 tabular-nums">
                          {formatNumber(batch.count)}
                        </TableCell>

                        {/* Status Badges */}
                        <TableCell className="py-3.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              {formatNumber(stats.unassigned)} unassigned
                            </span>
                            {stats.active > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {formatNumber(stats.active)} active
                              </span>
                            )}
                            {stats.void > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                {formatNumber(stats.void)} void
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Next Step / Prominent Lifecycle Action */}
                        <TableCell className="py-3.5">
                          {statusInfo.next ? (
                            <Button
                              variant="surface"
                              size="sm"
                              onClick={() => {
                                setStatusBatch(batch);
                                setStatusNote(batch.printStatusNote || "");
                              }}
                              className="min-h-[40px] px-3 text-xs font-bold normal-case text-brand dark:text-brand-soft border-brand/30 hover:bg-brand/10"
                            >
                              <span>{statusInfo.nextActionText}</span>
                              <ArrowRight className="size-3.5 ml-1.5" />
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="size-3.5" />
                              Distribution
                            </span>
                          )}
                        </TableCell>

                        {/* Secondary Actions */}
                        <TableCell className="text-right py-3.5 pr-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Restyle button (only allowed while draft) */}
                            {isDraft && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRestyleBatch(batch);
                                  setRestyleVersionId(batch.styleVersion?.id || "");
                                }}
                                className="min-h-[40px] px-2 text-xs font-semibold normal-case rounded-xl text-muted-foreground hover:text-foreground"
                                title="Restyle batch with a different published QR style"
                              >
                                <Palette className="size-3.5 mr-1 text-brand" />
                                Restyle
                              </Button>
                            )}

                            {/* Download ZIP */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadClick(batch)}
                              className="min-h-[40px] px-2.5 text-xs font-bold normal-case text-brand dark:text-brand-soft border-slate-200 dark:border-zinc-700"
                              title="Download QR SVG/PNG ZIP export"
                            >
                              <Download className="size-3.5 mr-1" />
                              ZIP
                            </Button>

                            {/* Void unassigned */}
                            {stats.unassigned > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setVoidingBatch(batch);
                                  setVoidReason("");
                                  setVoidError(null);
                                }}
                                className="min-h-[40px] px-2.5 text-xs font-bold normal-case text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/10"
                                title="Void remaining unassigned cards"
                              >
                                <Ban className="size-3.5 mr-1" />
                                Void
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List (< 1024px) */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-zinc-800 p-3 space-y-3">
              {batches.map((batch) => {
                const isHighlighted = highlightedBatchId === batch.id;
                const stats = batch.stats || { unassigned: batch.count, active: 0, void: 0 };
                const isDraft = batch.printStatus === "draft";
                const statusInfo = PRINT_STATUS_MAP[batch.printStatus] || PRINT_STATUS_MAP.draft;

                return (
                  <div
                    key={batch.id}
                    className={cn(
                      "p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 space-y-3 transition-all",
                      isHighlighted && "ring-2 ring-brand"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-brand dark:text-brand-soft">
                          {formatBatchNumber(batch.number)}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {formatCairoDate(batch.createdAt)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border",
                          statusInfo.badgeClass
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {batch.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Palette className="size-3 text-brand" />
                        <span>
                          {batch.styleVersion
                            ? `${batch.styleVersion.styleName} v${batch.styleVersion.version}`
                            : "Default Print Style"}
                        </span>
                      </p>
                      <p className="text-[11px] font-mono text-ash dark:text-zinc-400 mt-1">
                        Serials: {batch.firstSerial} &rarr; {batch.lastSerial} ({formatNumber(batch.count)} cards)
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

                    {/* Prominent Next Action on Mobile */}
                    {statusInfo.next && (
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <Button
                          variant="surface"
                          size="sm"
                          onClick={() => {
                            setStatusBatch(batch);
                            setStatusNote(batch.printStatusNote || "");
                          }}
                          className="w-full min-h-[44px] text-xs font-bold normal-case text-brand dark:text-brand-soft border-brand/30 flex items-center justify-center gap-1.5"
                        >
                          <span>{statusInfo.nextActionText}</span>
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Mobile Secondary Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        {isDraft && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRestyleBatch(batch);
                              setRestyleVersionId(batch.styleVersion?.id || "");
                            }}
                            className="min-h-[44px] flex-1 text-xs font-bold normal-case"
                          >
                            <Palette className="size-3.5 mr-1 text-brand" />
                            Restyle
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadClick(batch)}
                          className="min-h-[44px] flex-1 text-xs font-bold normal-case text-brand dark:text-brand-soft"
                        >
                          <Download className="size-3.5 mr-1" />
                          Export ZIP
                        </Button>

                        {stats.unassigned > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVoidingBatch(batch);
                              setVoidReason("");
                              setVoidError(null);
                            }}
                            className="min-h-[44px] text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 normal-case px-3"
                          >
                            <Ban className="size-3.5 mr-1" />
                            Void
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      {/* MODAL 1: ADVANCE PRINT STATUS */}
      <Modal
        isOpen={statusBatch !== null}
        onClose={() => {
          if (!isUpdatingStatus) setStatusBatch(null);
        }}
        title={`Advance Lifecycle: ${statusBatch ? formatBatchNumber(statusBatch.number) : ""}`}
        icon={<Truck className="size-5 text-brand" />}
        maxWidth="md"
      >
        <form onSubmit={handleAdvanceStatus}>
          <ModalBody className="space-y-4 text-xs">
            {statusBatch && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">Target Batch:</span>
                  <span className="font-bold text-foreground">
                    {formatBatchNumber(statusBatch.number)} — {statusBatch.label} ({formatNumber(statusBatch.count)} cards)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">Current Status:</span>
                  <span className="font-mono font-bold text-foreground">
                    {PRINT_STATUS_MAP[statusBatch.printStatus]?.label}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200/80 dark:border-zinc-700/80">
                  <span className="text-brand dark:text-brand-soft font-bold">Next Lifecycle Stage:</span>
                  <span className="font-mono font-bold text-brand dark:text-brand-soft flex items-center gap-1">
                    <ArrowRight className="size-3" />
                    {PRINT_STATUS_MAP[statusBatch.printStatus]?.next
                      ? PRINT_STATUS_MAP[PRINT_STATUS_MAP[statusBatch.printStatus].next!].label
                      : "None"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  <strong>Consequence:</strong> {PRINT_STATUS_MAP[statusBatch.printStatus]?.consequenceText}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-foreground block">
                Status Note / Printing Vendor Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sent to Al-Ahram print house / Invoice #402"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                maxLength={500}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-[10px] text-muted-foreground">
                Recorded in the permanent audit trail along with the transition timestamp.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdatingStatus}
              onClick={() => setStatusBatch(null)}
              className="normal-case font-semibold min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUpdatingStatus}
              loadingText="Updating…"
              className="normal-case font-bold min-h-[44px]"
            >
              Confirm Transition
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 2: RESTYLE BATCH */}
      <Modal
        isOpen={restyleBatch !== null}
        onClose={() => {
          if (!isRestyling) setRestyleBatch(null);
        }}
        title={`Restyle Batch: ${restyleBatch ? formatBatchNumber(restyleBatch.number) : ""}`}
        icon={<Palette className="size-5 text-brand" />}
        maxWidth="md"
      >
        <form onSubmit={handleRestyle}>
          <ModalBody className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 space-y-1.5">
              <p className="font-bold text-foreground">
                Target: {restyleBatch ? `${formatBatchNumber(restyleBatch.number)} — ${restyleBatch.label}` : ""}
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                <strong>Consequence:</strong> Re-renders all QR codes in this batch with the newly selected visual style. Cryptographic tokens and serial numbers remain identical.
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                Select Published QR Style
              </label>
              <select
                value={restyleVersionId}
                onChange={(e) => setRestyleVersionId(e.target.value)}
                disabled={isRestyling || publishedStyles.length === 0}
                className="w-full min-h-[44px] rounded-xl border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
              >
                {publishedStyles.map((s) => (
                  <option key={s.id} value={s.latestVersion!.id}>
                    {s.name} (v{s.latestVersion!.version})
                    {s.isDefaultPrint ? " — Default Print" : ""}
                  </option>
                ))}
              </select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isRestyling}
              onClick={() => setRestyleBatch(null)}
              className="normal-case font-semibold min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!restyleVersionId}
              loading={isRestyling}
              loadingText="Restyling…"
              className="normal-case font-bold min-h-[44px]"
            >
              Save & Restyle Batch
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 3: VOID UNASSIGNED CARDS */}
      <Modal
        isOpen={voidingBatch !== null}
        onClose={() => {
          if (!isVoiding) setVoidingBatch(null);
        }}
        title="Void Unassigned Cards"
        icon={<Ban className="size-5 text-rose-600" />}
        maxWidth="md"
        role="alertdialog"
      >
        <form onSubmit={handleVoidUnassigned}>
          <ModalBody className="space-y-4">
            {voidingBatch && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
                <p className="font-bold text-rose-700 dark:text-rose-300">
                  Target Batch: {formatBatchNumber(voidingBatch.number)} — {voidingBatch.label}
                </p>
                <p className="text-muted-foreground">
                  Unassigned cards to void:{" "}
                  <strong>
                    {formatNumber(voidingBatch.stats?.unassigned ?? voidingBatch.count)} cards
                  </strong>
                </p>
                <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1 leading-relaxed">
                  <strong>Consequence:</strong> Only unassigned cards in this batch will be permanently destroyed. Any cards from this batch already linked to active students will remain completely unaffected and valid.
                </p>
              </div>
            )}

            {voidError && (
              <Alert variant="destructive" size="sm" description={voidError} />
            )}

            <Input
              id="batchVoidReason"
              label="Void Reason"
              placeholder="e.g. Batch reprint, cards discarded or misprinted"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              helperText="Recorded in the permanent audit trail"
              required
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isVoiding}
              onClick={() => setVoidingBatch(null)}
              className="normal-case font-semibold min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!voidReason.trim()}
              loading={isVoiding}
              loadingText="Voiding…"
              className="normal-case font-bold min-h-[44px]"
            >
              Confirm & Void Cards
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
}
