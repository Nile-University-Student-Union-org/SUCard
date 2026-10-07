"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, Edit2, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listBranches, createBranch, updateBranch } from "../api";
import { cn } from "cn";
import type { BranchDto, CreateBranchRequest, UpdateBranchRequest } from "@/lib/vendors/types";

interface VendorBranchesTabProps {
  vendorId: string;
}

export function VendorBranchesTab({ vendorId }: VendorBranchesTabProps) {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchBranchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listBranches(vendorId);
      setBranches(res.branches || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load branches"
      );
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    let active = true;
    listBranches(vendorId)
      .then((res) => {
        if (active) {
          setBranches(res.branches || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load branches"
          );
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  const openAddModal = () => {
    setName("");
    setAddress("");
    setLat("");
    setLng("");
    setStatus("active");
    setModalError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (branch: BranchDto) => {
    setName(branch.name);
    setAddress(branch.address);
    setLat(branch.lat !== null ? String(branch.lat) : "");
    setLng(branch.lng !== null ? String(branch.lng) : "");
    setStatus(branch.status);
    setModalError(null);
    setEditingBranch(branch);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setModalError("Branch name and address are required");
      return;
    }

    const parsedLat = lat.trim() ? parseFloat(lat.trim()) : null;
    const parsedLng = lng.trim() ? parseFloat(lng.trim()) : null;

    if (parsedLat !== null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      setModalError("Latitude must be a valid number between -90 and 90");
      return;
    }

    if (parsedLng !== null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      setModalError("Longitude must be a valid number between -180 and 180");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingBranch) {
        const patch: UpdateBranchRequest = {
          name: name.trim(),
          address: address.trim(),
          lat: parsedLat,
          lng: parsedLng,
          status,
        };
        const res = await updateBranch(editingBranch.id, patch);
        setBranches((prev) =>
          prev.map((b) => (b.id === editingBranch.id ? res.branch : b))
        );
        toast.success("Branch updated successfully!");
        setEditingBranch(null);
      } else {
        const payload: CreateBranchRequest = {
          name: name.trim(),
          address: address.trim(),
          lat: parsedLat,
          lng: parsedLng,
          status,
        };
        const res = await createBranch(vendorId, payload);
        setBranches((prev) => [...prev, res.branch]);
        toast.success("Branch added successfully!");
        setIsAddOpen(false);
      }
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to save branch"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBranchStatus = async (branch: BranchDto) => {
    const nextStatus = branch.status === "active" ? "inactive" : "active";
    try {
      const res = await updateBranch(branch.id, { status: nextStatus });
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? res.branch : b))
      );
      toast.success(
        `Branch ${nextStatus === "active" ? "activated" : "deactivated"}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update branch status"
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-wide text-foreground">
            STORE BRANCHES
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Manage physical branches where students can redeem SU discounts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openAddModal}
          className="normal-case font-bold h-10 px-4 shadow-xs"
        >
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          <span>Add branch</span>
        </Button>
      </div>

      {/* Branches List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card/60 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          ))}
        </div>
      ) : error ? (
        <StatusState
          icon={<MapPin className="size-6" />}
          variant="warning"
          title="Could not load branches"
          description={error}
          actions={
            <Button variant="primary" onClick={fetchBranchList} className="normal-case font-bold mt-2">
              Retry
            </Button>
          }
        />
      ) : branches.length === 0 ? (
        <StatusState
          icon={<MapPin className="size-6" />}
          variant="default"
          title="No branches configured"
          description="Every vendor needs at least one branch for cashier scanners to work."
          actions={
            <Button variant="primary" onClick={openAddModal} className="normal-case font-bold mt-2">
              Add first branch
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft">
                      <MapPin className="size-4" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">
                      {branch.name}
                    </h4>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                      branch.status === "active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        branch.status === "active" ? "bg-emerald-500" : "bg-zinc-400"
                      )}
                    />
                    <span>{branch.status}</span>
                  </span>
                </div>

                <p className="text-xs text-muted-foreground font-medium pl-8">
                  {branch.address}
                </p>

                {branch.lat !== null && branch.lng !== null && (
                  <div className="pl-8 flex items-center gap-1 text-[11px] text-muted-foreground/80 font-mono">
                    <Navigation className="size-3" />
                    <span>
                      {branch.lat.toFixed(5)}, {branch.lng.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>

              {/* Branch Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleBranchStatus(branch)}
                  className={cn(
                    "normal-case font-bold text-xs h-9 px-3",
                    branch.status === "active"
                      ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  {branch.status === "active" ? "Deactivate" : "Activate"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(branch)}
                  className="normal-case font-bold text-xs h-9 px-3 rounded-xl border-border"
                >
                  <Edit2 className="size-3.5 mr-1" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      <Modal
        isOpen={isAddOpen || !!editingBranch}
        onClose={() => {
          if (!isSubmitting) {
            setIsAddOpen(false);
            setEditingBranch(null);
          }
        }}
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBranch}>
          <ModalBody className="space-y-4">
            {modalError && (
              <Alert variant="destructive" title="Error">
                {modalError}
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="branch-name" className="text-xs font-bold uppercase tracking-wider">
                Branch Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="branch-name"
                required
                placeholder="e.g. Main Gate, Library Corner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch-address" className="text-xs font-bold uppercase tracking-wider">
                Address / Location <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="branch-address"
                required
                placeholder="e.g. Near Main Gate, Ground Floor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="branch-lat" className="text-xs font-semibold">
                  Latitude (Optional)
                </Label>
                <Input
                  id="branch-lat"
                  placeholder="30.0123"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch-lng" className="text-xs font-semibold">
                  Longitude (Optional)
                </Label>
                <Input
                  id="branch-lng"
                  placeholder="31.2345"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch-status" className="text-xs font-bold uppercase tracking-wider">
                Status
              </Label>
              <select
                id="branch-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddOpen(false);
                setEditingBranch(null);
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
                  <span>Saving…</span>
                </>
              ) : (
                <span>{editingBranch ? "Save changes" : "Add branch"}</span>
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
