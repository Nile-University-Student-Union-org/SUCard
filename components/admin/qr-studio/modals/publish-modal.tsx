"use client";

import React, { useState } from "react";
import type { CheckResult } from "@/lib/qr-style/checks";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publishStyle } from "../api";
import { toast } from "sonner";
import {
  UploadCloud,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleId: string;
  styleName: string;
  checks: CheckResult;
  onPublished: (versionNumber: number) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  styleId,
  styleName,
  checks,
  onPublished,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlocked = checks.overall === "block";
  const hasWarnings = checks.overall === "warn";

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;
    if (hasWarnings && reason.trim().length < 5) {
      setError("Please provide an acceptance reason of at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await publishStyle(styleId, {
        acceptWarningsReason: hasWarnings ? reason.trim() : undefined,
      });
      toast.success(`Published ${styleName} (v${res.version.version})`, {
        description: "This version is now ready for card batches.",
      });
      onPublished(res.version.version);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to publish style";
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
      title={`Publish ${styleName}`}
      icon={<UploadCloud className="size-5 text-brand" />}
      maxWidth="md"
    >
      <form onSubmit={handlePublish}>
        <ModalBody className="space-y-4 text-xs">
          {isBlocked ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <XCircle className="size-4 shrink-0" />
                <span>Cannot publish style with blocking errors</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Scan-safety validation failed critical contrast or finder-pattern clearance checks. Adjust your colors or module dimensions before publishing.
              </p>
            </div>
          ) : hasWarnings ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Scan-Safety Warnings Detected</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  One or more parameters (e.g. low contrast or small quiet zone) may reduce scanning reliability on older phones. You must record a formal reason to proceed.
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  id="publishReason"
                  label="Acceptance Reason (Required, min 5 chars)"
                  placeholder="e.g. Approved high-contrast glossy print run"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  minLength={5}
                  required
                  autoFocus
                  helperText={`${reason.trim().length}/5 characters minimum — recorded in audit log`}
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>All Scan Checks Passed</span>
              </div>
              <p className="text-[11px]">
                This style is fully compliant with print and camera readability standards.
              </p>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
              {error}
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

          {!isBlocked && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || (hasWarnings && reason.trim().length < 5)}
              className="normal-case font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Publishing…
                </>
              ) : (
                "Publish Immutable Version"
              )}
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
};
