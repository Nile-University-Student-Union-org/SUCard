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
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const lastSavedConfigRef = useRef<string>(JSON.stringify(initialStyle.draftConfig));
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setConfig((prev) => {
        const next = updater(prev);
        // Avoid adding identical state to history
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          setPastConfigs((history) => [...history.slice(-30), prev]);
          setFutureConfigs([]);
          setSaveStatus("unsaved");
        }
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (pastConfigs.length === 0) return;
    const previous = pastConfigs[pastConfigs.length - 1];
    setPastConfigs((p) => p.slice(0, p.length - 1));
    setFutureConfigs((f) => [config, ...f]);
    setConfig(previous);
    setSaveStatus("unsaved");
  }, [pastConfigs, config]);

  const handleRedo = useCallback(() => {
    if (futureConfigs.length === 0) return;
    const next = futureConfigs[0];
    setFutureConfigs((f) => f.slice(1));
    setPastConfigs((p) => [...p, config]);
    setConfig(next);
    setSaveStatus("unsaved");
  }, [futureConfigs, config]);

  const handleResetSection = useCallback((sectionKey: keyof QrStyleConfig) => {
    handleConfigChange((prev) => ({
      ...prev,
      [sectionKey]: structuredClone(NUSU_SIGNATURE_CONFIG[sectionKey]),
    }));
    toast.info(`Reset ${String(sectionKey)} to default`);
  }, [handleConfigChange]);

  const handleResetAll = useCallback(() => {
    handleConfigChange(() => structuredClone(NUSU_SIGNATURE_CONFIG));
    toast.info("Reset configuration to NUSU Signature defaults");
  }, [handleConfigChange]);

  const handleNameChange = async (newName: string) => {
    try {
      const res = await updateStyle(styleData.id, { name: newName });
      setStyleData(res.style);
      toast.success("Style renamed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename style";
      toast.error(msg);
    }
  };

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Debounced Autosave Effect
  useEffect(() => {
    const currentSerialized = JSON.stringify(config);
    if (currentSerialized === lastSavedConfigRef.current) {
      return;
    }

    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await updateStyle(styleData.id, { draftConfig: config });
        lastSavedConfigRef.current = JSON.stringify(config);
        setStyleData(res.style);
        setSaveStatus("saved");
      } catch (err) {
        console.warn("Autosave draft failed:", err);
        setSaveStatus("unsaved");
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, styleData.id]);

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
        onNameChange={handleNameChange}
        onOpenPublish={() => setIsPublishOpen(true)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main 3-Panel Studio Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Options Sidebar */}
        <aside
          className="w-full lg:w-[360px] xl:w-[400px] border-b lg:border-b-0 lg:border-r-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto p-4 shrink-0"
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
          className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto flex flex-col"
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
          className="w-full lg:w-[320px] xl:w-[360px] border-t lg:border-t-0 lg:border-l-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto p-4 shrink-0"
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
