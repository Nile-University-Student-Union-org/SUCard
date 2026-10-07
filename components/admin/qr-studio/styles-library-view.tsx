"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import {
  listStyles,
  createStyle,
  archiveStyle,
  unarchiveStyle,
  setDefaultStyle,
  downloadExportJson,
} from "./api";
import { QrSvgPreview } from "./qr-svg-preview";
import { NewStyleModal } from "./modals/new-style-modal";
import { ImportStyleModal } from "./modals/import-style-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  Download,
  Copy,
  Archive,
  ArchiveRestore,
  Globe,
  Printer,
  Search,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "cn";
import { formatCairoDate } from "@/components/admin/cards/utils";

export function StylesLibraryView() {
  const router = useRouter();
  const [styles, setStyles] = useState<QrStyleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "archived"
  >("all");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [duplicatingStyle, setDuplicatingStyle] = useState<QrStyleDto | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Archive confirm modal
  const [archivingStyle, setArchivingStyle] = useState<QrStyleDto | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchStyles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listStyles();
      setStyles(res.styles || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load styles";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listStyles()
      .then((res) => {
        if (active) {
          setStyles(res.styles || []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load styles");
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicatingStyle || !duplicateName.trim()) return;

    setIsDuplicating(true);
    try {
      const res = await createStyle({
        name: duplicateName.trim(),
        duplicateVersionId: duplicatingStyle.latestVersion?.id,
        config: duplicatingStyle.draftConfig,
      });
      toast.success(`Duplicated "${res.style.name}"`);
      setDuplicatingStyle(null);
      setDuplicateName("");
      fetchStyles();
      router.push(`/admin/qr-studio/${res.style.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate style";
      toast.error(msg);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleSetDefault = async (style: QrStyleDto, target: "print" | "web") => {
    if (style.status !== "published") {
      toast.error("Only published styles can be set as system defaults");
      return;
    }
    try {
      await setDefaultStyle(style.id, { target });
      toast.success(
        `Set "${style.name}" as default for ${target === "print" ? "Physical Print" : "Digital Web"}`
      );
      fetchStyles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set default";
      toast.error(msg);
    }
  };

  const handleToggleArchive = async () => {
    if (!archivingStyle) return;
    setIsArchiving(true);
    try {
      if (archivingStyle.status === "archived") {
        await unarchiveStyle(archivingStyle.id);
        toast.success(`Unarchived "${archivingStyle.name}"`);
      } else {
        await archiveStyle(archivingStyle.id);
        toast.success(`Archived "${archivingStyle.name}"`);
      }
      setArchivingStyle(null);
      fetchStyles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive style";
      toast.error(msg);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleExport = async (style: QrStyleDto) => {
    try {
      await downloadExportJson(style.id, style.name);
      toast.success(`Exported ${style.name} JSON`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(msg);
    }
  };

  // Filtered styles
  const filteredStyles = styles.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (
      searchQuery.trim() &&
      !s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground tracking-wide uppercase">
            QR STYLE STUDIO
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visual QR designer for Nile University cards &bull; Verified scan-safety &bull; Versioned print batches
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="surface"
            onClick={() => setIsImportModalOpen(true)}
            className="h-11 px-4 text-xs font-bold normal-case rounded-xl shadow-xs"
          >
            <Upload className="size-4 mr-1.5 text-brand" />
            <span>Import JSON</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsNewModalOpen(true)}
            className="h-11 px-5 text-xs font-bold normal-case rounded-xl shadow-xs"
          >
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            <span>New Style</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
          {(["all", "published", "draft", "archived"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
                statusFilter === tab
                  ? "bg-white dark:bg-zinc-900 text-brand dark:text-brand-soft shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search styles by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4"
            >
              <Skeleton className="aspect-square w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <StatusState
          variant="destructive"
          title="Failed to load styles"
          description={error}
          actions={
            <Button variant="outline" onClick={fetchStyles}>
              <RotateCcw className="size-4 mr-2" />
              Try again
            </Button>
          }
        />
      ) : filteredStyles.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 text-center space-y-4">
          <div className="size-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto border border-brand/20">
            <Sparkles className="size-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-heading uppercase text-foreground">
              No QR Styles Found
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No styles match your current filter criteria."
                : "Create your first branded QR style from one of the built-in presets or import an existing configuration."}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => setIsNewModalOpen(true)}
              className="normal-case font-bold"
            >
              <Plus className="size-4 mr-1.5" />
              Create First Style
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStyles.map((style) => {
            const previewConfig =
              style.latestVersion?.config ?? style.draftConfig;

            return (
              <div
                key={style.id}
                className={cn(
                  "rounded-2xl border-2 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group",
                  style.isDefaultPrint
                    ? "border-brand dark:border-brand-soft ring-1 ring-brand/30"
                    : "border-slate-200 dark:border-zinc-800"
                )}
              >
                {/* Visual Preview Canvas Top */}
                <Link
                  href={`/admin/qr-studio/${style.id}`}
                  className="p-6 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-center relative cursor-pointer group-hover:brightness-95 transition-all"
                  title="Click to open editor"
                >
                  <div className="w-44 h-44 sm:w-48 sm:h-48 p-3 rounded-2xl bg-white dark:bg-zinc-900 shadow-md border border-slate-200 dark:border-zinc-800 flex items-center justify-center">
                    <QrSvgPreview config={previewConfig} className="w-full h-full" />
                  </div>

                  {/* Top badges floating over thumbnail */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shadow-xs",
                        style.status === "published"
                          ? "bg-emerald-500 text-white"
                          : style.status === "draft"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-500 text-white"
                      )}
                    >
                      {style.status}
                    </span>

                    {style.isDefaultPrint && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3056] text-white shadow-xs border border-white/20">
                        Default Print
                      </span>
                    )}

                    {style.isDefaultWeb && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#018BCE] text-white shadow-xs">
                        Default Web
                      </span>
                    )}
                  </div>
                </Link>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/qr-studio/${style.id}`}
                        className="font-heading text-lg sm:text-xl uppercase tracking-wide text-foreground hover:text-brand transition-colors truncate"
                      >
                        {style.name}
                      </Link>
                      <span className="font-mono text-xs font-bold text-ash dark:text-zinc-400 shrink-0">
                        {style.latestVersion ? `v${style.latestVersion.version}` : "Draft"}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-1">
                      Updated {formatCairoDate(style.updatedAt)}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <ButtonLink
                      href={`/admin/qr-studio/${style.id}`}
                      variant="primary"
                      size="sm"
                      className="h-8 px-3 text-xs font-bold normal-case rounded-lg shadow-2xs"
                    >
                      Open Editor
                    </ButtonLink>

                    <div className="flex items-center gap-1">
                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => {
                          setDuplicatingStyle(style);
                          setDuplicateName(`${style.name} (Copy)`);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Duplicate style"
                        aria-label="Duplicate style"
                      >
                        <Copy className="size-4" />
                      </button>

                      {/* Export JSON */}
                      <button
                        type="button"
                        onClick={() => handleExport(style)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Export JSON"
                        aria-label="Export JSON"
                      >
                        <Download className="size-4" />
                      </button>

                      {/* Default Actions for Published Styles */}
                      {style.status === "published" && !style.isDefaultPrint && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(style, "print")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Set as Default for Physical Print"
                          aria-label="Set as default print"
                        >
                          <Printer className="size-4" />
                        </button>
                      )}

                      {style.status === "published" && !style.isDefaultWeb && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(style, "web")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Set as Default for Student Web Card"
                          aria-label="Set as default web"
                        >
                          <Globe className="size-4" />
                        </button>
                      )}

                      {/* Archive / Unarchive */}
                      {!style.isDefaultPrint && !style.isDefaultWeb && (
                        <button
                          type="button"
                          onClick={() => setArchivingStyle(style)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            style.status === "archived"
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800"
                          )}
                          title={
                            style.status === "archived"
                              ? "Unarchive style"
                              : "Archive style"
                          }
                          aria-label={style.status === "archived" ? "Unarchive" : "Archive"}
                        >
                          {style.status === "archived" ? (
                            <ArchiveRestore className="size-4" />
                          ) : (
                            <Archive className="size-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: NEW STYLE */}
      <NewStyleModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      {/* MODAL 2: IMPORT STYLE */}
      <ImportStyleModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* MODAL 3: DUPLICATE STYLE */}
      <Modal
        isOpen={duplicatingStyle !== null}
        onClose={() => setDuplicatingStyle(null)}
        title="Duplicate QR Style"
        icon={<Copy className="size-5 text-brand" />}
        maxWidth="sm"
      >
        <form onSubmit={handleDuplicate}>
          <ModalBody className="space-y-3 text-xs">
            <Input
              id="duplicateNameInput"
              label="New Style Name"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              disabled={isDuplicating}
              maxLength={80}
              required
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isDuplicating}
              onClick={() => setDuplicatingStyle(null)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isDuplicating || !duplicateName.trim()}
              className="normal-case font-bold"
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Duplicating…
                </>
              ) : (
                "Duplicate & Open"
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 4: ARCHIVE CONFIRMATION */}
      <Modal
        isOpen={archivingStyle !== null}
        onClose={() => setArchivingStyle(null)}
        title={
          archivingStyle?.status === "archived"
            ? `Unarchive ${archivingStyle?.name}?`
            : `Archive ${archivingStyle?.name}?`
        }
        icon={
          archivingStyle?.status === "archived" ? (
            <ArchiveRestore className="size-5 text-emerald-600" />
          ) : (
            <Archive className="size-5 text-rose-600" />
          )
        }
        maxWidth="sm"
      >
        <ModalBody className="space-y-2 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            {archivingStyle?.status === "archived"
              ? "Unarchiving this style will restore it to the active styles library."
              : "Archiving this style removes it from active batch style pickers. Existing batches using published versions of this style will remain functional."}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isArchiving}
            onClick={() => setArchivingStyle(null)}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={
              archivingStyle?.status === "archived" ? "primary" : "destructive"
            }
            disabled={isArchiving}
            onClick={handleToggleArchive}
            className="normal-case font-bold"
          >
            {isArchiving ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Updating…
              </>
            ) : archivingStyle?.status === "archived" ? (
              "Unarchive Style"
            ) : (
              "Archive Style"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
