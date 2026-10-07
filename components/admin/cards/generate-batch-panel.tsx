"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2, AlertCircle, Layers } from "lucide-react";
import { BATCH_LABEL_MAX, BATCH_COUNT_MAX, type Batch } from "@/lib/cards/types";
import { createBatch } from "./api";
import { formatNumber, formatBatchNumber } from "./utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Modal,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

const generateSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Batch label is required")
    .max(BATCH_LABEL_MAX, `Label cannot exceed ${BATCH_LABEL_MAX} characters`),
  count: z
    .number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1 card")
    .max(BATCH_COUNT_MAX, `Count cannot exceed ${formatNumber(BATCH_COUNT_MAX)} cards`),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

const QUICK_PICK_COUNTS = [100, 500, 1000, 5000];

interface GenerateBatchPanelProps {
  onBatchCreated: (newBatch: Batch) => void;
}

export function GenerateBatchPanel({ onBatchCreated }: GenerateBatchPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<GenerateFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      label: "",
      count: 1000,
    },
  });

  const currentLabel = useWatch({ control, name: "label" }) || "";
  const currentCount = useWatch({ control, name: "count" }) ?? 1000;

  const onFormValid = (data: GenerateFormValues) => {
    setPendingValues(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmGenerate = async () => {
    if (!pendingValues) return;

    setIsSubmitting(true);
    try {
      const response = await createBatch({
        label: pendingValues.label,
        count: pendingValues.count,
      });

      const newBatch = response.batch;
      toast.success(
        `${formatBatchNumber(newBatch.number)} created — ${formatNumber(newBatch.count)} cards`,
        {
          description: `Serials ${newBatch.firstSerial} → ${newBatch.lastSerial}`,
        }
      );

      reset({
        label: "",
        count: 1000,
      });
      setIsConfirmOpen(false);
      setPendingValues(null);
      onBatchCreated(newBatch);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate batch. Please try again.";
      toast.error("Batch creation failed", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
                <Plus className="size-5 stroke-[2.5]" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Generate Physical Cards
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Create a new physical batch with unique cryptographic QR tokens.
                </CardDescription>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-brand dark:text-brand-soft bg-brand/10 dark:bg-brand/20 border border-brand/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Auto-serialized
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <form onSubmit={handleSubmit(onFormValid)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Batch Label Input */}
              <div className="md:col-span-7">
                <Input
                  id="batch-label"
                  label="Batch Label"
                  placeholder="e.g. Fall 2026 Orientation Batch"
                  disabled={isSubmitting}
                  maxLength={BATCH_LABEL_MAX}
                  error={errors.label?.message}
                  helperText={`${currentLabel.length}/${BATCH_LABEL_MAX} characters`}
                  {...register("label")}
                />
              </div>

              {/* Card Count Input & Quick Chips */}
              <div className="md:col-span-5 space-y-2">
                <Input
                  id="batch-count"
                  type="number"
                  label="Number of Cards"
                  min={1}
                  max={BATCH_COUNT_MAX}
                  placeholder="1000"
                  disabled={isSubmitting}
                  error={errors.count?.message}
                  helperText={`Max ${formatNumber(BATCH_COUNT_MAX)} cards`}
                  {...register("count", { valueAsNumber: true })}
                />

                {/* Quick-pick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-ash dark:text-zinc-400 mr-1 select-none">Quick:</span>
                  {QUICK_PICK_COUNTS.map((chipCount) => (
                    <button
                      key={chipCount}
                      type="button"
                      onClick={() => setValue("count", chipCount, { shouldValidate: true })}
                      disabled={isSubmitting}
                      className={`text-xs px-2.5 py-1 rounded-xl border-2 font-bold transition-all cursor-pointer select-none active:scale-95 ${
                        currentCount === chipCount
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-white dark:bg-zinc-800 text-charcoal dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:border-brand/40"
                      }`}
                    >
                      {formatNumber(chipCount)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="size-4 text-brand dark:text-brand-soft shrink-0" />
                <span>Cards are generated with unique cryptographic QR tokens and sequentially assigned serials.</span>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 px-6 text-sm font-bold normal-case shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-1.5 stroke-[2.5]" />
                    Generate batch
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={`Generate ${pendingValues ? formatNumber(pendingValues.count) : ""} Cards?`}
        icon={<AlertCircle className="size-5 text-amber-500" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each card gets a unique cryptographic QR code and serial number. This operation cannot be undone.
          </p>

          {pendingValues && (
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-3.5 border border-slate-200 dark:border-zinc-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ash dark:text-zinc-400 font-bold">Batch Label:</span>
                <span className="text-charcoal dark:text-white font-black">{pendingValues.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ash dark:text-zinc-400 font-bold">Total Quantity:</span>
                <span className="text-charcoal dark:text-white font-black">
                  {formatNumber(pendingValues.count)} physical cards
                </span>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsConfirmOpen(false)}
            disabled={isSubmitting}
            className="normal-case"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmGenerate}
            disabled={isSubmitting}
            className="normal-case"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Generating batch…
              </>
            ) : (
              "Confirm & generate"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
