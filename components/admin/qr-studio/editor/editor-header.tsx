"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import type { CheckResult } from "@/lib/qr-style/checks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  History,
  UploadCloud,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "cn";

export interface EditorHeaderProps {
  styleData: QrStyleDto;
  checks: CheckResult;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  saveError: string | null;
  onRetrySave: () => void;
  onNameChange: (newName: string) => void;
  onOpenPublish: () => void;
  onOpenDownload: () => void;
  onOpenHistory: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  styleData,
  checks,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  saveStatus,
  saveError,
  onRetrySave,
  onNameChange,
  onOpenPublish,
  onOpenDownload,
  onOpenHistory,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(styleData.name);

  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (nameValue.trim() && nameValue.trim() !== styleData.name) {
      onNameChange(nameValue.trim());
    }
    setIsEditingName(false);
  };

  const isBlocked = checks.overall === "block";

  return (
    <header className="px-3 py-2 sm:px-5 sm:py-2.5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 shrink-0 z-20 min-h-[56px]">
      {/* Left: Back Link & Style Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Link
          href="/admin/qr-studio"
          className="size-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-foreground cursor-pointer shrink-0 transition-colors"
          aria-label="Back to QR Studio library"
          title="Back to styles library"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingName ? (
              <form
                onSubmit={handleNameSubmit}
                className="flex items-center gap-1.5 min-w-0"
              >
                <input
                  type="text"
                  aria-label="Style name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={(event) => {
                    if (!event.currentTarget.form?.contains(event.relatedTarget)) {
                      handleNameSubmit();
                    }
                  }}
                  maxLength={80}
                  className="min-w-0 max-w-[min(55vw,16rem)] h-8 rounded-md border border-brand px-2 text-xs font-semibold text-foreground bg-white dark:bg-zinc-800 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="size-8 flex items-center justify-center rounded bg-brand text-white cursor-pointer"
                  aria-label="Save style name"
                >
                  <Check className="size-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 group min-w-0">
                <h1 className="font-semibold text-xs sm:text-sm text-foreground truncate tracking-tight">
                  {styleData.name}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setNameValue(styleData.name);
                    setIsEditingName(true);
                  }}
                  className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer rounded"
                  title="Rename style"
                  aria-label="Rename style"
                >
                  <Pencil className="size-3" />
                </button>
              </div>
            )}

            {/* Status Badge */}
            <span
              className={cn(
                "hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium",
                styleData.status === "published"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : styleData.status === "draft"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  : "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              )}
            >
              {styleData.status}
            </span>

            {styleData.isDefaultPrint && (
              <Badge variant="brand" className="hidden md:inline-flex text-[9px] font-medium py-0 h-4.5">
                Default Print
              </Badge>
            )}
          </div>

          {/* Autosave Status */}
          <div className="flex items-center gap-1.5" role="status" aria-live="polite">
            {saveStatus === "saving" ? (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <Loader2 className="size-2.5 animate-spin motion-reduce:animate-none text-brand" />
                Saving…
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="size-2.5" />
                Saved
              </span>
            ) : saveStatus === "error" ? (
              <span className="text-[10px] text-rose-700 dark:text-rose-300 flex items-center gap-1 font-mono" title={saveError || undefined}>
                <AlertCircle className="size-3 shrink-0" />
                <span>{saveError || "Error saving"}</span>
                <button type="button" onClick={onRetrySave} className="underline font-semibold ml-1 cursor-pointer">
                  Retry
                </button>
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                <AlertCircle className="size-2.5" />
                Unsaved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions on a single compact row */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-50 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="size-8 flex items-center justify-center rounded text-slate-600 dark:text-zinc-300 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="size-8 flex items-center justify-center rounded text-slate-600 dark:text-zinc-300 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>

        {/* Desktop Secondary Actions */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Button
            variant="surface"
            size="sm"
            onClick={onResetAll}
            className="min-h-[36px] h-9 px-2.5 text-xs font-semibold normal-case rounded-lg text-muted-foreground hover:text-foreground"
            title="Reset to NUSU defaults"
          >
            <RotateCcw className="size-3 mr-1" />
            <span>Reset</span>
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={onOpenHistory}
            className="min-h-[36px] h-9 px-2.5 text-xs font-semibold normal-case rounded-lg"
            title="View published versions"
          >
            <History className="size-3 mr-1 text-brand" />
            <span>History</span>
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={onOpenDownload}
            className="min-h-[36px] h-9 px-2.5 text-xs font-semibold normal-case rounded-lg"
            title="Export SVG or PNG"
          >
            <Download className="size-3 mr-1 text-sky-500" />
            <span>Export</span>
          </Button>
        </div>

        {/* Mobile Dropdown for Secondary Actions */}
        <div className="sm:hidden">
          <Dropdown align="right">
            <DropdownTrigger
              ariaLabel="More editor options"
              className="size-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </DropdownTrigger>
            <DropdownContent minWidth="min-w-[10rem]">
              <DropdownItem onClick={onResetAll}>
                <RotateCcw className="size-3.5 mr-2 text-ash" />
                <span>Reset to defaults</span>
              </DropdownItem>
              <DropdownItem onClick={onOpenHistory}>
                <History className="size-3.5 mr-2 text-brand" />
                <span>Version history</span>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={onOpenDownload}>
                <Download className="size-3.5 mr-2 text-sky-500" />
                <span>Export ZIP</span>
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>

        {/* Primary Action: Publish */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenPublish}
          disabled={isBlocked || saveStatus !== "saved"}
          className={cn(
            "min-h-[36px] h-9 px-3.5 text-xs font-semibold normal-case rounded-lg shadow-xs",
            isBlocked && "opacity-50 cursor-not-allowed"
          )}
          title={
            isBlocked
              ? "Cannot publish: Fix blocking scan-safety checks first"
              : saveStatus !== "saved"
              ? "Save the draft before publishing"
              : "Publish immutable version"
          }
        >
          <UploadCloud className="size-3.5 mr-1.5 stroke-[2.2]" />
          <span>Publish</span>
        </Button>
      </div>
    </header>
  );
};
