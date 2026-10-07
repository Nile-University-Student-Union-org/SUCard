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
  BranchDto,
  CreateVendorAccountRequest,
  UpdateVendorAccountRequest,
} from "@/lib/vendors/types";

interface VendorAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  branches: BranchDto[];
  editingAccount: VendorAccountDto | null;
  onAccountSaved: (saved: VendorAccountDto) => void;
}

export function VendorAccountModal({
  isOpen,
  onClose,
  vendorId,
  branches,
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
          branches={branches}
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
  branches,
  editingAccount,
  onAccountSaved,
}: Omit<VendorAccountModalProps, "isOpen">) {
  const [role, setRole] = useState<"cashier" | "vendor_manager">(
    editingAccount?.role ?? "cashier"
  );
  const [branchId, setBranchId] = useState<string>(
    editingAccount?.branchId || (branches[0]?.id ?? "")
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

    if (role === "cashier" && !branchId) {
      setError("Please select a branch for the cashier");
      return;
    }

    if (!editingAccount) {
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
          branchId: role === "cashier" ? branchId : null,
          status,
        };
        const res = await updateVendorAccount(editingAccount.id, patch);
        onAccountSaved(res.account);
      } else {
        const payload: CreateVendorAccountRequest = {
          role,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          branchId: role === "cashier" ? branchId : null,
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
                if (newRole === "vendor_manager") {
                  setBranchId("");
                } else if (!branchId && branches.length > 0) {
                  setBranchId(branches[0].id);
                }
              }}
              className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
            >
              <option value="cashier">Cashier (Scanner App Access)</option>
              <option value="vendor_manager">Vendor Manager (Stats Portal)</option>
            </select>
          </div>

          {/* Branch selector for Cashier */}
          {role === "cashier" && (
            <div className="space-y-1.5">
              <Label htmlFor="account-branch" className="text-xs font-bold uppercase tracking-wider">
                Assigned Branch <span className="text-rose-500">*</span>
              </Label>
              {branches.length === 0 ? (
                <p className="text-xs text-rose-500 font-semibold">
                  No branches found. Please create a branch in the Branches tab first.
                </p>
              ) : (
                <select
                  id="account-branch"
                  required
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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
                  Password <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="account-pwd"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account-pwd-confirm" className="text-xs font-bold uppercase tracking-wider">
                  Confirm Password <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="account-pwd-confirm"
                  type="password"
                  required
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
