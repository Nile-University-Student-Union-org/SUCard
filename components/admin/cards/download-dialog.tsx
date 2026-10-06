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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DownloadDialogProps {
  batch: Batch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DownloadDialog({ batch, open, onOpenChange }: DownloadDialogProps) {
  const [exportSvg, setExportSvg] = useState(true);
  const [exportPng, setExportPng] = useState(false);
  const [pngSize, setPngSize] = useState<600 | 1200 | 2400>(1200);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setExportSvg(true);
      setExportPng(false);
      setPngSize(1200);
    }
    onOpenChange(nextOpen);
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

    // Initiate browser download via virtual link
    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute(
      "download",
      `batch-${String(batch.number).padStart(3, "0")}-qr-export.zip`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info("Preparing ZIP…", {
      description: `Generating QR codes for ${formatNumber(batch.count)} cards. Large batches may take a minute.`,
    });

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <div className="size-10 rounded-full bg-sky-50 border border-sky-200 text-[#018BCE] flex items-center justify-center mb-1">
            <Download className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-[#0F3056]">
            Export QR Codes — {formatBatchNumber(batch.number)}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Download a ZIP archive containing high-quality QR codes for {formatNumber(batch.count)} physical cards ({batch.firstSerial} → {batch.lastSerial}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format Options */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
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
                  className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                >
                  <FileCode className="size-3.5 text-[#0F548D]" />
                  SVG Vector (Recommended for printing)
                </Label>
                <p className="text-[11px] text-slate-500">
                  Lossless vector format that can be scaled infinitely for card production.
                </p>
              </div>
            </div>

            {/* PNG Checkbox */}
            <div className="flex items-start gap-3 pt-1 border-t border-slate-200/60">
              <Checkbox
                id="format-png"
                checked={exportPng}
                onCheckedChange={(checked) => setExportPng(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="space-y-1 leading-none w-full">
                <Label
                  htmlFor="format-png"
                  className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                >
                  <ImageIcon className="size-3.5 text-[#018BCE]" />
                  PNG Raster Image
                </Label>
                <p className="text-[11px] text-slate-500">
                  Standard raster image files with a white background.
                </p>

                {/* PNG Resolution Select */}
                {exportPng && (
                  <div className="pt-2">
                    <Label htmlFor="png-size" className="text-[11px] font-medium text-slate-600 mb-1 block">
                      PNG Resolution:
                    </Label>
                    <Select
                      value={String(pngSize)}
                      onValueChange={(val) => {
                        if (val) setPngSize(Number(val) as 600 | 1200 | 2400);
                      }}
                    >
                      <SelectTrigger id="png-size" className="h-8 text-xs bg-white border-slate-300">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="600">600 × 600 px (Compact)</SelectItem>
                        <SelectItem value="1200">1200 × 1200 px (Standard Print)</SelectItem>
                        <SelectItem value="2400">2400 × 2400 px (Ultra HD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {!isFormValid && (
              <p className="text-xs text-red-600 font-medium pt-1">
                Please select at least one format (SVG or PNG).
              </p>
            )}
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sky-50/80 border border-sky-200/70 text-sky-900 text-xs">
            <Info className="size-4 shrink-0 text-[#018BCE] mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Each card gets its own QR file named by serial number (e.g. <span className="font-mono font-medium">SU-000001.svg</span>). Large batches with PNG can take a minute to pack.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isFormValid}
            onClick={handleDownload}
            className="bg-[#0F3056] text-white hover:bg-[#0F548D] disabled:opacity-50"
          >
            <Download className="size-4 mr-1.5" />
            Download ZIP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
