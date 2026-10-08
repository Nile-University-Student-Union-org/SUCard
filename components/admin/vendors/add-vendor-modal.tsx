"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Check, Tag, Users, ArrowRight, Store, AlertCircle } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createVendor } from "./api";
import type { VendorCategory, VendorStatus, VendorDto, CreateVendorRequest } from "@/lib/vendors/types";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorCreated: (vendor: VendorDto) => void;
}

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "coffee", label: "Coffee & Beverage" },
  { value: "food", label: "Food & Dining" },
  { value: "fitness", label: "Fitness & Gym" },
  { value: "books", label: "Books & Stationery" },
  { value: "services", label: "Services & Tech" },
  { value: "other", label: "Other" },
];

export function AddVendorModal({
  isOpen,
  onClose,
  onVendorCreated,
}: AddVendorModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("coffee");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [location, setLocation] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [status, setStatus] = useState<VendorStatus>("active");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    contactEmail?: string;
    contractEnd?: string;
    general?: string;
  }>({});
  const [createdVendor, setCreatedVendor] = useState<VendorDto | null>(null);

  const resetForm = () => {
    setName("");
    setCategory("coffee");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setLocation("");
    setContractStart("");
    setContractEnd("");
    setStatus("active");
    setNotes("");
    setFormErrors({});
    setCreatedVendor(null);
  };

  const validate = (): boolean => {
    const errors: { name?: string; contactEmail?: string; contractEnd?: string } = {};

    if (!name.trim()) {
      errors.name = "Vendor name is required";
    }

    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errors.contactEmail = "Please enter a valid email address";
    }

    if (contractStart && contractEnd && contractStart > contractEnd) {
      errors.contractEnd = "Contract end date cannot precede start date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormErrors({});

    const payload: CreateVendorRequest = {
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
    };

    try {
      const res = await createVendor(payload);
      onVendorCreated(res.vendor);
      setCreatedVendor(res.vendor);
    } catch (err) {
      setFormErrors({
        general: err instanceof Error ? err.message : "Failed to create vendor",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdVendor ? "Partner Vendor Created" : "Add Partner Vendor"}
      icon={<Store className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="lg"
    >
      {createdVendor ? (
        /* Created Vendor Success Pane with Next Steps */
        <>
          <ModalBody className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span>{createdVendor.name} added successfully!</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                The vendor profile has been initialized. Complete the setup below so students can start redeeming discounts at this partner.
              </p>
            </div>

            {/* Vendor Summary Card */}
            <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-zinc-700">
                <span className="text-ash dark:text-zinc-400 font-bold">Category:</span>
                <Badge variant="secondary" className="font-medium text-xs">
                  {CATEGORIES.find((c) => c.value === createdVendor.category)?.label || createdVendor.category}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-zinc-700">
                <span className="text-ash dark:text-zinc-400 font-bold">Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {createdVendor.status}
                </span>
              </div>
              {createdVendor.location && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-ash dark:text-zinc-400 font-bold">Location:</span>
                  <span className="text-charcoal dark:text-white font-medium">{createdVendor.location}</span>
                </div>
              )}
            </div>

            {/* Next Steps Grid */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Next Steps for Partner Setup
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={`/admin/vendors/${createdVendor.id}`}
                  onClick={handleClose}
                  className="p-3.5 rounded-xl border border-border bg-card hover:border-brand/40 dark:hover:border-brand/40 transition-all flex items-start gap-3 group"
                >
                  <div className="size-8 rounded-lg bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center shrink-0">
                    <Tag className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-xs text-foreground group-hover:text-brand transition-colors">
                      <span>1. Configure Offers</span>
                      <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Set percentage discounts, free item perks, and redemption limits.
                    </p>
                  </div>
                </Link>

                <Link
                  href={`/admin/vendors/${createdVendor.id}`}
                  onClick={handleClose}
                  className="p-3.5 rounded-xl border border-border bg-card hover:border-brand/40 dark:hover:border-brand/40 transition-all flex items-start gap-3 group"
                >
                  <div className="size-8 rounded-lg bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center shrink-0">
                    <Users className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-xs text-foreground group-hover:text-brand transition-colors">
                      <span>2. Cashier Accounts</span>
                      <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Create scanner logins for staff at the checkout register.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="normal-case font-semibold h-11 min-h-[44px]"
            >
              Close
            </Button>
            <Button
              variant="primary"
              render={<Link href={`/admin/vendors/${createdVendor.id}`} onClick={handleClose} />}
              className="normal-case font-bold h-11 min-h-[44px] px-5"
            >
              <span>Manage Vendor Dashboard</span>
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </ModalFooter>
        </>
      ) : (
        /* Add Vendor Input Form */
        <form onSubmit={handleSubmit} noValidate>
          <ModalBody className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
            {formErrors.general && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{formErrors.general}</span>
              </div>
            )}

            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Basic Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Input
                    id="vendor-name"
                    label="Vendor Name *"
                    required
                    placeholder="e.g. Campus Coffee"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    error={formErrors.name}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vendor-category" className="text-xs font-bold uppercase tracking-wider">
                    Category *
                  </Label>
                  <select
                    id="vendor-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VendorCategory)}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vendor-status" className="text-xs font-bold uppercase tracking-wider">
                    Initial Status *
                  </Label>
                  <select
                    id="vendor-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VendorStatus)}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px]"
                  >
                    <option value="active">Active (Scans Allowed)</option>
                    <option value="paused">Paused (Scans Suspended)</option>
                    <option value="ended">Ended (Terminated)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Location & Contact */}
            <div className="pt-3 border-t border-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Contact & Location
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Input
                    id="vendor-location"
                    label="Main Campus Location / Address"
                    placeholder="e.g. Student Activity Building, Ground Floor"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    id="contact-name"
                    label="Contact Person"
                    placeholder="e.g. Omar Hassan"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    id="contact-phone"
                    label="Contact Phone"
                    placeholder="e.g. +20 100 123 4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Input
                    id="contact-email"
                    type="email"
                    label="Contact Email"
                    placeholder="e.g. partner@campuscoffee.eg"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (formErrors.contactEmail) setFormErrors((prev) => ({ ...prev, contactEmail: undefined }));
                    }}
                    error={formErrors.contactEmail}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Contract & Notes */}
            <div className="pt-3 border-t border-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Contract Period & Internal Notes
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input
                    id="contract-start"
                    label="Contract Start Date"
                    type="date"
                    value={contractStart}
                    onChange={(e) => setContractStart(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    id="contract-end"
                    label="Contract End Date"
                    type="date"
                    value={contractEnd}
                    onChange={(e) => {
                      setContractEnd(e.target.value);
                      if (formErrors.contractEnd) setFormErrors((prev) => ({ ...prev, contractEnd: undefined }));
                    }}
                    error={formErrors.contractEnd}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="vendor-notes" className="text-xs font-semibold">
                    Internal Notes (SU staff only)
                  </Label>
                  <Textarea
                    id="vendor-notes"
                    rows={2}
                    placeholder="e.g. Special partnership agreement signed for Fall 2026"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="normal-case font-semibold h-11 min-h-[44px]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingText="Creating vendor…"
              className="normal-case font-bold h-11 min-h-[44px] px-5"
            >
              <Plus className="size-4 mr-1.5 stroke-[2.5]" />
              <span>Create vendor</span>
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
