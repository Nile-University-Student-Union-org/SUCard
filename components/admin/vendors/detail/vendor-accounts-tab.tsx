"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Users,
  KeyRound,
  Edit2,
  AlertCircle,
  LogOut,
  Loader2,
  UserX,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import {
  listVendorAccounts,
  updateVendorAccount,
  revokeVendorAccountSessions,
} from "../api";
import { VendorAccountModal } from "./vendor-account-modal";
import { VendorAccountResetModal } from "./vendor-account-reset-modal";
import { cn } from "cn";
import type { VendorAccountDto } from "@/lib/vendors/types";

interface VendorAccountsTabProps {
  vendorId: string;
}

export function VendorAccountsTab({ vendorId }: VendorAccountsTabProps) {
  const [accounts, setAccounts] = useState<VendorAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<VendorAccountDto | null>(null);
  const [resetAccount, setResetAccount] = useState<VendorAccountDto | null>(null);
  const [statusAccount, setStatusAccount] = useState<VendorAccountDto | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [revokeAccount, setRevokeAccount] = useState<VendorAccountDto | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accRes = await listVendorAccounts(vendorId);
      setAccounts(accRes.accounts || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vendor accounts"
      );
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    let active = true;
    listVendorAccounts(vendorId)
      .then((accRes) => {
        if (active) {
          setAccounts(accRes.accounts || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load vendor accounts"
          );
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  const handleAccountSaved = (saved: VendorAccountDto) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      if (exists) {
        return prev.map((a) => (a.id === saved.id ? saved : a));
      }
      return [saved, ...prev];
    });
    setEditingAccount(null);
    setIsAddOpen(false);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAccount) return;
    const nextStatus = statusAccount.status === "active" ? "disabled" : "active";
    setIsUpdatingStatus(true);
    try {
      const res = await updateVendorAccount(statusAccount.id, { status: nextStatus });
      setAccounts((prev) =>
        prev.map((a) => (a.id === statusAccount.id ? res.account : a))
      );
      toast.success(
        `Account ${nextStatus === "active" ? "enabled" : "disabled"} for ${statusAccount.name}`
      );
      setStatusAccount(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update account status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!revokeAccount) return;
    setIsRevoking(true);
    try {
      await revokeVendorAccountSessions(revokeAccount.id);
      toast.success(`Signed out all devices for ${revokeAccount.name}`);
      setRevokeAccount(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sign out devices"
      );
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wide text-foreground">
            STAFF ACCOUNTS
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Cashiers and vendor managers for this vendor.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddOpen(true)}
          className="normal-case font-bold h-11 min-h-[44px] px-5 shadow-xs shrink-0"
        >
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          <span>Add account</span>
        </Button>
      </div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card/60 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : error ? (
        <StatusState
          icon={<AlertCircle className="size-6" />}
          variant="warning"
          title="Could not load accounts"
          description={error}
          actions={
            <Button
              variant="primary"
              onClick={fetchData}
              className="normal-case font-bold mt-2 min-h-[44px]"
            >
              Retry
            </Button>
          }
        />
      ) : accounts.length === 0 ? (
        <StatusState
          icon={<Users className="size-6" />}
          variant="default"
          title="No staff accounts created"
          description="Create cashier accounts so store staff can log in to the /scan scanner app."
          actions={
            <Button
              variant="primary"
              onClick={() => setIsAddOpen(true)}
              className="normal-case font-bold mt-2 min-h-[44px]"
            >
              Add first account
            </Button>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
            >
              {/* Account Details */}
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-bold text-base text-foreground truncate">
                    {acc.name}
                  </h4>

                  {/* Role badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                      acc.role === "cashier"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                    )}
                  >
                    <span>{acc.role === "cashier" ? "Cashier" : "Vendor Manager"}</span>
                  </span>

                  {/* Status Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      acc.status === "active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    )}
                  >
                    {acc.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground/80 font-mono">{acc.email}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAccount(acc)}
                  className="normal-case font-bold text-xs h-11 min-h-[44px] px-3.5 rounded-xl border-border"
                >
                  <Edit2 className="size-3.5 mr-1.5" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetAccount(acc)}
                  className="normal-case font-bold text-xs h-11 min-h-[44px] px-3.5 rounded-xl border-border"
                >
                  <KeyRound className="size-3.5 mr-1.5" />
                  <span>Reset password</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokeAccount(acc)}
                  className="normal-case font-bold text-xs h-11 min-h-[44px] px-3.5 rounded-xl border-border"
                  title="Sign out all devices for this account"
                >
                  <LogOut className="size-3.5 mr-1.5" />
                  <span>Sign out</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusAccount(acc)}
                  className={cn(
                    "normal-case font-bold text-xs h-11 min-h-[44px] px-3.5 rounded-xl",
                    acc.status === "active"
                      ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  {acc.status === "active" ? (
                    <>
                      <UserX className="size-3.5 mr-1.5" />
                      <span>Disable</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5 mr-1.5" />
                      <span>Enable</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      <VendorAccountModal
        isOpen={isAddOpen || !!editingAccount}
        onClose={() => {
          setIsAddOpen(false);
          setEditingAccount(null);
        }}
        vendorId={vendorId}
        editingAccount={editingAccount}
        onAccountSaved={handleAccountSaved}
      />

      {/* Reset Password Modal */}
      <VendorAccountResetModal
        account={resetAccount}
        isOpen={!!resetAccount}
        onClose={() => setResetAccount(null)}
      />

      {/* Disable / Enable Confirmation Modal */}
      <Modal
        isOpen={!!statusAccount}
        onClose={() => {
          if (!isUpdatingStatus) setStatusAccount(null);
        }}
        title={statusAccount?.status === "active" ? "Disable Staff Account?" : "Enable Staff Account?"}
        icon={
          statusAccount?.status === "active" ? (
            <UserX className="size-5 text-rose-600 dark:text-rose-400" />
          ) : (
            <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          )
        }
        maxWidth="md"
      >
        <ModalBody className="space-y-4">
          <p className="text-sm text-foreground">
            {statusAccount?.status === "active" ? (
              <>
                Are you sure you want to disable access for{" "}
                <strong className="font-bold text-foreground">{statusAccount?.name}</strong>{" "}
                (<span className="font-mono text-xs">{statusAccount?.email}</span>)?
              </>
            ) : (
              <>
                Enable access for{" "}
                <strong className="font-bold text-foreground">{statusAccount?.name}</strong>{" "}
                (<span className="font-mono text-xs">{statusAccount?.email}</span>)?
              </>
            )}
          </p>

          <div
            className={cn(
              "p-3.5 rounded-xl border text-xs",
              statusAccount?.status === "active"
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
            )}
          >
            <p className="font-bold mb-1">
              {statusAccount?.status === "active"
                ? "Consequences of disabling"
                : "Consequences of enabling"}
            </p>
            <p className="font-normal leading-relaxed opacity-90">
              {statusAccount?.status === "active"
                ? statusAccount.role === "cashier"
                  ? "This cashier will immediately be blocked from logging into the /scan app. Active scanner sessions will be rejected."
                  : "This manager will lose access to the vendor analytics portal immediately."
                : "The user will be able to sign in and perform their role responsibilities again."}
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStatusAccount(null)}
            disabled={isUpdatingStatus}
            className="normal-case font-semibold h-11 min-h-[44px]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={statusAccount?.status === "active" ? "destructive" : "primary"}
            onClick={handleConfirmStatusChange}
            disabled={isUpdatingStatus}
            className="normal-case font-bold h-11 min-h-[44px] px-5"
          >
            {isUpdatingStatus ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Updating…</span>
              </>
            ) : (
              <span>
                {statusAccount?.status === "active" ? "Disable account" : "Enable account"}
              </span>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Sign Out Devices Confirmation Modal */}
      <Modal
        isOpen={!!revokeAccount}
        onClose={() => {
          if (!isRevoking) setRevokeAccount(null);
        }}
        title="Sign Out All Devices"
        icon={<LogOut className="size-5 text-amber-600 dark:text-amber-400" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-4">
          <p className="text-sm text-foreground">
            Sign out all active sessions for{" "}
            <strong className="font-bold">{revokeAccount?.name}</strong>{" "}
            (<span className="font-mono text-xs">{revokeAccount?.email}</span>)?
          </p>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs">
            <p className="font-bold mb-1">Cashier register sessions</p>
            <p className="text-amber-800 dark:text-amber-300 font-normal leading-relaxed">
              Cashier scanning devices stay signed in for 30 days unless revoked. Revoking sessions will immediately require signing in again on all register devices.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRevokeAccount(null)}
            disabled={isRevoking}
            className="normal-case font-semibold h-11 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleRevokeSessions}
            disabled={isRevoking}
            className="normal-case font-bold bg-amber-600 hover:bg-amber-700 text-white h-11 min-h-[44px] px-5"
          >
            {isRevoking ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                <span>Signing out…</span>
              </>
            ) : (
              <span>Sign out all devices</span>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
