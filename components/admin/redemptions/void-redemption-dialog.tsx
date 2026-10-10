"use client";

import React, { useState } from "react";
import { Ban, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { voidRedemption } from "./api";
import type { RedemptionDto } from "@/lib/vendors/types";

interface VoidRedemptionDialogProps {
  redemption: RedemptionDto | null;
  isOpen: boolean;
  onClose: () => void;
  onRedemptionVoided: (id: string, reason: string) => void;
}

export function VoidRedemptionDialog({
  redemption,
  isOpen,
  onClose,
  onRedemptionVoided,
}: VoidRedemptionDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redemption) return;

    if (!reason.trim()) {
      setError("Please provide a reason for voiding this redemption");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await voidRedemption(redemption.id, reason.trim());
      onRedemptionVoided(redemption.id, reason.trim());
      toast.success("Redemption voided successfully");
      setReason("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to void redemption"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          setReason("");
          setError(null);
          onClose();
        }
      }}
      title="Void Redemption Record"
      description="Mark scan as voided and restore student quota"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {error && (
            <Alert variant="destructive" title="Error">
              {error}
            </Alert>
          )}

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Audit Trail Warning</span>
            </div>
            <p>
              Voiding a redemption does not delete the row. It marks the record as voided, restores the student&apos;s discount usage limit, and records this action in the audit log.
            </p>
          </div>

          {redemption && (
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-bold text-foreground">{redemption.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-bold text-foreground">{redemption.studentName || "—"} ({redemption.universityId || "—"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offer:</span>
                <span className="font-bold text-brand dark:text-brand-soft">{redemption.offerTitle || "—"}</span>
              </div>
              {redemption.billAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bill Amount:</span>
                  <span className="font-mono font-bold text-foreground">EGP {parseFloat(redemption.billAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="void-reason" className="text-xs font-semibold">
              Reason for Voiding <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="void-reason"
              required
              rows={3}
              placeholder="e.g. Scanned by cashier by mistake / Wrong order entered / Customer returned item"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setReason("");
              setError(null);
              onClose();
            }}
            disabled={isSubmitting}
            className="normal-case font-semibold min-h-[44px] h-11 px-4"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="destructive"
            loading={isSubmitting}
            loadingText="Voiding…"
            className="normal-case font-bold min-h-[44px] h-11 px-5"
          >
            <Ban className="size-4 mr-1.5" />
            <span>Confirm Void</span>
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
