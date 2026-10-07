"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { ScrollText, Copy, Check, Clock, User, Tag, Layers } from "lucide-react";
import type { AuditEntry } from "@/lib/staff/types";
import { formatCairoDate, getAuditActionSummary, getAuditActionBadge } from "./utils";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setIsCopied(true);
      toast.success("JSON payload copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Event Details"
      icon={<ScrollText className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="lg"
    >
      <ModalBody className="space-y-4">
        {/* Header Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-200 dark:border-zinc-700 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={actionBadge.variant} className="text-xs font-bold uppercase">
              {actionBadge.label}
            </Badge>
            <span className="font-mono text-[11px] text-ash dark:text-zinc-400">
              ID: {entry.id}
            </span>
          </div>
          <p className="text-sm font-bold text-charcoal dark:text-white leading-snug">
            {summary}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Actor */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px]">
              <User className="size-3.5" />
              <span>Actor</span>
            </div>
            <p className="font-bold text-charcoal dark:text-white truncate">
              {entry.actorName || entry.actorEmail || "System"}
            </p>
            {entry.actorEmail && entry.actorName && (
              <p className="text-[11px] text-ash dark:text-zinc-400 truncate">
                {entry.actorEmail}
              </p>
            )}
          </div>

          {/* Timestamp */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px]">
              <Clock className="size-3.5" />
              <span>Timestamp (Cairo)</span>
            </div>
            <p className="font-bold text-charcoal dark:text-white">
              {formatCairoDate(entry.createdAt)}
            </p>
          </div>

          {/* Target Entity */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px]">
              <Layers className="size-3.5" />
              <span>Entity Type</span>
            </div>
            <p className="font-mono font-bold text-charcoal dark:text-white">
              {entry.entity}
            </p>
          </div>

          {/* Target Entity ID */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
            <div className="flex items-center gap-1.5 text-ash dark:text-zinc-400 font-bold uppercase text-[10px]">
              <Tag className="size-3.5" />
              <span>Entity ID</span>
            </div>
            <p className="font-mono font-bold text-charcoal dark:text-white truncate" title={entry.entityId}>
              {entry.entityId}
            </p>
          </div>
        </div>

        {/* JSON Payload Viewer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
              Event Payload (JSON)
            </label>
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs font-bold text-brand dark:text-brand-soft hover:underline inline-flex items-center gap-1 cursor-pointer select-none"
            >
              {isCopied ? (
                <>
                  <Check className="size-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-64 no-scrollbar">
            <pre className="select-text whitespace-pre-wrap">{jsonString}</pre>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={onClose}
          className="normal-case font-bold"
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
