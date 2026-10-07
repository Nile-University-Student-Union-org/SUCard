"use client";

import React from "react";
import type { QrStyleVersionDto } from "@/lib/qr-studio/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { History, Copy, Calendar, AlertTriangle } from "lucide-react";
import { formatCairoDate } from "@/components/admin/cards/utils";

export interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleName: string;
  latestVersion: QrStyleVersionDto | null;
  onDuplicateVersion: (versionId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  styleName,
  latestVersion,
  onDuplicateVersion,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${styleName} — Version History`}
      icon={<History className="size-5 text-brand" />}
      maxWidth="md"
    >
      <ModalBody className="space-y-4 text-xs">
        {!latestVersion ? (
          <p className="text-muted-foreground italic text-center py-6">
            No published immutable versions yet. Publish this draft to create version 1.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-brand text-white">
                    v{latestVersion.version}
                  </span>
                  <span className="font-bold text-foreground">
                    Latest Published Version
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDuplicateVersion(latestVersion.id);
                    onClose();
                  }}
                  className="h-8 px-2 text-xs font-bold normal-case rounded-lg"
                >
                  <Copy className="size-3 mr-1" />
                  Duplicate as New
                </Button>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
                <Calendar className="size-3.5" />
                <span>Published on {formatCairoDate(latestVersion.publishedAt)}</span>
              </div>

              {latestVersion.acceptedWarningsReason && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] space-y-1 mt-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="size-3.5" />
                    <span>Accepted Warning Reason:</span>
                  </div>
                  <p className="italic">
                    &ldquo;{latestVersion.acceptedWarningsReason}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
                <span>
                  EC: <strong>{latestVersion.config.encoding.ecLevel}</strong>
                </span>
                &bull;
                <span>
                  Dot: <strong>{latestVersion.config.modules.shape}</strong>
                </span>
                &bull;
                <span>
                  Print: <strong>{latestVersion.config.output.printSizeMm} mm</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="normal-case font-semibold"
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
