"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  UserCheck,
  Shield,
  QrCode,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { createVendorAccount, updateVendorAccount } from "../api";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "cn";
import type {
  VendorAccountDto,
  CreateVendorAccountRequest,
  UpdateVendorAccountRequest,
} from "@/lib/vendors/types";

interface VendorAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  editingAccount: VendorAccountDto | null;
  onAccountSaved: (saved: VendorAccountDto) => void;
}

export function VendorAccountModal({
  isOpen,
  onClose,
  vendorId,
  editingAccount,
  onAccountSaved,
}: VendorAccountModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingAccount
          ? `Edit Staff Account — ${editingAccount.name}`
          : "Add Staff Account"
      }
      maxWidth="md"
    >
      {isOpen && (
        <VendorAccountForm
          key={editingAccount?.id ?? "new-account"}
          onClose={onClose}
          vendorId={vendorId}
          editingAccount={editingAccount}
          onAccountSaved={onAccountSaved}
        />
      )}
    </Modal>
  );
}

function VendorAccountForm({
  onClose,
  vendorId,
  editingAccount,
  onAccountSaved,
}: Omit<VendorAccountModalProps, "isOpen">) {
  const [role, setRole] = useState<"cashier" | "vendor_manager">(
    editingAccount?.role ?? "cashier"
  );
  const [name, setName] = useState(editingAccount?.name ?? "");
  const [email, setEmail] = useState(editingAccount?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"active" | "disabled">(
    editingAccount?.status ?? "active"
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state for created account
  const [createdResult, setCreatedResult] = useState<{
    account: VendorAccountDto;
    initialPassword?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Staff member full name is required";
    }

    if (!editingAccount) {
      if (!email.trim()) {
        errors.email = "Email address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Please enter a valid email address";
      }

      if (password) {
        if (password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }
        if (password !== confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingAccount) {
        const patch: UpdateVendorAccountRequest = {
          name: name.trim(),
          status,
        };
        const res = await updateVendorAccount(editingAccount.id, patch);
        onAccountSaved(res.account);
        onClose();
      } else {
        const payload: CreateVendorAccountRequest = {
          role,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password || (undefined as unknown as string),
        };
        const res = await createVendorAccount(vendorId, payload);
        onAccountSaved(res.account);
        setCreatedResult({
          account: res.account,
          initialPassword: password || undefined,
        });
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Failed to save account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdResult) return;
    const creds = [
      `SU Card — ${createdResult.account.role === "cashier" ? "Cashier" : "Vendor Manager"} Account`,
      `Name: ${createdResult.account.name}`,
      `Email: ${createdResult.account.email}`,
      createdResult.initialPassword
        ? `Password: ${createdResult.initialPassword}`
        : "Password: Set via invite link sent to email",
      `Sign-in URL: ${window.location.origin}${createdResult.account.role === "cashier" ? "/scan" : "/vendor"}`,
    ].join("\n");

    const ok = await copyToClipboard(creds);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // -------------------------------------------------------------
  // SUCCESS / NEXT-STEP VIEW
  // -------------------------------------------------------------
  if (createdResult) {
    const isCashier = createdResult.account.role === "cashier";

    return (
      <div className="space-y-5 animate-in fade-in-0 duration-200">
        <ModalBody className="space-y-4">
          {/* Success Banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="size-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                Staff Account Created Successfully
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                {createdResult.account.name} is now registered for this vendor.
              </p>
            </div>
          </div>

          {/* Account & Credentials Card */}
          <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Account Details
              </span>
              <Badge
                variant={isCashier ? "warning" : "brand"}
                className="text-xs font-semibold"
              >
                {isCashier ? "Cashier" : "Vendor Manager"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Full Name</span>
                <span className="font-bold text-foreground">{createdResult.account.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email Address</span>
                <span className="font-mono text-foreground">{createdResult.account.email}</span>
              </div>
              {createdResult.initialPassword && (
                <div className="sm:col-span-2 pt-1 border-t border-border">
                  <span className="text-muted-foreground block text-[11px]">Temporary Password</span>
                  <span className="font-mono font-bold text-brand dark:text-brand-soft text-sm">
                    {createdResult.initialPassword}
                  </span>
                </div>
              )}
            </div>

            {/* Copy Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="w-full h-11 min-h-[44px] rounded-xl font-bold text-xs normal-case border-border hover:bg-muted"
            >
              {isCopied ? (
                <>
                  <Check className="size-4 mr-1.5 text-emerald-600 dark:text-emerald-400 animate-icon-morph" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Credentials copied to clipboard!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-1.5" />
                  <span>Copy account login info</span>
                </>
              )}
            </Button>
          </div>

          {/* Dedicated Next Steps Guidance */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              {isCashier ? (
                <QrCode className="size-4 text-brand dark:text-brand-soft" />
              ) : (
                <BarChart2 className="size-4 text-brand dark:text-brand-soft" />
              )}
              <span>Recommended Next Steps</span>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-0.5 leading-relaxed">
              {isCashier ? (
                <>
                  <li>
                    Share credentials with the cashier and direct them to open{" "}
                    <strong className="text-foreground">/scan</strong> on their mobile register.
                  </li>
                  <li>
                    The scanner app will prompt them to sign in once, retaining the active register session for 30 days.
                  </li>
                  <li>
                    They can immediately scan student SU Cards to apply discounts.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Share login details with the partner store manager.
                  </li>
                  <li>
                    The manager can access the vendor portal to view live redemption metrics and audit cashier transactions.
                  </li>
                </>
              )}
            </ol>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto h-11 min-h-[44px] px-6 normal-case font-bold"
          >
            <span>Done</span>
          </Button>
        </ModalFooter>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN FORM VIEW
  // -------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit}>
      <ModalBody className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {generalError && (
          <Alert variant="destructive" title="Unable to save account">
            {generalError}
          </Alert>
        )}

        {/* SECTION 1: Role & Access */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <Shield className="size-4 text-brand dark:text-brand-soft" />
            <h4 className="font-sans font-semibold text-xs text-foreground">
              1. Account Role & Access
            </h4>
          </div>

          <div className="space-y-1.5">
            <Dropdown
              id="account-role"
              label="Role Type *"
              disabled={!!editingAccount}
              value={role}
              onChange={(val) => {
                const newRole = val as "cashier" | "vendor_manager";
                setRole(newRole);
              }}
              className="w-full"
              options={[
                { value: "cashier", label: "Cashier (Scanner App Access at /scan)" },
                { value: "vendor_manager", label: "Vendor Manager (Stats & Analytics)" },
              ]}
            />
            <p className="text-[11px] text-muted-foreground leading-normal">
              {role === "cashier"
                ? "Cashiers log in to the /scan app to validate student cards and record bill redemptions."
                : "Managers have access to vendor reports, peak activity charts, and offer configuration."}
            </p>
          </div>
        </div>

        {/* SECTION 2: Staff Details */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <UserCheck className="size-4 text-brand dark:text-brand-soft" />
            <h4 className="font-sans font-semibold text-xs text-foreground">
              2. Staff Member Details
            </h4>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="account-name"
              className="text-xs font-semibold text-foreground"
            >
              Full Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="account-name"
              placeholder="e.g. Mostafa Ali"
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

          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="account-email"
              className="text-xs font-semibold text-foreground"
            >
              Email Address <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="account-email"
              type="email"
              disabled={!!editingAccount}
              placeholder="e.g. staff.coffee@nu.edu.eg"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              className={cn(
                "h-11 min-h-[44px] rounded-xl disabled:opacity-60 font-mono text-sm",
                fieldErrors.email && "border-rose-500 focus-visible:ring-rose-500"
              )}
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 font-semibold">{fieldErrors.email}</p>
            )}
          </div>

          {/* Status for Edit */}
          {editingAccount && (
            <div className="space-y-1.5">
              <Dropdown
                id="account-status"
                label="Account Status"
                value={status}
                onChange={(val) =>
                  setStatus(val as "active" | "disabled")
                }
                className="w-full"
                options={[
                  { value: "active", label: "Active (Access Allowed)" },
                  { value: "disabled", label: "Disabled (Access Blocked)" },
                ]}
              />
            </div>
          )}
        </div>

        {/* SECTION 3: Password & Sign-in (New Account Only) */}
        {!editingAccount && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <ArrowRight className="size-4 text-brand dark:text-brand-soft" />
              <h4 className="font-sans font-semibold text-xs text-foreground">
                3. Initial Password
              </h4>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="account-pwd"
                className="text-xs font-semibold text-foreground"
              >
                Set Password{" "}
                <span className="text-muted-foreground font-normal lowercase">
                  (optional)
                </span>
              </Label>
              <Input
                id="account-pwd"
                type="password"
                placeholder="Leave empty to let staff set their password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                className={cn(
                  "h-11 min-h-[44px] rounded-xl",
                  fieldErrors.password && "border-rose-500 focus-visible:ring-rose-500"
                )}
                helperText="Provide a temporary password or leave blank to email a setup link."
              />
              {fieldErrors.password && (
                <p className="text-xs text-rose-500 font-semibold">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {password && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="account-pwd-confirm"
                    className="text-xs font-semibold text-foreground"
                  >
                    Confirm Password <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="account-pwd-confirm"
                    type="password"
                    placeholder="Re-type password to verify"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    className={cn(
                      "h-11 min-h-[44px] rounded-xl",
                      fieldErrors.confirmPassword &&
                        "border-rose-500 focus-visible:ring-rose-500"
                    )}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-rose-500 font-semibold">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <PasswordStrengthMeter
                  password={password}
                  confirmPassword={confirmPassword}
                />
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
          className="normal-case font-semibold h-11 min-h-[44px]"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          loadingText="Saving account…"
          className="normal-case font-bold h-11 min-h-[44px] px-6"
        >
          <span>{editingAccount ? "Save changes" : "Create account"}</span>
        </Button>
      </ModalFooter>
    </form>
  );
}
