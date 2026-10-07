"use client";

import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }

    if (contractStart && contractEnd && contractStart > contractEnd) {
      setError("Contract end date cannot precede start date");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create vendor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          resetForm();
          onClose();
        }
      }}
      title="Add New Vendor"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && (
            <Alert variant="destructive" title="Validation Error">
              {error}
            </Alert>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="vendor-name" className="text-xs font-bold uppercase tracking-wider">
                Vendor Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="vendor-name"
                required
                placeholder="e.g. Campus Coffee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor-category" className="text-xs font-bold uppercase tracking-wider">
                Category <span className="text-rose-500">*</span>
              </Label>
              <select
                id="vendor-category"
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
              <Label htmlFor="vendor-status" className="text-xs font-bold uppercase tracking-wider">
                Initial Status <span className="text-rose-500">*</span>
              </Label>
              <select
                id="vendor-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {/* Location & Contact Info */}
          <div className="pt-2 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contact & Location (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vendor-location" className="text-xs font-semibold">
                  Main Location / Address
                </Label>
                <Input
                  id="vendor-location"
                  placeholder="e.g. Student Activity Building, Ground Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs font-semibold">
                  Contact Person
                </Label>
                <Input
                  id="contact-name"
                  placeholder="e.g. Omar Hassan"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-phone" className="text-xs font-semibold">
                  Contact Phone
                </Label>
                <Input
                  id="contact-phone"
                  placeholder="e.g. +20 100 123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contact-email" className="text-xs font-semibold">
                  Contact Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="e.g. partner@campuscoffee.eg"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Contract Dates & Notes */}
          <div className="pt-2 border-t border-border space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contract Period & Internal Notes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contract-start" className="text-xs font-semibold">
                  Contract Start Date
                </Label>
                <Input
                  id="contract-start"
                  type="date"
                  value={contractStart}
                  onChange={(e) => setContractStart(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contract-end" className="text-xs font-semibold">
                  Contract End Date
                </Label>
                <Input
                  id="contract-end"
                  type="date"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
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

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
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
                <span>Creating vendor…</span>
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1.5 stroke-[2.5]" />
                <span>Create vendor</span>
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
