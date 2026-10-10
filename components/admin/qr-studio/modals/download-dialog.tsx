"use client";

import React, { useState } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { downloadPreviewFile } from "../api";
import { toast } from "sonner";
import { Download, FileCode, Image as ImageIcon } from "lucide-react";

export interface DownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: QrStyleConfig;
  styleName: string;
  payload?: string;
}

export const DownloadDialog: React.FC<DownloadDialogProps> = ({
  isOpen,
  onClose,
  config,
  styleName,
  payload = "NUSU1:0123456789ABCDEFGHJK",
}) => {
  const [format, setFormat] = useState<"svg" | "png">("svg");
  const [dpi, setDpi] = useState<300 | 600 | 1200>(600);
  const [transparent, setTransparent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const cleanName = styleName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = `${cleanName}-preview.${format}`;
      await downloadPreviewFile(
        {
          config,
          payload,
          format,
          dpi,
          transparent,
          printSizeMm: config.output.printSizeMm,
        },
        filename
      );
      toast.success(`Downloaded ${filename}`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isDownloading) onClose();
      }}
      title={`Export ${styleName}`}
      icon={<Download className="size-5 text-brand" />}
      maxWidth="sm"
    >
      <ModalBody className="space-y-4 text-xs">
        {/* Format Selector */}
        <div className="space-y-2">
          <label className="font-bold text-foreground">Export File Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat("svg")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                format === "svg"
                  ? "bg-brand text-white border-brand shadow-xs font-bold"
                  : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
              }`}
            >
              <FileCode className="size-5" />
              <span>Vector (SVG)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat("png")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                format === "png"
                  ? "bg-brand text-white border-brand shadow-xs font-bold"
                  : "bg-white dark:bg-zinc-800 text-foreground border-slate-200 dark:border-zinc-700 hover:border-brand/40"
              }`}
            >
              <ImageIcon className="size-5" />
              <span>Raster (PNG)</span>
            </button>
          </div>
        </div>

        {/* PNG Options */}
        {format === "png" && (
          <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Print DPI</label>
              <SegmentedControl
                options={[
                  { value: "300", label: "300 DPI" },
                  { value: "600", label: "600 DPI" },
                  { value: "1200", label: "1200 DPI" },
                ]}
                value={String(dpi)}
                onChange={(val) => setDpi(Number(val) as 300 | 600 | 1200)}
                ariaLabel="Export DPI"
                fullWidth
                size="sm"
              />
            </div>

            <div className="pt-1">
              <Checkbox
                id="transparent-bg"
                checked={transparent}
                onCheckedChange={(checked) => setTransparent(checked)}
                label="Transparent background"
              />
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          disabled={isDownloading}
          onClick={onClose}
          className="normal-case font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={isDownloading}
          loadingText="Exporting…"
          onClick={handleDownload}
          className="normal-case font-bold"
        >
          {`Download ${format.toUpperCase()}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
