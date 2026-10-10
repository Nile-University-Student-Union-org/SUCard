"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { importStyleSchema } from "@/lib/qr-studio/validation";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDrop } from "@/components/ui/file-drop";
import { QrSvgPreview } from "../qr-svg-preview";
import { importStyle } from "../api";
import { toast } from "sonner";
import { Upload, FileJson } from "lucide-react";

export interface ImportStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStyleImported?: (styleId: string) => void;
}

export const ImportStyleModal: React.FC<ImportStyleModalProps> = ({
  isOpen,
  onClose,
  onStyleImported,
}) => {
  const router = useRouter();
  const [styleName, setStyleName] = useState("");
  const [importedConfig, setImportedConfig] = useState<QrStyleConfig | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (file: File) => {

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const parsed = importStyleSchema.safeParse(json);
        if (!parsed.success) {
          setError(
            `Invalid QR Style JSON: ${parsed.error.issues[0]?.message || "Schema mismatch"}`
          );
          setImportedConfig(null);
          return;
        }
        setStyleName(parsed.data.name);
        setImportedConfig(parsed.data.config);
      } catch {
        setError("Could not parse JSON file. Please verify file format.");
        setImportedConfig(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importedConfig || !styleName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await importStyle({
        schemaVersion: 1,
        name: styleName.trim(),
        config: importedConfig,
      });

      toast.success(`Imported style "${res.style.name}"`);
      onClose();
      if (onStyleImported) {
        onStyleImported(res.style.id);
      } else {
        router.push(`/admin/qr-studio/${res.style.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import style";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Import QR Style (JSON)"
      icon={<Upload className="size-5 text-brand" />}
      maxWidth="md"
    >
      <form onSubmit={handleImport}>
        <ModalBody className="space-y-4 text-xs">
          {/* File Picker */}
          <FileDrop
            label="Select JSON File"
            accept=".json,application/json"
            onFileSelect={handleFileSelect}
            fileName={fileName}
            icon={<FileJson className="size-5" />}
            title="Click to select or drop .json file"
            description="Compatible with SU Card Style JSON schema (v1)"
            error={error || undefined}
          />

          {/* Validated Preview & Name Edit */}
          {importedConfig && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Input
                id="importedStyleName"
                label="Imported Style Name"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                maxLength={80}
                required
              />

              <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-3">
                <div className="size-16 rounded-xl bg-slate-50 dark:bg-zinc-800 p-1 shrink-0 border border-slate-200 dark:border-zinc-700">
                  <QrSvgPreview config={importedConfig} className="w-full h-full" />
                </div>
                <div className="min-w-0 font-mono text-[11px] text-muted-foreground space-y-0.5">
                  <p className="font-bold text-foreground truncate">{styleName}</p>
                  <p>
                    Dot: {importedConfig.modules.shape} &bull; EC:{" "}
                    {importedConfig.encoding.ecLevel}
                  </p>
                  <p>Print: {importedConfig.output.printSizeMm} mm</p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            loadingText="Importing…"
            disabled={!importedConfig || !styleName.trim()}
            className="normal-case font-bold"
          >
            Import Style
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
