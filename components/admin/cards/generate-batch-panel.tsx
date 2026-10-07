"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2, Layers, Palette, Download, CheckCircle2, FileCode, ImageIcon, Sparkles } from "lucide-react";
import { BATCH_LABEL_MAX, BATCH_COUNT_MAX, type Batch } from "@/lib/cards/types";
import type { QrStyleDto } from "@/lib/qr-studio/types";
import { listStyles } from "@/components/admin/qr-studio/api";
import { createBatch, getBatchExportUrl } from "./api";
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
  qrStyleVersionId: z.string().optional(),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

const QUICK_PICK_COUNTS = [100, 500, 1000, 5000];

interface GenerateBatchPanelProps {
  onBatchCreated: (newBatch: Batch) => void;
  onOpenDownloadDialog?: (batch: Batch) => void;
}

export function GenerateBatchPanel({ onBatchCreated, onOpenDownloadDialog }: GenerateBatchPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<GenerateFormValues | null>(null);

  // Post-creation prominent success state
  const [createdBatch, setCreatedBatch] = useState<Batch | null>(null);

  // Styles library for batch style picker
  const [publishedStyles, setPublishedStyles] = useState<QrStyleDto[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");

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

  useEffect(() => {
    let active = true;
    listStyles()
      .then((res) => {
        if (!active) return;
        const valid = (res.styles || []).filter(
          (s) => s.status === "published" && s.latestVersion !== null
        );
        setPublishedStyles(valid);

        // Preselect default print style
        const defaultPrint = valid.find((s) => s.isDefaultPrint) || valid[0];
        if (defaultPrint?.latestVersion) {
          setSelectedStyleId(defaultPrint.latestVersion.id);
          setValue("qrStyleVersionId", defaultPrint.latestVersion.id);
        }
      })
      .catch((err) => console.warn("Failed to load published QR styles:", err));
    return () => {
      active = false;
    };
  }, [setValue]);

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
        qrStyleVersionId: pendingValues.qrStyleVersionId || undefined,
      });

      const newBatch = response.batch;
      toast.success(
        `${formatBatchNumber(newBatch.number)} created — ${formatNumber(newBatch.count)} cards`
      );

      setCreatedBatch(newBatch);
      reset({
        label: "",
        count: 1000,
        qrStyleVersionId: selectedStyleId || undefined,
      });
      setIsConfirmOpen(false);
      setPendingValues(null);
      onBatchCreated(newBatch);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate batch. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDirectDownload = (batch: Batch, format: "svg" | "png") => {
    const exportUrl = getBatchExportUrl(batch.id, {
      svg: format === "svg",
      png: format === "png",
      pngSize: 1200,
    });

    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute(
      "download",
      `batch-${String(batch.number).padStart(3, "0")}-${format}-export.zip`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info("Preparing ZIP export…", {
      description: `Packing ${format.toUpperCase()} QR codes for ${formatNumber(batch.count)} cards.`,
    });
  };

  const selectedStyle = publishedStyles.find(
    (s) => s.latestVersion?.id === selectedStyleId
  );

  return (
    <>
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
              <Plus className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl text-foreground">
                GENERATE PHYSICAL CARDS
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Create a new physical batch with unique cryptographic QR tokens and branded styling.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Post-Creation Immediate Download & Count Display */}
          {createdBatch && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                      {formatBatchNumber(createdBatch.number)} Generated Successfully!
                    </h3>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300 font-medium">
                      Label: <strong>{createdBatch.label}</strong> &bull; Total Quantity:{" "}
                      <strong>{formatNumber(createdBatch.count)} cards</strong> (Serials:{" "}
                      <span className="font-mono font-bold">
                        {createdBatch.firstSerial} &rarr; {createdBatch.lastSerial}
                      </span>
                      )
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatedBatch(null)}
                  className="self-end sm:self-auto text-xs font-semibold text-emerald-800 dark:text-emerald-300 min-h-[36px]"
                >
                  Dismiss
                </Button>
              </div>

              {/* Direct Export Actions */}
              <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                  Immediate Export:
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => triggerDirectDownload(createdBatch, "svg")}
                  className="min-h-[44px] px-3.5 text-xs font-bold normal-case shadow-xs"
                >
                  <FileCode className="size-3.5 mr-1.5" />
                  Download SVG Vector ZIP
                </Button>

                <Button
                  type="button"
                  variant="surface"
                  size="sm"
                  onClick={() => triggerDirectDownload(createdBatch, "png")}
                  className="min-h-[44px] px-3.5 text-xs font-bold normal-case text-emerald-900 dark:text-emerald-200 border-emerald-500/30"
                >
                  <ImageIcon className="size-3.5 mr-1.5 text-emerald-600" />
                  Download PNG ZIP
                </Button>

                {onOpenDownloadDialog && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDownloadDialog(createdBatch)}
                    className="min-h-[44px] px-3.5 text-xs font-bold normal-case"
                  >
                    <Download className="size-3.5 mr-1.5" />
                    Custom Export Options…
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onFormValid)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Batch Label Input */}
              <div className="md:col-span-6">
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

              {/* QR Style Picker */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="size-3.5 text-brand" />
                  <span>QR Style Version</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedStyleId}
                    onChange={(e) => {
                      setSelectedStyleId(e.target.value);
                      setValue("qrStyleVersionId", e.target.value);
                    }}
                    disabled={isSubmitting || publishedStyles.length === 0}
                    className="w-full min-h-[44px] rounded-xl border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
                  >
                    {publishedStyles.map((s) => (
                      <option key={s.id} value={s.latestVersion!.id}>
                        {s.name} (v{s.latestVersion!.version})
                        {s.isDefaultPrint ? " — Default Print" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedStyle && (
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {selectedStyle.latestVersion?.config.modules.shape} dots &bull;{" "}
                    {selectedStyle.latestVersion?.config.output.printSizeMm} mm
                  </p>
                )}
              </div>

              {/* Card Count Input & Quick Chips */}
              <div className="md:col-span-3 space-y-2">
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
                      className={`text-xs px-2.5 min-h-[36px] rounded-lg border font-bold transition-all cursor-pointer select-none active:scale-95 ${
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
                <span>Cards are generated with unique cryptographic QR tokens and rendered in the selected QR style version.</span>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-bold normal-case shadow-xs"
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
        title={`Generate ${pendingValues ? formatNumber(pendingValues.count) : ""} Physical Cards?`}
        icon={<Sparkles className="size-5 text-brand" />}
        maxWidth="md"
        role="alertdialog"
      >
        <ModalBody className="space-y-3">
          <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-3.5 border border-slate-200 dark:border-zinc-700 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-ash dark:text-zinc-400 font-bold">Target Batch Label:</span>
              <span className="text-charcoal dark:text-white font-black">{pendingValues?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ash dark:text-zinc-400 font-bold">Total Quantity:</span>
              <span className="text-charcoal dark:text-white font-black">
                {pendingValues ? formatNumber(pendingValues.count) : 0} physical cards
              </span>
            </div>
            {selectedStyle && (
              <div className="flex justify-between">
                <span className="text-ash dark:text-zinc-400 font-bold">QR Visual Style:</span>
                <span className="text-brand dark:text-brand-soft font-black">
                  {selectedStyle.name} (v{selectedStyle.latestVersion?.version})
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 text-muted-foreground text-[11px] leading-relaxed">
              <strong>Consequence:</strong> Generates cryptographic tokens and serial numbers in the database. You will immediately be able to export print-ready vector SVGs and raster PNG files.
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsConfirmOpen(false)}
            disabled={isSubmitting}
            className="normal-case min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmGenerate}
            disabled={isSubmitting}
            className="normal-case min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Generating batch…
              </>
            ) : (
              "Confirm & Generate"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
