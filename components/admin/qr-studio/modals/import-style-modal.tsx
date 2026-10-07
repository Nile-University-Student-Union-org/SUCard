"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { importStyleSchema } from "@/lib/qr-studio/validation";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrSvgPreview } from "../qr-svg-preview";
import { importStyle } from "../api";
import { toast } from "sonner";
import { Upload, FileJson, Loader2, AlertCircle } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [styleName, setStyleName] = useState("");
  const [importedConfig, setImportedConfig] = useState<QrStyleConfig | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          <div className="space-y-2">
            <label className="font-bold text-foreground block">
              Select JSON File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
            >
              <FileJson className="size-8 text-brand" />
              <div>
                <p className="font-bold text-foreground">
                  {fileName ? fileName : "Click to select or drop .json file"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Compatible with SU Card Style JSON schema (v1)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
            disabled={isSubmitting || !importedConfig || !styleName.trim()}
            className="normal-case font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin motion-reduce:animate-none" />
                Importing…
              </>
            ) : (
              "Import Style"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
