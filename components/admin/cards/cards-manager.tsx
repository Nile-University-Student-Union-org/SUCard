"use client";

import { useState, useEffect, useCallback } from "react";
import type { Batch } from "@/lib/cards/types";
import { listBatches } from "./api";
import { KpiSummary } from "./kpi-summary";
import { GenerateBatchPanel } from "./generate-batch-panel";
import { BatchesTable } from "./batches-table";
import { DownloadDialog } from "./download-dialog";

export function CardsManager() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedBatchId, setHighlightedBatchId] = useState<string | null>(null);
  const [selectedBatchForDownload, setSelectedBatchForDownload] = useState<Batch | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listBatches();
      setBatches(data.batches || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load batches. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listBatches()
      .then((data) => {
        if (active) {
          setBatches(data.batches || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Failed to load batches. Please try again.";
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleBatchCreated = (newBatch: Batch) => {
    // Prepend newly created batch to the table list
    setBatches((prev) => [newBatch, ...prev.filter((b) => b.id !== newBatch.id)]);
    setHighlightedBatchId(newBatch.id);

    // Fade highlight after 4 seconds
    setTimeout(() => {
      setHighlightedBatchId(null);
    }, 4000);
  };

  const handleOpenDownload = (batch: Batch) => {
    setSelectedBatchForDownload(batch);
    setIsDownloadOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Tiles */}
      <section aria-label="Membership Statistics">
        <KpiSummary batches={batches} isLoading={isLoading} />
      </section>

      {/* Batch Generation Section */}
      <section aria-label="Batch Generation">
        <GenerateBatchPanel onBatchCreated={handleBatchCreated} />
      </section>

      {/* Batches Table Section */}
      <section aria-label="Existing Card Batches">
        <BatchesTable
          batches={batches}
          isLoading={isLoading}
          error={error}
          highlightedBatchId={highlightedBatchId}
          onRetry={fetchBatches}
          onDownloadClick={handleOpenDownload}
        />
      </section>

      {/* Export QR ZIP Dialog */}
      <DownloadDialog
        batch={selectedBatchForDownload}
        open={isDownloadOpen}
        onOpenChange={setIsDownloadOpen}
      />
    </div>
  );
}
