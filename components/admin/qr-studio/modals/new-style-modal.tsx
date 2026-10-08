"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QR_PRESETS } from "@/lib/qr-style/config";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrSvgPreview } from "../qr-svg-preview";
import { createStyle } from "../api";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "cn";

export interface NewStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStyleCreated?: (styleId: string) => void;
}

type PresetKey = keyof typeof QR_PRESETS;

export const NewStyleModal: React.FC<NewStyleModalProps> = ({
  isOpen,
  onClose,
  onStyleCreated,
}) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("NUSU Signature");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a style name");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createStyle({
        name: name.trim(),
        preset: selectedPreset,
      });

      toast.success(`Created style "${res.style.name}"`);
      onClose();
      if (onStyleCreated) {
        onStyleCreated(res.style.id);
      } else {
        router.push(`/admin/qr-studio/${res.style.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create style";
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
      title="Create New QR Style"
      icon={<Plus className="size-5 text-brand" />}
      maxWidth="lg"
    >
      <form onSubmit={handleCreate}>
        <ModalBody className="space-y-4 text-xs">
          {/* Style Name Input */}
          <div className="space-y-1">
            <Input
              id="newStyleName"
              label="Style Name"
              placeholder="e.g. 2026 Winter Gala Edition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              maxLength={80}
              required
              autoFocus
              error={error || undefined}
            />
          </div>

          {/* Presets Grid */}
          <div className="space-y-2">
            <label className="font-bold text-foreground block">
              Choose Starting Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(QR_PRESETS) as PresetKey[]).map((presetKey) => {
                const presetConfig = QR_PRESETS[presetKey];
                const isSelected = selectedPreset === presetKey;

                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => setSelectedPreset(presetKey)}
                    className={cn(
                      "p-3 rounded-2xl border-2 flex flex-col items-center text-center gap-2 cursor-pointer",
                      isSelected
                        ? "bg-brand/5 border-brand ring-2 ring-brand/30 shadow-sm"
                        : "bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-brand/40"
                    )}
                  >
                    <div className="size-20 sm:size-24 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-1 flex items-center justify-center shadow-inner">
                      <QrSvgPreview
                        config={presetConfig}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-bold text-xs truncate",
                          isSelected
                            ? "text-brand dark:text-brand-soft"
                            : "text-foreground"
                        )}
                      >
                        {presetKey}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
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
            loadingText="Creating…"
            disabled={!name.trim()}
            className="normal-case font-bold"
          >
            Create & Open Editor
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
