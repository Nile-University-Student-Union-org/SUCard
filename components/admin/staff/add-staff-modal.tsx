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
import { copyToClipboard } from "@/lib/clipboard";
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
    copyToClipboard(pwd).catch(() => {});
    toast.info("Password generated & copied to clipboard");
  };

  const handleCopyCredentials = async () => {
    if (!createdStaffData) return;
    const text = createdStaffData.password
      ? `Staff Member: ${createdStaffData.staff.name}\nEmail: ${createdStaffData.staff.email}\nRole: ${
          createdStaffData.staff.role === "super_admin" ? "Super Admin" : "Admin"
        }\nPassword: ${createdStaffData.password}`
      : `Staff Member: ${createdStaffData.staff.name}\nEmail: ${createdStaffData.staff.email}\nRole: ${
          createdStaffData.staff.role === "super_admin" ? "Super Admin" : "Admin"
        }`;

    const ok = await copyToClipboard(text);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
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
        /* Success Pane with Next Steps */
        <>
          <ModalBody className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span>Account Created Successfully</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                {createdStaffData.password
                  ? "Make sure to copy these credentials now. For security reasons, the initial password cannot be retrieved once you close this dialog."
                  : `A secure set-password link has been emailed to ${createdStaffData.staff.email}.`}
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

            {/* Next Steps Guidance */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-xs text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">Next steps:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                <li>Share credentials securely with the staff member.</li>
                <li>They can sign in to the SU Card admin console at <strong className="text-foreground">/login</strong>.</li>
                <li>They will be prompted to set up two-factor authentication on first sign-in.</li>
              </ul>
            </div>
          </ModalBody>

          <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {createdStaffData.password ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCredentials}
                className="normal-case text-xs font-bold h-11 min-h-[44px] px-4"
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
              className="normal-case text-xs font-bold h-11 min-h-[44px] px-6"
            >
              Done
            </Button>
          </ModalFooter>
        </>
      ) : (
        /* Add Staff Input Form with Structured Sections */
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ModalBody className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Section 1: Identity */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Staff Identity
              </h4>
              <Input
                id="staff-name"
                label="Full Name *"
                placeholder="e.g. Omar Farouk"
                disabled={isSubmitting}
                maxLength={STAFF_NAME_MAX}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                id="staff-email"
                type="email"
                label="Staff Email *"
                placeholder="name@nu.edu.eg"
                disabled={isSubmitting}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            {/* Section 2: Role Selection */}
            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Permissions & Role *
              </h4>
              <div className="space-y-1.5 text-left">
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
                    ? "Super admins have full system control, managing staff, audit logs, and batch exports."
                    : "Admins can manage partner vendors, offers, and student cards."}
                </p>
              </div>
            </div>

            {/* Section 3: Initial Password */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  3. Initial Password
                </h4>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-brand dark:text-brand-soft hover:underline inline-flex items-center gap-1 cursor-pointer select-none min-h-[32px] px-1"
                >
                  <Key className="size-3.5" />
                  <span>Generate strong password</span>
                </button>
              </div>

              <Input
                id="staff-password"
                type="password"
                placeholder="••••••••••••"
                disabled={isSubmitting}
                showPasswordToggle
                error={errors.password?.message}
                helperText="Leave empty to email them a secure link to set their own password"
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
              className="normal-case font-semibold h-11 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingText="Adding staff…"
              className="normal-case font-bold h-11 min-h-[44px]"
            >
              Add staff member
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
