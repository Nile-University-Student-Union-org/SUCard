"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import type { CheckResult } from "@/lib/qr-style/checks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  saveStatus: "saved" | "saving" | "unsaved";
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
    <header className="px-4 py-3 sm:px-6 sm:py-3.5 border-b-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
      {/* Left: Back Link & Style Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/admin/qr-studio"
          className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-foreground transition-all cursor-pointer shrink-0"
          aria-label="Back to QR Studio library"
          title="Back to styles library"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingName ? (
              <form
                onSubmit={handleNameSubmit}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={() => handleNameSubmit()}
                  maxLength={80}
                  className="h-8 rounded-lg border-2 border-brand px-2 text-sm font-black font-heading uppercase text-foreground bg-white dark:bg-zinc-800 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 rounded bg-brand text-white cursor-pointer"
                >
                  <Check className="size-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h1 className="font-heading text-lg sm:text-xl uppercase tracking-wide text-foreground truncate">
                  {styleData.name}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setNameValue(styleData.name);
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 transition-opacity cursor-pointer"
                  title="Rename style"
                >
                  <Pencil className="size-3" />
                </button>
              </div>
            )}

            {/* Badges */}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono",
                styleData.status === "published"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : styleData.status === "draft"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  : "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              )}
            >
              {styleData.status}
            </span>

            {styleData.isDefaultPrint && (
              <Badge variant="brand" className="text-[10px] font-bold py-0 h-5">
                Default Print
              </Badge>
            )}

            {styleData.isDefaultWeb && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-2xs">
                Default Web
              </span>
            )}
          </div>

          {/* Autosave Status */}
          <div className="flex items-center gap-2 mt-0.5">
            {saveStatus === "saving" ? (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <Loader2 className="size-3 animate-spin text-brand" />
                Saving draft…
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="size-3" />
                Saved
              </span>
            ) : (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                <AlertCircle className="size-3" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: History, Undo/Redo, Reset, Download, Publish */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-50 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </button>
        </div>

        {/* Reset All */}
        <Button
          variant="surface"
          size="sm"
          onClick={onResetAll}
          className="h-9 px-2.5 text-xs font-bold normal-case rounded-xl text-muted-foreground hover:text-foreground"
          title="Reset to default config"
        >
          <RotateCcw className="size-3.5 mr-1" />
          <span>Reset</span>
        </Button>

        {/* Version History */}
        <Button
          variant="surface"
          size="sm"
          onClick={onOpenHistory}
          className="h-9 px-2.5 text-xs font-bold normal-case rounded-xl"
          title="View published versions"
        >
          <History className="size-3.5 mr-1 text-brand" />
          <span>History</span>
        </Button>

        {/* Download Export */}
        <Button
          variant="surface"
          size="sm"
          onClick={onOpenDownload}
          className="h-9 px-2.5 text-xs font-bold normal-case rounded-xl"
          title="Export SVG or PNG"
        >
          <Download className="size-3.5 mr-1 text-sky-500" />
          <span>Export</span>
        </Button>

        {/* Publish Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenPublish}
          disabled={isBlocked}
          className={cn(
            "h-9 px-4 text-xs font-bold normal-case rounded-xl shadow-xs",
            isBlocked && "opacity-50 cursor-not-allowed"
          )}
          title={
            isBlocked
              ? "Cannot publish: Fix blocking scan-safety checks first"
              : "Publish immutable version"
          }
        >
          <UploadCloud className="size-4 mr-1.5 stroke-[2.5]" />
          <span>Publish</span>
        </Button>
      </div>
    </header>
  );
};
