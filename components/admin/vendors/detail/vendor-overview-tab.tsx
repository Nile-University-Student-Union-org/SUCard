"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Save,
  AlertTriangle,
  Building2,
  Phone,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { FileDrop } from "@/components/ui/file-drop";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { updateVendor, uploadVendorLogo } from "../api";
import { cn } from "cn";
import type { VendorDto, VendorCategory, VendorStatus } from "@/lib/vendors/types";

interface VendorOverviewTabProps {
  vendor: VendorDto;
  onVendorUpdated: (updated: VendorDto) => void;
}

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "coffee", label: "Coffee & Beverage" },
  { value: "food", label: "Food & Dining" },
  { value: "fitness", label: "Fitness & Gym" },
  { value: "books", label: "Books & Stationery" },
  { value: "services", label: "Services & Tech" },
  { value: "other", label: "Other" },
];

export function VendorOverviewTab({
  vendor,
  onVendorUpdated,
}: VendorOverviewTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(vendor.name);
  const [category, setCategory] = useState<VendorCategory>(vendor.category);
  const [contactName, setContactName] = useState(vendor.contactName || "");
  const [contactPhone, setContactPhone] = useState(vendor.contactPhone || "");
  const [contactEmail, setContactEmail] = useState(vendor.contactEmail || "");
  const [location, setLocation] = useState(vendor.location || "");
  const [contractStart, setContractStart] = useState(vendor.contractStart || "");
  const [contractEnd, setContractEnd] = useState(vendor.contractEnd || "");
  const [status, setStatus] = useState<VendorStatus>(vendor.status);
  const [notes, setNotes] = useState(vendor.notes || "");

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Status confirm dialog
  const [pendingStatus, setPendingStatus] = useState<VendorStatus | null>(null);

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(vendor.logoUrl);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Save states
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoFileSelect = async (file: File) => {
    if (file.size > 512 * 1024) {
      setLogoError("Logo file must be at most 512 KB");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError("Logo must be a PNG, JPEG, or WebP image");
      return;
    }

    setLogoError(null);
    setIsUploadingLogo(true);

    try {
      const res = await uploadVendorLogo(vendor.id, file);
      onVendorUpdated(res.vendor);
      setLogoPreview(res.vendor.logoUrl);
      toast.success("Vendor logo updated successfully!");
    } catch (err) {
      setLogoError(
        err instanceof Error ? err.message : "Failed to upload logo"
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleStatusChangeAttempt = (newStatus: VendorStatus) => {
    if (newStatus === "paused" || newStatus === "ended") {
      setPendingStatus(newStatus);
    } else {
      setStatus(newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      setStatus(pendingStatus);
      setPendingStatus(null);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Vendor name is required";
    }

    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errors.contactEmail = "Please enter a valid contact email address";
    }

    if (contractStart && contractEnd && contractStart > contractEnd) {
      errors.contractEnd = "Contract end date cannot precede start date";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      const res = await updateVendor(vendor.id, {
        name: name.trim(),
        category,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        location: location.trim() || null,
        contractStart: contractStart || null,
        contractEnd: contractEnd || null,
        status,
        notes: notes.trim() || null,
      });

      onVendorUpdated(res.vendor);
      toast.success("Vendor details saved successfully!");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save vendor details"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-200">
      {/* Left 1 Col: Logo Card & Status Quick Card */}
      <div className="space-y-6">
        {/* Logo Card */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h3 className="font-sans font-semibold text-xs text-muted-foreground">
            Vendor Logo
          </h3>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center space-y-3">
            <div className="relative size-28 rounded-2xl bg-muted border border-border overflow-hidden flex items-center justify-center shadow-xs">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt={vendor.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-heading text-4xl font-bold text-brand dark:text-brand-soft">
                  {name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                PNG, JPEG or WebP
              </p>
              <p className="text-[11px] text-muted-foreground">
                Max file size: 512 KB
              </p>
            </div>

            <FileDrop
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              maxSize={512 * 1024}
              onFileSelect={handleLogoFileSelect}
              disabled={isUploadingLogo}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={isUploadingLogo}
                loadingText="Uploading…"
                onClick={() => fileInputRef.current?.click()}
                className="normal-case font-bold h-11 min-h-[44px] px-4 rounded-xl border-border"
              >
                <Upload className="size-4 mr-1.5" />
                <span>{logoPreview ? "Change logo" : "Upload logo"}</span>
              </Button>
            </FileDrop>
          </div>

          {logoError && (
            <p className="text-xs text-rose-500 font-semibold">{logoError}</p>
          )}
        </div>

        {/* Status Alert Info */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
          <h3 className="font-sans font-semibold text-xs text-muted-foreground">
            Vendor Status
          </h3>

          <div className="space-y-2">
            <Dropdown
              id="status-select"
              label="Current Operating Status"
              value={status}
              onChange={(val) => handleStatusChangeAttempt(val as VendorStatus)}
              className="w-full"
              options={[
                { value: "active", label: "Active (Scans Allowed)" },
                { value: "paused", label: "Paused (Scans Suspended)" },
                { value: "ended", label: "Ended (Contract Terminated)" },
              ]}
            />
          </div>

          {status !== "active" && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Scans Blocked</span>
              </div>
              <p className="leading-relaxed">
                When a vendor is {status}, cashier scanners will decline all student discount attempts immediately.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right 2 Cols: Main Edit Form */}
      <div className="lg:col-span-2">
        <form
          onSubmit={handleSaveOverview}
          className="p-5 sm:p-7 rounded-2xl border border-border bg-card shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-sans font-semibold text-xl text-foreground">
                Overview & details
              </h3>
              <p className="text-xs text-muted-foreground">
                Update store branding, partner details, and contract information.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {vendor.id.slice(0, 8)}…
            </span>
          </div>

          {saveError && (
            <Alert variant="destructive" title="Could not save changes">
              {saveError}
            </Alert>
          )}

          {/* Section 1: Core Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <Building2 className="size-4 text-brand dark:text-brand-soft" />
              <h4 className="font-sans font-semibold text-xs text-foreground">
                1. Basic Store Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="v-name" className="text-xs font-semibold text-foreground">
                  Vendor Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="v-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  className={cn(
                    "h-11 min-h-[44px] rounded-xl font-medium",
                    fieldErrors.name && "border-rose-500 focus-visible:ring-rose-500"
                  )}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-500 font-semibold">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Dropdown
                  id="v-category"
                  label="Category *"
                  value={category}
                  onChange={(val) => setCategory(val as VendorCategory)}
                  className="w-full"
                  options={CATEGORIES}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-location" className="text-xs font-semibold text-foreground">
                  Main Campus Location
                </Label>
                <Input
                  id="v-location"
                  placeholder="e.g. Student Center, 1st Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 min-h-[44px] rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <Phone className="size-4 text-brand dark:text-brand-soft" />
              <h4 className="font-sans font-semibold text-xs text-foreground">
                2. Contact Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-contact" className="text-xs font-semibold text-foreground">
                  Contact Person
                </Label>
                <Input
                  id="v-contact"
                  placeholder="e.g. Omar Hassan"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-11 min-h-[44px] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-phone" className="text-xs font-semibold text-foreground">
                  Contact Phone
                </Label>
                <Input
                  id="v-phone"
                  placeholder="+20 10..."
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-11 min-h-[44px] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-email" className="text-xs font-semibold text-foreground">
                  Contact Email
                </Label>
                <Input
                  id="v-email"
                  type="email"
                  placeholder="partner@..."
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    if (fieldErrors.contactEmail) {
                      setFieldErrors((prev) => ({ ...prev, contactEmail: "" }));
                    }
                  }}
                  className={cn(
                    "h-11 min-h-[44px] rounded-xl font-mono text-sm",
                    fieldErrors.contactEmail && "border-rose-500 focus-visible:ring-rose-500"
                  )}
                />
                {fieldErrors.contactEmail && (
                  <p className="text-xs text-rose-500 font-semibold">{fieldErrors.contactEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Contract Period & Internal Notes */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <Calendar className="size-4 text-brand dark:text-brand-soft" />
              <h4 className="font-sans font-semibold text-xs text-foreground">
                3. Contract Period & Internal Notes
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker
                id="v-cstart"
                label="Contract Start Date"
                value={contractStart}
                maxDate={contractEnd || undefined}
                onChange={(date) => setContractStart(date)}
                clearable
              />

              <DatePicker
                id="v-cend"
                label="Contract End Date"
                value={contractEnd}
                minDate={contractStart || undefined}
                onChange={(date) => {
                  setContractEnd(date);
                  if (fieldErrors.contractEnd) {
                    setFieldErrors((prev) => ({ ...prev, contractEnd: "" }));
                  }
                }}
                error={fieldErrors.contractEnd || undefined}
                clearable
              />

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="v-notes" className="text-xs font-semibold text-foreground">
                  Internal Notes (SU admins only)
                </Label>
                <Textarea
                  id="v-notes"
                  rows={3}
                  placeholder="Notes about partnership agreement, commissions, special terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl min-h-[88px]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              loadingText="Saving changes…"
              className="normal-case font-bold h-11 min-h-[44px] px-6 shadow-xs"
            >
              <Save className="size-4 mr-1.5" />
              <span>Save changes</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Pausing/Ending Vendor */}
      <AlertDialog
        isOpen={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        title={pendingStatus === "paused" ? `Pause Vendor Account — ${vendor.name}?` : `End Vendor Contract — ${vendor.name}?`}
        description={
          pendingStatus === "paused"
            ? `Pausing ${vendor.name} will immediately suspend student card scans and discounts at this store until reactivated.`
            : `Ending the contract for ${vendor.name} terminates partnership status and disables discount validation for all student cards.`
        }
        variant="warning"
        confirmText={pendingStatus === "paused" ? "Pause vendor" : "End contract"}
        cancelText="Cancel"
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
