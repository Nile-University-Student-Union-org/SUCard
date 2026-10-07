"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileCode, ImageIcon, Info } from "lucide-react";
import type { Batch } from "@/lib/cards/types";
import { getBatchExportUrl } from "./api";
import { formatBatchNumber, formatNumber } from "./utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Modal,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

interface DownloadDialogProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DownloadDialog({ batch, open, onOpenChange }: DownloadDialogProps) {
  const [exportSvg, setExportSvg] = useState(true);
  const [exportPng, setExportPng] = useState(false);
  const [pngSize, setPngSize] = useState<600 | 1200 | 2400>(1200);

  const handleClose = () => {
    setExportSvg(true);
    setExportPng(false);
    setPngSize(1200);
    onOpenChange(false);
  };

  if (!batch) return null;

  const isFormValid = exportSvg || exportPng;

  const handleDownload = () => {
    if (!isFormValid) return;

    const exportUrl = getBatchExportUrl(batch.id, {
      svg: exportSvg,
      png: exportPng,
      pngSize,
    });

    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute(
      "download",
      `batch-${String(batch.number).padStart(3, "0")}-qr-export.zip`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info("Preparing ZIP export…", {
      description: `Generating QR codes for ${formatNumber(batch.count)} cards. Large batches may take a minute.`,
    });

    handleClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={`Export QR Codes — ${formatBatchNumber(batch.number)}`}
      icon={<Download className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="md"
    >
      <ModalBody className="space-y-4">
        <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
          <p className="font-bold text-foreground">
            Target: {formatBatchNumber(batch.number)} — {batch.label}
          </p>
          <p className="text-muted-foreground">
            Total Cards: <strong>{formatNumber(batch.count)} physical cards</strong> ({batch.firstSerial} &rarr; {batch.lastSerial})
          </p>
        </div>

        {/* Format Options */}
        <div className="space-y-3 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
            Export Formats
          </p>

          {/* SVG Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="format-svg"
              checked={exportSvg}
              onCheckedChange={(checked) => setExportSvg(Boolean(checked))}
              className="mt-0.5"
            />
            <div className="space-y-0.5 leading-none">
              <Label
                htmlFor="format-svg"
                className="text-xs font-bold text-charcoal dark:text-zinc-100 cursor-pointer flex items-center gap-1.5"
              >
                <FileCode className="size-3.5 text-brand dark:text-brand-soft" />
                SVG Vector (Recommended for physical card printing)
              </Label>
              <p className="text-[11px] text-ash dark:text-zinc-400">
                Lossless vector format that can be scaled infinitely for card production.
              </p>
            </div>
          </div>

          {/* PNG Checkbox */}
          <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
            <Checkbox
              id="format-png"
              checked={exportPng}
              onCheckedChange={(checked) => setExportPng(Boolean(checked))}
              className="mt-0.5"
            />
            <div className="space-y-2 leading-none w-full">
              <Label
                htmlFor="format-png"
                className="text-xs font-bold text-charcoal dark:text-zinc-100 cursor-pointer flex items-center gap-1.5"
              >
                <ImageIcon className="size-3.5 text-sky-600 dark:text-sky-400" />
                PNG Raster Image
              </Label>
              <p className="text-[11px] text-ash dark:text-zinc-400">
                Standard raster image files with a white background.
              </p>

              {/* PNG Resolution Dropdown */}
              {exportPng && (
                <div className="pt-2">
                  <Dropdown
                    label="PNG Resolution"
                    value={String(pngSize)}
                    onChange={(val) => setPngSize(Number(val) as 600 | 1200 | 2400)}
                    options={[
                      { value: "600", label: "600 × 600 px (Compact)" },
                      { value: "1200", label: "1200 × 1200 px (Standard Print)" },
                      { value: "2400", label: "2400 × 2400 px (Ultra HD)" },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {!isFormValid && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold pt-1">
              Please select at least one format (SVG or PNG).
            </p>
          )}
        </div>

        {/* Warning Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs">
          <Info className="size-4 shrink-0 text-brand dark:text-brand-soft mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Each card gets its own QR file named by serial number (e.g. <span className="font-mono font-bold">SU-000001.svg</span>). Large batches with PNG can take a minute to pack.
          </p>
        </div>
      </ModalBody>

      <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          className="normal-case min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!isFormValid}
          onClick={handleDownload}
          className="normal-case min-h-[44px]"
        >
          <Download className="size-4 mr-1.5" />
          Download ZIP
        </Button>
      </ModalFooter>
    </Modal>
  );
}
