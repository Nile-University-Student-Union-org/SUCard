"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { createVendorAccount, updateVendorAccount } from "../api";
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
      title={editingAccount ? "Edit Staff Account" : "Add Staff Account"}
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!editingAccount && !email.trim()) {
      setError("Email is required");
      return;
    }

    if (!editingAccount && password) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingAccount) {
        const patch: UpdateVendorAccountRequest = {
          name: name.trim(),
          status,
        };
        const res = await updateVendorAccount(editingAccount.id, patch);
        onAccountSaved(res.account);
      } else {
        const payload: CreateVendorAccountRequest = {
          role,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password || undefined as unknown as string,
        };
        const res = await createVendorAccount(vendorId, payload);
        onAccountSaved(res.account);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save account"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {error && (
            <Alert variant="destructive" title="Validation Error">
              {error}
            </Alert>
          )}

          {/* Role selector */}
          <div className="space-y-1.5">
            <Label htmlFor="account-role" className="text-xs font-bold uppercase tracking-wider">
              Account Role <span className="text-rose-500">*</span>
            </Label>
            <select
              id="account-role"
              disabled={!!editingAccount}
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as "cashier" | "vendor_manager";
                setRole(newRole);
              }}
              className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
            >
              <option value="cashier">Cashier (Scanner App Access)</option>
              <option value="vendor_manager">Vendor Manager (Stats Portal)</option>
            </select>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="account-name" className="text-xs font-bold uppercase tracking-wider">
              Staff Full Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="account-name"
              required
              placeholder="e.g. Mostafa Ali"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl font-medium"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="account-email" className="text-xs font-bold uppercase tracking-wider">
              Email Address <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="account-email"
              type="email"
              required
              disabled={!!editingAccount}
              placeholder="e.g. staff.coffee@nu.edu.eg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl disabled:opacity-60"
            />
          </div>

          {/* Status for Edit */}
          {editingAccount && (
            <div className="space-y-1.5">
              <Label htmlFor="account-status" className="text-xs font-bold uppercase tracking-wider">
                Account Status
              </Label>
              <select
                id="account-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "disabled")}
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="active">Active (Access Allowed)</option>
                <option value="disabled">Disabled (Access Blocked)</option>
              </select>
            </div>
          )}

          {/* Password fields for New Account */}
          {!editingAccount && (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="account-pwd" className="text-xs font-bold uppercase tracking-wider">
                  Initial Password <span className="text-muted-foreground font-normal lowercase">(optional)</span>
                </Label>
                <Input
                  id="account-pwd"
                  type="password"
                  placeholder="Leave empty to email set-password link"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  helperText="Leave empty to email them a link to set their own password"
                />
              </div>

              {password && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="account-pwd-confirm" className="text-xs font-bold uppercase tracking-wider">
                      Confirm Password <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="account-pwd-confirm"
                      type="password"
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <PasswordStrengthMeter
                    password={password}
                    confirmPassword={confirmPassword}
                  />
                </>
              )}
            </div>
          )}
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
                <span>Saving account…</span>
              </>
            ) : (
              <span>{editingAccount ? "Save changes" : "Create account"}</span>
            )}
          </Button>
        </ModalFooter>
      </form>
  );
}
