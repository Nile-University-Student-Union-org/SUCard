"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import { createOffer, updateOffer } from "../api";
import { formatDiscount } from "@/lib/vendors/types";
import { cn } from "cn";
import type {
  OfferDto,
  CreateOfferRequest,
  UpdateOfferRequest,
  OfferPeriod,
} from "@/lib/vendors/types";

interface VendorOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  editingOffer: OfferDto | null;
  onOfferSaved: (savedOffer: OfferDto) => void;
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const PERIOD_LABELS: { value: OfferPeriod; label: string }[] = [
  { value: "day", label: "Per Day" },
  { value: "week", label: "Per Week" },
  { value: "month", label: "Per Month" },
  { value: "semester", label: "Per Semester" },
  { value: "total", label: "Total All Time" },
  { value: "unlimited", label: "Unlimited (No limit)" },
];

export function VendorOfferModal({
  isOpen,
  onClose,
  vendorId,
  editingOffer,
  onOfferSaved,
}: VendorOfferModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOffer ? "Edit Offer" : "Create New Offer"}
      maxWidth="lg"
    >
      {isOpen && (
        <VendorOfferForm
          key={editingOffer?.id ?? "new-offer"}
          onClose={onClose}
          vendorId={vendorId}
          editingOffer={editingOffer}
          onOfferSaved={onOfferSaved}
        />
      )}
    </Modal>
  );
}

