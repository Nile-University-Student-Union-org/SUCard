"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserCog, ShieldCheck, Shield, Loader2, AlertCircle } from "lucide-react";
import {
  STAFF_NAME_MAX,
  type StaffMember,
  type StaffRole,
} from "@/lib/staff/types";
import { updateStaff, ApiError } from "./api";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";

const editStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(STAFF_NAME_MAX, `Name cannot exceed ${STAFF_NAME_MAX} characters`),
  role: z.enum(["admin", "super_admin"] as const),
});

type EditStaffFormValues = z.infer<typeof editStaffSchema>;

interface EditStaffModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onStaffUpdated: (staff: StaffMember) => void;
}

export function EditStaffModal({
  staff,
  isOpen,
  onClose,
  onStaffUpdated,
}: EditStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffSchema),
    values: staff
      ? {
          name: staff.name,
          role: staff.role,
        }
      : undefined,
  });

  const currentRole = useWatch({ control, name: "role" }) || "admin";

  if (!staff) return null;

  const handleModalClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (values: EditStaffFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await updateStaff(staff.id, values);
      onStaffUpdated(res.staff);
      toast.success(`Staff member ${res.staff.name} updated successfully`);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to update staff member";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Edit Staff Member"
      icon={<UserCog className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ModalBody className="space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Readonly Email */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs space-y-0.5">
            <span className="text-ash dark:text-zinc-400 font-bold">Email Address:</span>
            <p className="text-charcoal dark:text-white font-bold">{staff.email}</p>
          </div>

          {/* Name */}
          <Input
            id="edit-staff-name"
            label="Full Name"
            placeholder="e.g. Omar Farouk"
            disabled={isSubmitting}
            maxLength={STAFF_NAME_MAX}
            error={errors.name?.message}
            {...register("name")}
          />

          {/* Role Segmented Control */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
              Staff Role
            </label>
            <SegmentedControl<StaffRole>
              ariaLabel="Staff Role Selection"
              fullWidth
              value={currentRole}
              onChange={(val) => setValue("role", val, { shouldValidate: true })}
              options={[
                {
                  value: "admin",
                  label: "Admin",
                  icon: <Shield className="size-4" />,
                },
                {
                  value: "super_admin",
                  label: "Super Admin",
                  icon: <ShieldCheck className="size-4" />,
                },
              ]}
            />
          </div>
        </ModalBody>

        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="normal-case"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="normal-case font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving changes…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
