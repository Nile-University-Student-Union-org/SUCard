"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Sparkles, Loader2, AlertCircle, Layers } from "lucide-react";
import { BATCH_LABEL_MAX, BATCH_COUNT_MAX, type Batch } from "@/lib/cards/types";
import { createBatch } from "./api";
import { formatNumber, formatBatchNumber } from "./utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // Open confirmation dialog after local validation passes
  const onFormValid = (data: GenerateFormValues) => {
    setPendingValues(data);
    setIsConfirmOpen(true);
  };

  // Perform actual API creation upon dialog confirmation
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

      // Reset form and notify parent
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
      <Card className="border-slate-200/80 bg-white dark:bg-card shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#0F3056] text-white flex items-center justify-center">
                <Plus className="size-4" />
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
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              <Sparkles className="size-3 text-[#018BCE]" />
              Auto-serialized
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <form onSubmit={handleSubmit(onFormValid)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Batch Label Input */}
              <div className="md:col-span-7 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-label" className="text-xs font-semibold text-slate-700">
                    Batch Label
                  </Label>
                  <span
                    className={`text-[11px] ${
                      currentLabel.length > BATCH_LABEL_MAX ? "text-red-500 font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {currentLabel.length}/{BATCH_LABEL_MAX}
                  </span>
                </div>
                <Input
                  id="batch-label"
                  placeholder="e.g. Fall 2026 Orientation Batch"
                  disabled={isSubmitting}
                  maxLength={BATCH_LABEL_MAX}
                  aria-invalid={errors.label ? "true" : undefined}
                  aria-describedby={errors.label ? "label-error" : undefined}
                  className="h-10 text-sm rounded-lg border-slate-300 bg-white dark:bg-input/20 focus-visible:border-[#018BCE] focus-visible:ring-[#018BCE]"
                  {...register("label")}
                />
                {errors.label && (
                  <p id="label-error" className="text-xs text-red-600 font-medium">
                    {errors.label.message}
                  </p>
                )}
              </div>

              {/* Card Count Input & Quick Chips */}
              <div className="md:col-span-5 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-count" className="text-xs font-semibold text-slate-700">
                    Number of Cards
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Max {formatNumber(BATCH_COUNT_MAX)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Input
                    id="batch-count"
                    type="number"
                    min={1}
                    max={BATCH_COUNT_MAX}
                    placeholder="1000"
                    disabled={isSubmitting}
                    aria-invalid={errors.count ? "true" : undefined}
                    aria-describedby={errors.count ? "count-error" : undefined}
                    className="h-10 text-sm rounded-lg border-slate-300 bg-white dark:bg-input/20 focus-visible:border-[#018BCE] focus-visible:ring-[#018BCE]"
                    {...register("count", { valueAsNumber: true })}
                  />

                  {/* Quick-pick Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-1">Quick:</span>
                    {QUICK_PICK_COUNTS.map((chipCount) => (
                      <button
                        key={chipCount}
                        type="button"
                        onClick={() => setValue("count", chipCount, { shouldValidate: true })}
                        disabled={isSubmitting}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                          currentCount === chipCount
                            ? "bg-[#0F3056] text-white border-[#0F3056] font-medium shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {formatNumber(chipCount)}
                      </button>
                    ))}
                  </div>
                </div>
                {errors.count && (
                  <p id="count-error" className="text-xs text-red-600 font-medium">
                    {errors.count.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="size-3.5 text-sky-600 shrink-0" />
                <span>Cards are generated with unique alphanumeric secret tokens and sequentially assigned serials.</span>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10 px-5 bg-[#0F3056] hover:bg-[#0F548D] text-white text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-1.5" />
                    Generate Batch
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="size-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-2">
              <AlertCircle className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#0F3056]">
              Generate {pendingValues ? formatNumber(pendingValues.count) : ""} Cards?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Each card gets a unique cryptographic QR code and serial number. This operation cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {pendingValues && (
            <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Batch Label:</span>
                <span className="text-slate-900 font-semibold">{pendingValues.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Quantity:</span>
                <span className="text-slate-900 font-semibold">
                  {formatNumber(pendingValues.count)} physical cards
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmGenerate}
              disabled={isSubmitting}
              className="bg-[#0F3056] text-white hover:bg-[#0F548D]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Generating Batch…
                </>
              ) : (
                `Confirm & Generate`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
