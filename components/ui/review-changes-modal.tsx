"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "./modal";
import { Button } from "./button";
import { Badge } from "./badge";
import { Alert } from "./alert";
import { cn } from "@/lib/utils";
import type { ChangeItem, ListItemChange } from "@/lib/settings/diff";

export interface ReviewChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  changes: ChangeItem[];
  isSaving?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

function ExpandableText({
  text,
  maxChars = 75,
}: {
  text: string;
  maxChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxChars;

  if (!isLong) {
    return <span className="break-all">{text}</span>;
  }

  return (
    <span className="break-all">
      {expanded ? text : `${text.slice(0, maxChars)}… `}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] font-bold text-brand dark:text-brand-soft hover:underline ml-1 cursor-pointer select-none inline-block align-baseline"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </span>
  );
}

function FormattedValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return (
      <Badge
        variant={value ? "brand" : "secondary"}
        size="sm"
        className="font-bold text-[11px] px-2 py-0.5"
      >
        {value ? "On" : "Off"}
      </Badge>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic">—</span>;
  }

  const str = String(value);
  return <ExpandableText text={str} />;
}

function ListItemRow({ item }: { item: ListItemChange }) {
  if (item.type === "added") {
    return (
      <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge
            variant="outline"
            size="sm"
            className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold shrink-0"
          >
            + Added
          </Badge>
          <span className="font-semibold text-foreground break-all">
            {item.label}
          </span>
        </div>
      </div>
    );
  }

  if (item.type === "removed") {
    return (
      <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge
            variant="outline"
            size="sm"
            className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold shrink-0"
          >
            − Removed
          </Badge>
          <span className="font-medium text-muted-foreground line-through break-all">
            {item.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Badge
          variant="outline"
          size="sm"
          className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold shrink-0"
        >
          ~ Changed
        </Badge>
        <span className="font-bold text-foreground">{item.label}</span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="line-through text-muted-foreground opacity-80">
          {item.oldValue}
        </span>
        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
        <span className="font-semibold text-brand dark:text-brand-soft bg-brand/10 dark:bg-brand/20 px-1.5 py-0.5 rounded">
          {item.newValue}
        </span>
      </div>
    </div>
  );
}

function ChangeRow({ change }: { change: ChangeItem }) {
  if (change.type === "list" && change.listChanges) {
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-xs sm:text-sm text-foreground">
            {change.label}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {change.listChanges.length} update{change.listChanges.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          {change.listChanges.map((item, idx) => (
            <ListItemRow key={idx} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-xs sm:text-sm text-foreground">
          {change.label}
        </span>
        {change.category && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            {change.category}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm pt-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="line-through text-muted-foreground opacity-80 break-all">
            <FormattedValue value={change.oldValue} />
          </span>
        </div>

        <ArrowRight className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="inline-flex items-center font-semibold text-brand dark:text-brand-soft bg-brand/10 dark:bg-brand/20 px-2 py-1 rounded-lg break-all">
            <FormattedValue value={change.newValue} />
          </div>
        </div>
      </div>
    </div>
  );
}

const COUNTDOWN_SECONDS = 3;
const COUNTDOWN_MS = COUNTDOWN_SECONDS * 1000;

function ReviewChangesModalContent({
  onClose,
  onConfirm,
  changes,
  isSaving,
  confirmText,
  cancelText,
}: {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  changes: ChangeItem[];
  isSaving: boolean;
  confirmText: string;
  cancelText: string;
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, COUNTDOWN_MS - elapsed);
      const secs = Math.ceil(remaining / 1000);

      setSecondsRemaining(secs);
      setProgress(Math.min(1, elapsed / COUNTDOWN_MS));

      if (remaining <= 0) {
        setIsCountingDown(false);
        clearInterval(interval);
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const highImpactChanges = changes.filter((c) => c.isHighImpact);

  return (
    <>
      <ModalBody className="space-y-4 max-h-[60dvh] overflow-y-auto thin-scrollbar">
        {/* High-impact warning banner */}
        {highImpactChanges.length > 0 && (
          <div className="space-y-2">
            {highImpactChanges.map((change) => (
              <Alert
                key={change.id}
                variant="warning"
                size="sm"
                title={`High Impact: ${change.label}`}
                description={
                  change.impactWarning ||
                  "This change will have immediate effects on active operations."
                }
                icon={
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                }
              />
            ))}
          </div>
        )}

        {/* Changes list */}
        {changes.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground italic rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border-2 border-slate-200/80 dark:border-zinc-800">
            No pending changes detected.
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map((change) => (
              <ChangeRow key={change.id} change={change} />
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 order-2 sm:order-1">
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <span>
            {isCountingDown
              ? `Review enabled in ${secondsRemaining}s…`
              : "Review complete. Ready to apply."}
          </span>
        </div>

        <div className="flex items-center gap-2.5 order-1 sm:order-2">
          <Button
            type="button"
            variant="surface"
            disabled={isSaving}
            onClick={onClose}
            className="normal-case font-semibold min-h-[44px] px-4 flex-1 sm:flex-initial"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={isCountingDown || isSaving || changes.length === 0}
            loading={isSaving}
            loadingText="Saving…"
            onClick={() => void onConfirm()}
            className={cn(
              "normal-case font-bold min-h-[44px] px-6 min-w-[170px] flex-1 sm:flex-initial relative overflow-hidden",
              isCountingDown && "cursor-not-allowed opacity-60"
            )}
          >
            {isCountingDown ? (
              <div className="flex items-center justify-center gap-2">
                {/* SVG Progress Ring */}
                <svg className="size-4 -rotate-90 shrink-0" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="stroke-white/30"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="stroke-white transition-all duration-75 ease-linear"
                    strokeWidth="3"
                    strokeDasharray={56.5}
                    strokeDashoffset={56.5 * (1 - progress)}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span>Save in {secondsRemaining}…</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{confirmText}</span>
              </div>
            )}
          </Button>
        </div>
      </ModalFooter>
    </>
  );
}

export function ReviewChangesModal({
  isOpen,
  onClose,
  onConfirm,
  changes,
  isSaving = false,
  title = "Review & Confirm Changes",
  description = "Review all pending updates before applying them to the system.",
  confirmText = "Confirm & save",
  cancelText = "Cancel",
}: ReviewChangesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={title}
      description={description}
      icon={<FileText className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="2xl"
      role="alertdialog"
    >
      {isOpen && (
        <ReviewChangesModalContent
          onClose={onClose}
          onConfirm={onConfirm}
          changes={changes}
          isSaving={isSaving}
          confirmText={confirmText}
          cancelText={cancelText}
        />
      )}
    </Modal>
  );
}
