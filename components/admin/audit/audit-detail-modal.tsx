"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  ScrollText,
  Copy,
  Check,
  Clock,
  User,
  Tag,
  Layers,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import type { AuditEntry } from "@/lib/staff/types";
import {
  formatCairoDate,
  formatRelativeTime,
  getAuditActionSummary,
  getAuditActionBadge,
} from "./utils";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { copyToClipboard } from "@/lib/clipboard";

interface AuditDetailModalProps {
  entry: AuditEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailModal({ entry, isOpen, onClose }: AuditDetailModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!entry) return null;

  const actionBadge = getAuditActionBadge(entry.action);
  const summary = getAuditActionSummary(entry);
  const jsonString = JSON.stringify(entry.data || {}, null, 2);
  const actorDisplayName = entry.actorName || entry.actorEmail || "System";

  const handleCopyJson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(jsonString);
    if (ok) {
      setIsCopied(true);
      toast.success("JSON payload copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Event Details"
      description="Inspect administrative operation, actor, and target resource."
      icon={<ScrollText className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="lg"
    >
      <ModalBody className="space-y-4">
        {/* 1. Primary Action & Summary Hero Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-200 dark:border-zinc-700 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={actionBadge.variant} className="text-xs font-bold uppercase tracking-wider">
                {actionBadge.label}
              </Badge>
              <span className="text-[11px] font-mono text-ash dark:text-zinc-400">
                {entry.action}
              </span>
            </div>
            <span className="font-mono text-[11px] text-ash dark:text-zinc-400">
              ID: {entry.id.slice(0, 12)}…
            </span>
          </div>

          <p className="text-sm sm:text-base font-bold text-charcoal dark:text-white leading-snug">
            {summary}
          </p>
        </div>

        {/* 2. Structured Metadata Grid: Actor, Time, Entity Type, Entity ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Actor Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
              <User className="size-3.5 text-brand dark:text-brand-soft shrink-0" />
              <span>Actor (Initiator)</span>
            </div>
            <p className="font-bold text-sm text-charcoal dark:text-white truncate">
              {actorDisplayName}
            </p>
            {entry.actorEmail && entry.actorName && (
              <p className="text-[11px] text-ash dark:text-zinc-400 truncate font-mono">
                {entry.actorEmail}
              </p>
            )}
          </div>

          {/* Timestamp Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
              <Clock className="size-3.5 text-brand dark:text-brand-soft shrink-0" />
              <span>Timestamp (Cairo)</span>
            </div>
            <p className="font-bold text-sm text-charcoal dark:text-white">
              {formatCairoDate(entry.createdAt)}
            </p>
            <p className="text-[11px] text-ash dark:text-zinc-400">
              {formatRelativeTime(entry.createdAt)}
            </p>
          </div>

          {/* Target Entity Type Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
              <Layers className="size-3.5 text-brand dark:text-brand-soft shrink-0" />
              <span>Target Resource Type</span>
            </div>
            <p className="font-mono font-bold text-sm text-charcoal dark:text-white">
              {entry.entity}
            </p>
          </div>

          {/* Target Entity ID Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
              <Tag className="size-3.5 text-brand dark:text-brand-soft shrink-0" />
              <span>Target Resource ID</span>
            </div>
            <p
              className="font-mono font-bold text-xs text-charcoal dark:text-white truncate"
              title={entry.entityId}
            >
              {entry.entityId}
            </p>
          </div>
        </div>

        {/* 3. Collapsible Technical Details / Raw JSON Payload */}
        <details className="group rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all">
          <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-charcoal dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/60 min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-ash dark:text-zinc-400 shrink-0" />
              <span>Technical Details & Payload (JSON)</span>
            </div>
            <ChevronDown className="size-4 text-ash dark:text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="p-4 pt-1 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-ash dark:text-zinc-400">
                {Object.keys(entry.data || {}).length} payload field{Object.keys(entry.data || {}).length === 1 ? "" : "s"}
              </span>

              <button
                type="button"
                onClick={handleCopyJson}
                className="min-h-[44px] px-3 text-xs font-bold text-brand dark:text-brand-soft hover:underline inline-flex items-center gap-1.5 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
              >
                {isCopied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600 animate-icon-morph" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-60 no-scrollbar">
              <pre className="select-text whitespace-pre-wrap">{jsonString}</pre>
            </div>
          </div>
        </details>
      </ModalBody>

      <ModalFooter className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={onClose}
          className="normal-case font-bold min-h-[44px] h-11 px-6"
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
