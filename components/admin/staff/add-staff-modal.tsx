"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  UserPlus,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Shield,
  Loader2,
  AlertCircle,
  Mail,
} from "lucide-react";
import {
  STAFF_NAME_MAX,
  STAFF_PASSWORD_MIN,
  STAFF_PASSWORD_MAX,
  type StaffMember,
  type StaffRole,
} from "@/lib/staff/types";
import { createStaff, ApiError } from "./api";
import { generateSecurePassword } from "./utils";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";

const addStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(STAFF_NAME_MAX, `Name cannot exceed ${STAFF_NAME_MAX} characters`),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  role: z.enum(["admin", "super_admin"] as const),
  password: z
    .string()
    .max(STAFF_PASSWORD_MAX, `Password cannot exceed ${STAFF_PASSWORD_MAX} characters`)
    .refine((val) => !val || val.length >= STAFF_PASSWORD_MIN, {
      message: `Password must be at least ${STAFF_PASSWORD_MIN} characters`,
    })
    .optional()
    .or(z.literal("")),
});

type AddStaffFormValues = z.infer<typeof addStaffSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded: (staff: StaffMember) => void;
}

export function AddStaffModal({ isOpen, onClose, onStaffAdded }: AddStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStaffData, setCreatedStaffData] = useState<{
    staff: StaffMember;
    password?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "admin",
      password: "",
    },
  });

  const currentRole = useWatch({ control, name: "role" }) || "admin";
  const currentPassword = useWatch({ control, name: "password" }) || "";

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword(16);
    setValue("password", pwd, { shouldValidate: true });
    navigator.clipboard.writeText(pwd).catch(() => {});
    toast.info("Password generated & copied to clipboard");
  };

  const handleCopyCredentials = () => {
    if (!createdStaffData) return;
    const text = createdStaffData.password
      ? `Staff Member: ${createdStaffData.staff.name}\nEmail: ${createdStaffData.staff.email}\nRole: ${
          createdStaffData.staff.role === "super_admin" ? "Super Admin" : "Admin"
        }\nPassword: ${createdStaffData.password}`
      : `Staff Member: ${createdStaffData.staff.name}\nEmail: ${createdStaffData.staff.email}\nRole: ${
          createdStaffData.staff.role === "super_admin" ? "Super Admin" : "Admin"
        }`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast.success("Credentials copied to clipboard");
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    reset({
      name: "",
      email: "",
      role: "admin",
      password: "",
    });
    setCreatedStaffData(null);
    setSubmitError(null);
    setIsCopied(false);
    onClose();
  };

  const onSubmit = async (values: AddStaffFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      ...(values.password && values.password.trim() ? { password: values.password.trim() } : {}),
    };

    try {
      const res = await createStaff(payload);
      onStaffAdded(res.staff);
      setCreatedStaffData({
        staff: res.staff,
        password: values.password && values.password.trim() ? values.password.trim() : undefined,
      });
      toast.success(`Staff member ${res.staff.name} added successfully`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to add staff member";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={createdStaffData ? "Staff Member Added" : "Add Staff Member"}
      icon={<UserPlus className="size-5 text-brand dark:text-brand-soft" />}
      maxWidth="md"
    >
      {createdStaffData ? (
        /* Success Pane */
        <>
          <ModalBody className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span>Account Created Successfully</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                {createdStaffData.password
                  ? "Make sure to copy these credentials now. For security reasons, the password cannot be retrieved once you close this dialog."
                  : `A secure set-password link has been queued to email ${createdStaffData.staff.email}.`}
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-zinc-700">
                <span className="text-ash dark:text-zinc-400 font-sans font-bold">Name:</span>
                <span className="text-charcoal dark:text-white font-sans font-bold">{createdStaffData.staff.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-zinc-700">
                <span className="text-ash dark:text-zinc-400 font-sans font-bold">Email:</span>
                <span className="text-charcoal dark:text-white font-sans font-bold">{createdStaffData.staff.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-zinc-700">
                <span className="text-ash dark:text-zinc-400 font-sans font-bold">Role:</span>
                <span className="text-charcoal dark:text-white font-sans font-bold">
                  {createdStaffData.staff.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
              </div>
              {createdStaffData.password ? (
                <div className="flex justify-between items-center py-1">
                  <span className="text-ash dark:text-zinc-400 font-sans font-bold">Password:</span>
                  <span className="text-brand dark:text-brand-soft font-bold select-all bg-white dark:bg-zinc-900 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                    {createdStaffData.password}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1 text-emerald-700 dark:text-emerald-300 font-sans text-xs">
                  <Mail className="size-4 shrink-0" />
                  <span>Set-password link sent via email</span>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {createdStaffData.password ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCredentials}
                className="normal-case text-xs font-bold"
              >
                {isCopied ? (
                  <>
                    <Check className="size-4 mr-1.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-1.5" />
                    Copy credentials
                  </>
                )}
              </Button>
            ) : <div />}
            <Button
              type="button"
              variant="primary"
              onClick={handleModalClose}
              className="normal-case text-xs font-bold"
            >
              Done
            </Button>
          </ModalFooter>
        </>
      ) : (
        /* Add Staff Input Form */
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ModalBody className="space-y-4">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Name */}
            <Input
              id="staff-name"
              label="Full Name"
              placeholder="e.g. Omar Farouk"
              disabled={isSubmitting}
              maxLength={STAFF_NAME_MAX}
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Email */}
            <Input
              id="staff-email"
              type="email"
              label="Staff Email"
              placeholder="name@nu.edu.eg"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
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
              <p className="text-[11px] text-ash dark:text-zinc-400 leading-relaxed pt-0.5">
                {currentRole === "super_admin"
                  ? "Super admins can manage staff accounts, audit logs, and card batches."
                  : "Admins can manage cards and scan/claim cards."}
              </p>
            </div>

            {/* Password (Optional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="staff-password" className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Initial Password <span className="text-ash dark:text-zinc-500 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-brand dark:text-brand-soft hover:underline inline-flex items-center gap-1 cursor-pointer select-none"
                >
                  <Key className="size-3.5" />
                  <span>Generate</span>
                </button>
              </div>

              <Input
                id="staff-password"
                type="password"
                placeholder="••••••••••••"
                disabled={isSubmitting}
                showPasswordToggle
                error={errors.password?.message}
                helperText="Leave empty to email them a link to set their own password"
                {...register("password")}
              />

              {/* Password Strength Meter when password is typed */}
              {currentPassword && (
                <PasswordStrengthMeter
                  password={currentPassword}
                  showMatch={false}
                />
              )}
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="normal-case font-semibold"
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
                  Adding staff…
                </>
              ) : (
                "Add staff member"
              )}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
