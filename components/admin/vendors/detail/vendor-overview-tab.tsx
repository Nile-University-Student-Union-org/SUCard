"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Save,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { updateVendor, uploadVendorLogo } from "../api";
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

  // Status confirm dialog
  const [pendingStatus, setPendingStatus] = useState<VendorStatus | null>(null);

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(vendor.logoUrl);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError("Vendor name is required");
      return;
    }

    if (contractStart && contractEnd && contractStart > contractEnd) {
      setSaveError("Contract end date cannot precede start date");
      return;
    }

    setSaveError(null);
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoFileChange}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingLogo}
              onClick={() => fileInputRef.current?.click()}
              className="normal-case font-bold min-h-[40px] px-4 rounded-xl"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-1.5" />
                  <span>{logoPreview ? "Change logo" : "Upload logo"}</span>
                </>
              )}
            </Button>
          </div>

          {logoError && (
            <p className="text-xs text-rose-500 font-semibold">{logoError}</p>
          )}
        </div>

        {/* Status Alert Info */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vendor Status
          </h3>

          <div className="space-y-2">
            <Label htmlFor="status-select" className="text-xs font-semibold">
              Current Operating Status
            </Label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => handleStatusChangeAttempt(e.target.value as VendorStatus)}
              className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="active">Active (Scans Allowed)</option>
              <option value="paused">Paused (Scans Suspended)</option>
              <option value="ended">Ended (Contract Terminated)</option>
            </select>
          </div>

          {status !== "active" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Scans Blocked</span>
              </div>
              <p>
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
            <h3 className="font-heading text-xl uppercase tracking-wide text-foreground">
              OVERVIEW & DETAILS
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {vendor.id.slice(0, 8)}…
            </span>
          </div>

          {saveError && (
            <Alert variant="destructive" title="Could not save changes">
              {saveError}
            </Alert>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="v-name" className="text-xs font-bold uppercase tracking-wider">
                Vendor Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="v-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-category" className="text-xs font-bold uppercase tracking-wider">
                Category <span className="text-rose-500">*</span>
              </Label>
              <select
                id="v-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as VendorCategory)}
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-location" className="text-xs font-bold uppercase tracking-wider">
                Main Campus Location
              </Label>
              <Input
                id="v-location"
                placeholder="e.g. Student Center, 1st Floor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contact Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-contact" className="text-xs font-semibold">
                  Contact Person
                </Label>
                <Input
                  id="v-contact"
                  placeholder="e.g. Omar Hassan"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-phone" className="text-xs font-semibold">
                  Contact Phone
                </Label>
                <Input
                  id="v-phone"
                  placeholder="+20 10..."
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-email" className="text-xs font-semibold">
                  Contact Email
                </Label>
                <Input
                  id="v-email"
                  type="email"
                  placeholder="partner@..."
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Contract Period */}
          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contract Period & Internal Notes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-cstart" className="text-xs font-semibold">
                  Contract Start Date
                </Label>
                <Input
                  id="v-cstart"
                  type="date"
                  value={contractStart}
                  onChange={(e) => setContractStart(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="v-cend" className="text-xs font-semibold">
                  Contract End Date
                </Label>
                <Input
                  id="v-cend"
                  type="date"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="v-notes" className="text-xs font-semibold">
                  Internal Notes (SU admins only)
                </Label>
                <Textarea
                  id="v-notes"
                  rows={3}
                  placeholder="Notes about partnership agreement, commissions, special terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="normal-case font-bold h-11 px-6 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  <span>Saving changes…</span>
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1.5" />
                  <span>Save changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Pausing/Ending Vendor */}
      <AlertDialog
        isOpen={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        title={pendingStatus === "paused" ? "Pause Vendor Account?" : "End Vendor Contract?"}
        description={`Pausing or ending a vendor stops all student card scans immediately at every branch of ${vendor.name}.`}
        variant="warning"
        confirmText="Confirm Change"
        cancelText="Cancel"
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
