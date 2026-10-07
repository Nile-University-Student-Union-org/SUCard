"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Users, KeyRound, Edit2, AlertCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listVendorAccounts, updateVendorAccount, listBranches } from "../api";
import { VendorAccountModal } from "./vendor-account-modal";
import { VendorAccountResetModal } from "./vendor-account-reset-modal";
import { cn } from "cn";
import type { VendorAccountDto, BranchDto } from "@/lib/vendors/types";

interface VendorAccountsTabProps {
  vendorId: string;
}

export function VendorAccountsTab({ vendorId }: VendorAccountsTabProps) {
  const [accounts, setAccounts] = useState<VendorAccountDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<VendorAccountDto | null>(null);
  const [resetAccount, setResetAccount] = useState<VendorAccountDto | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accRes, branchRes] = await Promise.all([
        listVendorAccounts(vendorId),
        listBranches(vendorId),
      ]);
      setAccounts(accRes.accounts || []);
      setBranches(branchRes.branches || []);
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
    Promise.all([listVendorAccounts(vendorId), listBranches(vendorId)])
      .then(([accRes, branchRes]) => {
        if (active) {
          setAccounts(accRes.accounts || []);
          setBranches(branchRes.branches || []);
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

  const handleToggleStatus = async (account: VendorAccountDto) => {
    const nextStatus = account.status === "active" ? "disabled" : "active";
    try {
      const res = await updateVendorAccount(account.id, { status: nextStatus });
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? res.account : a))
      );
      toast.success(
        `Account ${nextStatus === "active" ? "enabled" : "disabled"}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update account status"
      );
    }
  };

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return null;
    return branches.find((b) => b.id === branchId)?.name || "Unknown Branch";
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wide text-foreground">
            STAFF ACCOUNTS
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Cashiers assigned to scanner branches and vendor managers.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddOpen(true)}
          className="normal-case font-bold h-10 px-4 shadow-xs"
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
            <Button variant="primary" onClick={fetchData} className="normal-case font-bold mt-2">
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
            <Button variant="primary" onClick={() => setIsAddOpen(true)} className="normal-case font-bold mt-2">
              Add first account
            </Button>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {accounts.map((acc) => {
            const branchName = getBranchName(acc.branchId);

            return (
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
                    <span className="font-medium text-foreground/80">{acc.email}</span>

                    {branchName && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold">
                        <MapPin className="size-3 text-brand" />
                        <span>Branch: {branchName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(acc)}
                    className={cn(
                      "normal-case font-bold text-xs h-9 px-3",
                      acc.status === "active"
                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    )}
                  >
                    {acc.status === "active" ? "Disable" : "Enable"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetAccount(acc)}
                    className="normal-case font-bold text-xs h-9 px-3 rounded-xl border-border"
                  >
                    <KeyRound className="size-3.5 mr-1" />
                    <span>Reset password</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAccount(acc)}
                    className="normal-case font-bold text-xs h-9 px-3 rounded-xl border-border"
                  >
                    <Edit2 className="size-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>
            );
          })}
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
        branches={branches}
        editingAccount={editingAccount}
        onAccountSaved={handleAccountSaved}
      />

      {/* Reset Password Modal */}
      <VendorAccountResetModal
        account={resetAccount}
        isOpen={!!resetAccount}
        onClose={() => setResetAccount(null)}
      />
    </div>
  );
}
