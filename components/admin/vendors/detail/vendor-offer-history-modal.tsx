"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History, Clock, AlertCircle, ImageIcon } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import { listOfferRevisions } from "../api";
import { formatDiscount } from "@/lib/vendors/types";
import { cn } from "cn";
import type { OfferDto, OfferRevisionDto } from "@/lib/vendors/types";

interface VendorOfferHistoryModalProps {
  offer: OfferDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorOfferHistoryModal({
  offer,
  isOpen,
  onClose,
}: VendorOfferHistoryModalProps) {
  const [revisions, setRevisions] = useState<OfferRevisionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    if (!offer) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await listOfferRevisions(offer.id);
      setRevisions(res.revisions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load offer revisions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [offer]);

  useEffect(() => {
    if (isOpen && offer) {
      let active = true;
      listOfferRevisions(offer.id)
        .then((res) => {
          if (active) {
            setRevisions(res.revisions || []);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(
              err instanceof Error ? err.message : "Failed to load offer revisions"
            );
            setIsLoading(false);
          }
        });
      return () => {
        active = false;
      };
    }
  }, [isOpen, offer]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Cairo",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Offer Revision History — ${offer?.title || ""}`}
      maxWidth="lg"
    >
      <ModalBody className="space-y-4 max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-border bg-card/60 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : error ? (
          <StatusState
            icon={<AlertCircle className="size-6" />}
            variant="warning"
            title="Could not load history"
            description={error}
            actions={
              <Button variant="primary" onClick={fetchRevisions} className="normal-case font-bold mt-2">
                Retry
              </Button>
            }
          />
        ) : revisions.length === 0 ? (
          <StatusState
            icon={<History className="size-6" />}
            variant="default"
            title="No revisions logged"
            description="Initial creation details are displayed on the main offers tab."
          />
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {revisions.map((rev, index) => {
              const snap = rev.snapshot;
              const isLatest = index === 0;

              return (
                <div key={rev.id} className="relative space-y-2">
                  {/* Timeline node */}
                  <div
                    className={cn(
                      "absolute -left-6 top-1.5 size-5 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold",
                      isLatest
                        ? "bg-brand text-white shadow-xs"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {snap.title ? "v" : ""}
                  </div>

                  {/* Revision Card */}
                  <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm font-bold text-foreground">
                          Version {rev.version}
                        </span>
                        {isLatest && (
                          <Badge variant="brand" className="text-[10px] h-5">
                            Current
                          </Badge>
                        )}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            snap.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          )}
                        >
                          {snap.status}
                        </span>
                        {snap.imageSha256 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            <ImageIcon className="size-3" />
                            <span>Poster attached</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Clock className="size-3" />
                        <span>{formatDate(rev.changedAt)}</span>
                      </div>
                    </div>

                    {/* Snapshot summary */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{snap.title}</span>
                        <span className="font-bold text-brand dark:text-brand-soft">
                          {formatDiscount(snap)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>
                          <span className="font-semibold text-foreground">Limit:</span>{" "}
                          {snap.limitPeriod === "unlimited"
                            ? "Unlimited"
                            : `${snap.limitCount} per ${snap.limitPeriod}`}
                        </div>

                        <div>
                          <span className="font-semibold text-foreground">Schedule:</span>{" "}
                          {snap.activeFrom && snap.activeTo
                            ? `${snap.activeFrom}–${snap.activeTo}`
                            : "All day"}
                        </div>
                      </div>

                      {snap.description && (
                        <p className="text-muted-foreground italic truncate">
                          &ldquo;{snap.description}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="normal-case font-semibold h-11 min-h-[44px] px-5"
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
