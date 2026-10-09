"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { NUSU_SIGNATURE_CONFIG } from "@/lib/qr-style/config";
import { checkStyle, type CheckResult } from "@/lib/qr-style/checks";
import { updateStyle, createStyle } from "../api";
import { EditorHeader } from "./editor-header";
import { OptionsSidebar } from "./options-sidebar";
import { LivePreviewPanel } from "../preview/live-preview-panel";
import { ChecksPanel } from "../checks/checks-panel";
import { PublishModal } from "../modals/publish-modal";
import { DownloadDialog } from "../modals/download-dialog";
import { VersionHistoryModal } from "../modals/version-history-modal";
import { QrSvgPreview } from "../qr-svg-preview";
import { Sliders, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface EditorViewProps {
  initialStyle: QrStyleDto;
}

export function EditorView({ initialStyle }: EditorViewProps) {
  const router = useRouter();
  const [styleData, setStyleData] = useState<QrStyleDto>(initialStyle);
  const [config, setConfig] = useState<QrStyleConfig>(initialStyle.draftConfig);
  const [payload, setPayload] = useState<string>("NUSU1:0123456789ABCDEFGHJK");

  // History stack for Undo / Redo
  const [pastConfigs, setPastConfigs] = useState<QrStyleConfig[]>([]);
  const [futureConfigs, setFutureConfigs] = useState<QrStyleConfig[]>([]);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedConfigRef = useRef<string>(JSON.stringify(initialStyle.draftConfig));
  const latestConfigRef = useRef(config);
  const draftRevisionRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraftRef = useRef<() => Promise<void>>(async () => {});

  // Modals state
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Layout tabs & mobile preview state
  const [activeTab, setActiveTab] = useState<"controls" | "checks">("controls");
  const [isMobilePreviewCollapsed, setIsMobilePreviewCollapsed] = useState(false);

  // Live checks
  const checks: CheckResult = React.useMemo(() => {
    try {
      return checkStyle(config);
    } catch {
      return {
        contrast: [],
        logoCoverage: { percent: 0, safeLimit: 18, level: "ok" },
        moduleSizeMm: { value: 0.75, level: "ok" },
        quietZone: { value: 2, level: "ok" },
        eyesIntact: { value: true, level: "ok" },
        overall: "ok",
      };
    }
  }, [config]);

  // Push new state with undo support
  const handleConfigChange = useCallback(
    (updater: (prev: QrStyleConfig) => QrStyleConfig) => {
      draftRevisionRef.current += 1;
      setConfig((prev) => {
        const next = updater(prev);
        // Avoid adding identical state to history
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          setPastConfigs((history) => [...history.slice(-30), prev]);
          setFutureConfigs([]);
          setSaveStatus("unsaved");
          setSaveError(null);
        }
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (pastConfigs.length === 0) return;
    draftRevisionRef.current += 1;
    const previous = pastConfigs[pastConfigs.length - 1];
    setPastConfigs((p) => p.slice(0, p.length - 1));
    setFutureConfigs((f) => [config, ...f]);
    setConfig(previous);
    setSaveStatus("unsaved");
    setSaveError(null);
  }, [pastConfigs, config]);

  const handleRedo = useCallback(() => {
    if (futureConfigs.length === 0) return;
    draftRevisionRef.current += 1;
    const next = futureConfigs[0];
    setFutureConfigs((f) => f.slice(1));
    setPastConfigs((p) => [...p, config]);
    setConfig(next);
    setSaveStatus("unsaved");
    setSaveError(null);
  }, [futureConfigs, config]);

  const handleResetSection = useCallback((sectionKey: keyof QrStyleConfig | "color") => {
    if (sectionKey === "color") {
      handleConfigChange((prev) => ({
        ...prev,
        modules: structuredClone(NUSU_SIGNATURE_CONFIG.modules),
        background: structuredClone(NUSU_SIGNATURE_CONFIG.background),
      }));
    } else {
      handleConfigChange((prev) => ({
        ...prev,
        [sectionKey]: structuredClone(NUSU_SIGNATURE_CONFIG[sectionKey]),
      }));
    }
    toast.info(`Reset ${sectionKey} to default`);
  }, [handleConfigChange]);

  const handleResetAll = useCallback(() => {
    handleConfigChange(() => structuredClone(NUSU_SIGNATURE_CONFIG));
    toast.info("Reset configuration to NUSU Signature defaults");
  }, [handleConfigChange]);

  const handleNameChange = async (newName: string) => {
    try {
      const res = await updateStyle(styleData.id, { name: newName });
      setStyleData((current) => ({ ...current, name: res.style.name }));
      toast.success("Style renamed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename style";
      toast.error(msg);
    }
  };

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select, [contenteditable]") || target.closest("[role='dialog']"))
      ) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const saveDraft = useCallback(async () => {
    if (saveInFlightRef.current) return;
    const draft = latestConfigRef.current;
    const serialized = JSON.stringify(draft);
    const revision = draftRevisionRef.current;
    if (serialized === lastSavedConfigRef.current) {
      setSaveStatus("saved");
      setSaveError(null);
      return;
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      await updateStyle(styleData.id, { draftConfig: draft });
      lastSavedConfigRef.current = serialized;
      if (draftRevisionRef.current === revision && JSON.stringify(latestConfigRef.current) === serialized) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => void saveDraftRef.current(), 600);
      }
    } catch (err) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveError(err instanceof Error ? err.message : "Draft could not be saved.");
      setSaveStatus("error");
    } finally {
      saveInFlightRef.current = false;
    }
  }, [styleData.id]);
  useEffect(() => {
    saveDraftRef.current = saveDraft;
  }, [saveDraft]);

  // Save requests are serialized; only the current draft can be marked saved.
  useEffect(() => {
    latestConfigRef.current = config;
    const currentSerialized = JSON.stringify(config);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (currentSerialized === lastSavedConfigRef.current) {
      if (!saveInFlightRef.current) setSaveStatus("saved");
      return;
    }

    setSaveStatus("unsaved");
    saveTimeoutRef.current = setTimeout(() => void saveDraftRef.current(), 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config]);

  // Unsaved changes warning on browser tab close / navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus !== "saved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  const handleDuplicateVersionAsNew = async (versionId: string) => {
    try {
      const res = await createStyle({
        name: `${styleData.name} (Copy)`,
        duplicateVersionId: versionId,
      });
      toast.success("Created duplicate style");
      router.push(`/admin/qr-studio/${res.style.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate style";
      toast.error(msg);
    }
  };

  return (
    <div className="-m-3.5 sm:-m-6 lg:-m-8 flex flex-col h-[calc(100dvh-57px)] max-h-[calc(100dvh-57px)] overflow-hidden bg-slate-100/70 dark:bg-zinc-950">
      {/* Top Header Bar */}
      <EditorHeader
        styleData={styleData}
        checks={checks}
        canUndo={pastConfigs.length > 0}
        canRedo={futureConfigs.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetAll={handleResetAll}
        saveStatus={saveStatus}
        saveError={saveError}
        onRetrySave={() => void saveDraft()}
        onNameChange={handleNameChange}
        onOpenPublish={() => setIsPublishOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Workspace: Side-by-side on md and up, single stacked column on mobile */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Controls & Checks (Scrolls independently) */}
        <div
          className="w-full md:w-[420px] lg:w-[460px] xl:w-[480px] shrink-0 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden"
          aria-label="Editor controls"
        >
          {/* Mobile-Only Sticky Live Preview (< md) */}
          <div className="md:hidden sticky top-0 z-20 shrink-0 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-zinc-800/90 border-b border-slate-200/60 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 rounded border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white p-0.5 shrink-0">
                  <QrSvgPreview config={config} payload={payload} className="w-full h-full" />
                </div>
                <span className="text-xs font-semibold text-charcoal dark:text-white truncate">
                  Live Preview
                </span>
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    checks.overall === "ok"
                      ? "bg-emerald-500"
                      : checks.overall === "warn"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  )}
                  title={`Check status: ${checks.overall}`}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePreviewCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand dark:text-brand-soft hover:underline px-2 py-1 cursor-pointer"
                aria-expanded={!isMobilePreviewCollapsed}
              >
                <span>{isMobilePreviewCollapsed ? "Expand" : "Collapse"}</span>
                {isMobilePreviewCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
              </button>
            </div>

            {/* Mobile Expanded Preview Canvas (max ~38% viewport height) */}
            {!isMobilePreviewCollapsed && (
              <div className="max-h-[38vh] min-h-[160px] flex flex-col p-3 bg-slate-100/80 dark:bg-zinc-950/80">
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 shadow-md border border-slate-200/80 dark:border-zinc-800/80 max-h-[32vh] aspect-square flex items-center justify-center">
                    <QrSvgPreview config={config} payload={payload} className="w-full h-full max-h-[30vh]" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 text-[10px] font-mono text-muted-foreground border-t border-slate-200/60 dark:border-zinc-800/60">
                  <span>EC: {config.encoding.ecLevel} · {config.output.printSizeMm}mm</span>
                  <span className="text-foreground truncate max-w-[160px]">{payload}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Selector: Design Controls vs Compliance Checks */}
          <div className="p-2.5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/90 shrink-0">
            <div className="grid grid-cols-2 gap-1 bg-slate-200/70 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("controls")}
                className={cn(
                  "py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors",
                  activeTab === "controls"
                    ? "bg-white dark:bg-zinc-900 text-charcoal dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-foreground"
                )}
              >
                <Sliders className="size-3.5 text-sky-500" />
                <span>Controls</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("checks")}
                className={cn(
                  "py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors",
                  activeTab === "checks"
                    ? "bg-white dark:bg-zinc-900 text-charcoal dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-foreground"
                )}
              >
                <ShieldCheck className="size-3.5 text-sky-500" />
                <span>Checks &amp; Output</span>
                <span
                  className={cn(
                    "size-2 rounded-full",
                    checks.overall === "ok"
                      ? "bg-emerald-500"
                      : checks.overall === "warn"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  )}
                  title={`Status: ${checks.overall}`}
                />
              </button>
            </div>
          </div>

          {/* Scrollable controls panel */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {activeTab === "controls" ? (
              <OptionsSidebar
                config={config}
                onChange={handleConfigChange}
                onResetSection={handleResetSection}
              />
            ) : (
              <ChecksPanel config={config} payload={payload} />
            )}
          </div>
        </div>

        {/* Right Column: Live Preview Workspace (Visible and fixed on md and up) */}
        <main
          className="hidden md:flex flex-1 min-w-0 p-4 lg:p-6 overflow-y-auto flex-col h-full bg-slate-50/50 dark:bg-zinc-950"
          aria-label="Live preview workspace"
        >
          <LivePreviewPanel
            config={config}
            styleName={styleData.name}
            payload={payload}
            onPayloadChange={setPayload}
          />
        </main>
      </div>

      {/* Modals */}
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        styleId={styleData.id}
        styleName={styleData.name}
        checks={checks}
        onPublished={() => {
          setStyleData((s) => ({ ...s, status: "published" }));
          router.refresh();
        }}
      />

      <DownloadDialog
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        config={config}
        styleName={styleData.name}
        payload={payload}
      />

      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        styleName={styleData.name}
        latestVersion={styleData.latestVersion}
        onDuplicateVersion={handleDuplicateVersionAsNew}
      />
    </div>
  );
}