function VendorOfferForm({
  onClose,
  vendorId,
  editingOffer,
  onOfferSaved,
}: Omit<VendorOfferModalProps, "isOpen">) {
  const [title, setTitle] = useState(editingOffer?.title ?? "");
  const [description, setDescription] = useState(editingOffer?.description ?? "");
  const [discountType, setDiscountType] = useState<"percent" | "fixed" | "free_item" | "custom">(
    editingOffer?.discountType ?? "percent"
  );
  const [discountValue, setDiscountValue] = useState(editingOffer?.discountValue ?? (editingOffer ? "" : "15"));
  const [discountText, setDiscountText] = useState(editingOffer?.discountText ?? "");
  const [limitPeriod, setLimitPeriod] = useState<OfferPeriod>(editingOffer?.limitPeriod ?? "day");
  const [limitCount, setLimitCount] = useState<string>(
    editingOffer ? (editingOffer.limitCount !== null ? String(editingOffer.limitCount) : "") : "1"
  );
  const [startsAt, setStartsAt] = useState(editingOffer?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(editingOffer?.endsAt ?? "");
  const [activeDays, setActiveDays] = useState<number[]>(editingOffer?.activeDays ?? []);
  const [activeFrom, setActiveFrom] = useState(editingOffer?.activeFrom ? editingOffer.activeFrom.slice(0, 5) : "");
  const [activeTo, setActiveTo] = useState(editingOffer?.activeTo ? editingOffer.activeTo.slice(0, 5) : "");
  const [visible, setVisible] = useState(editingOffer?.visible ?? true);
  const [status, setStatus] = useState<"active" | "paused">(editingOffer?.status ?? "active");
  const [terms, setTerms] = useState(editingOffer?.terms ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: number) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSelectAllDays = () => {
    if (activeDays.length === 7) setActiveDays([]);
    else setActiveDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Offer title is required");
      return;
    }

    if (startsAt && endsAt && startsAt > endsAt) {
      setError("Offer end date cannot precede start date");
      return;
    }

    // Validate discount values
    let cleanDiscountValue: string | null = null;
    let cleanDiscountText: string | null = null;

    if (discountType === "percent") {
      const num = parseFloat(discountValue);
      if (isNaN(num) || num <= 0 || num > 100) {
        setError("Percentage discount must be between 1 and 100");
        return;
      }
      cleanDiscountValue = String(num);
    } else if (discountType === "fixed") {
      const num = parseFloat(discountValue);
      if (isNaN(num) || num <= 0 || num > 100000) {
        setError("Fixed discount value must be positive (up to 100,000 EGP)");
        return;
      }
      cleanDiscountValue = String(num);
    } else {
      if (!discountText.trim()) {
        setError("Discount description text is required for free item or custom offers");
        return;
      }
      cleanDiscountText = discountText.trim();
    }

    // Validate limit settings
    let cleanLimitCount: number | null = null;
    if (limitPeriod === "unlimited") {
      cleanLimitCount = null;
    } else {
      const count = parseInt(limitCount, 10);
      if (isNaN(count) || count <= 0) {
        setError("Usage limit count must be at least 1");
        return;
      }
      cleanLimitCount = count;
    }

    // Format active times
    const cleanActiveFrom = activeFrom.trim() ? activeFrom.trim() : null;
    const cleanActiveTo = activeTo.trim() ? activeTo.trim() : null;

    if (cleanActiveFrom && !/^\d{2}:\d{2}$/.test(cleanActiveFrom)) {
      setError("Active From time must be in HH:MM format");
      return;
    }

    if (cleanActiveTo && !/^\d{2}:\d{2}$/.test(cleanActiveTo)) {
      setError("Active To time must be in HH:MM format");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateOfferRequest = {
      title: title.trim(),
      description: description.trim() || null,
      discountType,
      discountValue: cleanDiscountValue,
      discountText: cleanDiscountText,
      terms: terms.trim() || null,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      activeDays,
      activeFrom: cleanActiveFrom,
      activeTo: cleanActiveTo,
      visible,
      limitCount: cleanLimitCount,
      limitPeriod,
      status,
    };

    try {
      if (editingOffer) {
        const res = await updateOffer(editingOffer.id, payload as UpdateOfferRequest);
        onOfferSaved(res.offer);
        toast.success("Offer updated successfully!");
      } else {
        const res = await createOffer(vendorId, payload);
        onOfferSaved(res.offer);
        toast.success("Offer created successfully!");
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save offer"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview badge calculation
  const previewDiscountLabel = formatDiscount({
    discountType,
    discountValue: discountValue || null,
    discountText: discountText || null,
  });

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
          {error && (
            <Alert variant="destructive" title="Validation Error">
              {error}
            </Alert>
          )}

          {/* Live Discount Preview Pill */}
          <div className="p-3.5 rounded-2xl bg-brand/10 dark:bg-brand/20 border border-brand/20 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand dark:text-brand-soft">
                Live Badge Preview
              </span>
              <p className="text-xs font-semibold text-foreground truncate">
                {title || "Offer title"}
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-brand text-white font-heading text-sm uppercase tracking-wide shrink-0 shadow-xs">
              {previewDiscountLabel}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="offer-title" className="text-xs font-bold uppercase tracking-wider">
                Offer Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="offer-title"
                required
                placeholder="e.g. 15% off any drink, Free cookie with coffee"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-desc" className="text-xs font-semibold">
                Short Description (Optional)
              </Label>
              <Input
                id="offer-desc"
                placeholder="e.g. Valid on hot and iced specialty beverages"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Discount Type & Value */}
          <div className="pt-3 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Discount Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="discount-type" className="text-xs font-bold uppercase tracking-wider">
                  Discount Type <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="discount-type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <option value="percent">Percentage (% Off)</option>
                  <option value="fixed">Fixed Amount (EGP Off)</option>
                  <option value="free_item">Free Item / Gift</option>
                  <option value="custom">Custom Text Deal</option>
                </select>
              </div>

              {discountType === "percent" && (
                <div className="space-y-1.5">
                  <Label htmlFor="discount-val-percent" className="text-xs font-bold uppercase tracking-wider">
                    Discount Percentage (%) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount-val-percent"
                      type="number"
                      min="1"
                      max="100"
                      required
                      placeholder="15"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="h-11 rounded-xl pr-8"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              )}

              {discountType === "fixed" && (
                <div className="space-y-1.5">
                  <Label htmlFor="discount-val-fixed" className="text-xs font-bold uppercase tracking-wider">
                    Amount Off in EGP <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount-val-fixed"
                      type="number"
                      min="1"
                      step="0.5"
                      required
                      placeholder="20"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="h-11 rounded-xl pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      EGP
                    </span>
                  </div>
                </div>
              )}

              {(discountType === "free_item" || discountType === "custom") && (
                <div className="space-y-1.5">
                  <Label htmlFor="discount-text" className="text-xs font-bold uppercase tracking-wider">
                    Discount Label Text <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="discount-text"
                    required
                    placeholder={discountType === "free_item" ? "e.g. Free Cookie" : "e.g. Buy 1 Get 1"}
                    value={discountText}
                    onChange={(e) => setDiscountText(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Usage Limits */}
          <div className="pt-3 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Usage Limits (Per Student)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="limit-period" className="text-xs font-bold uppercase tracking-wider">
                  Limit Frequency <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="limit-period"
                  value={limitPeriod}
                  onChange={(e) => setLimitPeriod(e.target.value as OfferPeriod)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {PERIOD_LABELS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {limitPeriod !== "unlimited" && (
                <div className="space-y-1.5">
                  <Label htmlFor="limit-count" className="text-xs font-bold uppercase tracking-wider">
                    Max Redemptions <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="limit-count"
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="1"
                    value={limitCount}
                    onChange={(e) => setLimitCount(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Timing */}
          <div className="pt-3 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Schedule & Active Days/Hours
            </h4>

            {/* Active Days Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Active Days ({activeDays.length === 0 ? "Every day" : `${activeDays.length} days selected`})
                </Label>
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="text-xs font-bold text-brand dark:text-brand-soft hover:underline cursor-pointer"
                >
                  {activeDays.length === 7 ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {DAYS.map((day) => {
                  const isChecked = activeDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "h-10 px-3.5 rounded-xl text-xs font-bold transition-all min-w-[44px] cursor-pointer border",
                        isChecked
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="active-from" className="text-xs font-semibold">
                  Active From (Time)
                </Label>
                <Input
                  id="active-from"
                  type="time"
                  placeholder="08:00"
                  value={activeFrom}
                  onChange={(e) => setActiveFrom(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="active-to" className="text-xs font-semibold">
                  Active To (Time)
                </Label>
                <Input
                  id="active-to"
                  type="time"
                  placeholder="12:00"
                  value={activeTo}
                  onChange={(e) => setActiveTo(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="starts-at" className="text-xs font-semibold">
                  Valid From (Date)
                </Label>
                <Input
                  id="starts-at"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ends-at" className="text-xs font-semibold">
                  Valid Until (Date)
                </Label>
                <Input
                  id="ends-at"
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Visibility & Status Toggles */}
          <div className="pt-3 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Visibility & Terms
            </h4>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground cursor-pointer">
                  Visible in Student Portal Deals
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show this deal in student app browsable offers
                </p>
              </div>
              <Switch
                checked={visible}
                onCheckedChange={setVisible}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-foreground cursor-pointer">
                  Offer Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {status === "active" ? "Active (Can be scanned)" : "Paused (Scans paused)"}
                </p>
              </div>
              <Switch
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "paused")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offer-terms" className="text-xs font-semibold">
                Terms & Conditions
              </Label>
              <Textarea
                id="offer-terms"
                rows={2}
                placeholder="e.g. Cannot be combined with other promotions. Valid on dine-in and takeaway."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="normal-case font-bold h-11 px-5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Saving offer…</span>
              </>
            ) : (
              <span>{editingOffer ? "Save changes" : "Create offer"}</span>
            )}
          </Button>
        </ModalFooter>
      </form>
  );
}
