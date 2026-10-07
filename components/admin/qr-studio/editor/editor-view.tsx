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
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden bg-slate-100/70 dark:bg-zinc-950">
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

      {/* 3 panels side by side from 1400px (the admin sidebar takes ~250px); below that one scrolling column, preview first */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto min-[1400px]:flex-row min-[1400px]:overflow-hidden">
        {/* Left Column: Options Sidebar */}
        <aside
          className="w-full min-[1400px]:w-[360px] 2xl:w-[400px] border-b min-[1400px]:border-b-0 min-[1400px]:border-r-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-[1400px]:overflow-y-auto p-4 shrink-0"
          aria-label="Style options"
        >
          <OptionsSidebar
            config={config}
            onChange={handleConfigChange}
            onResetSection={handleResetSection}
          />
        </aside>

        {/* Center Column: Live Preview Workspace */}
        <main
          className="order-first min-[1400px]:order-none flex-1 min-w-0 p-4 sm:p-6 min-[1400px]:overflow-y-auto flex flex-col"
          aria-label="Live preview"
        >
          <LivePreviewPanel
            config={config}
            styleName={styleData.name}
            payload={payload}
            onPayloadChange={setPayload}
          />
        </main>

        {/* Right Column: Scan Checks & Print Breakdown */}
        <aside
          className="w-full min-[1400px]:w-[320px] 2xl:w-[360px] border-t min-[1400px]:border-t-0 min-[1400px]:border-l-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-[1400px]:overflow-y-auto p-4 shrink-0"
          aria-label="Scan checks and output"
        >
          <ChecksPanel config={config} payload={payload} />
        </aside>
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
