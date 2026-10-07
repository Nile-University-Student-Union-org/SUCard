"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  CreditCard,
  Wallet,
  Receipt,
  Edit2,
  Ban,
  CheckCircle2,
  Trash2,
  Link as LinkIcon,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {
  formatCairoDateOnly,
  formatCairoDateTime,
  formatCurrency,
} from "@/components/ui/analytics-format";
import type { StudentDetailResponse } from "@/lib/analytics/types";
import type { CardFlow } from "@/lib/student/types";
import { cn } from "cn";

interface StudentDetailManagerProps {
  studentId: string;
  role: string;
}

export function StudentDetailManager({ studentId }: StudentDetailManagerProps) {
  const router = useRouter();

  const [student, setStudent] = useState<StudentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redemptions pagination
  const [redemptions, setRedemptions] = useState<StudentDetailResponse["redemptions"]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals state
  // 1. Edit Profile (Name + ID)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUniId, setEditUniId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 2. Suspend / Reactivate
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  // 3. Delete Student (Danger Zone)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 4. Link Card
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkInputMode, setLinkInputMode] = useState<"serial" | "qr">("serial");
  const [serialInput, setSerialInput] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // 5. Void Card
  const [voidingCardId, setVoidingCardId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  // 6. Switch Flow
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isChangingFlow, setIsChangingFlow] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  const fetchStudentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(res.status === 404 ? "Student not found" : `HTTP ${res.status}`);
      }

      const data = (await res.json()) as StudentDetailResponse;
      setStudent(data);
      setRedemptions(data.redemptions);
      setNextCursor(data.nextCursor);
      setEditName(data.name);
      setEditUniId(data.profile.universityId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student");
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/students/${studentId}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(res.status === 404 ? "Student not found" : `HTTP ${res.status}`);
        }

        const data = (await res.json()) as StudentDetailResponse;
        if (!ignore) {
          setStudent(data);
          setRedemptions(data.redemptions);
          setNextCursor(data.nextCursor);
          setEditName(data.name);
          setEditUniId(data.profile.universityId);
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load student");
          setIsLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [studentId, fetchStudentData]);

  // Load more redemptions
  const handleLoadMoreRedemptions = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}?cursor=${encodeURIComponent(nextCursor)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load more redemptions");
      const data = (await res.json()) as StudentDetailResponse;
      setRedemptions((prev) => [...prev, ...data.redemptions]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Profile Edit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          universityId: editUniId.trim() || undefined,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(resData.error || "Failed to update profile");
        setIsEditing(false);
        return;
      }

      setStudent(resData as StudentDetailResponse);
      setIsEditOpen(false);
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  // Suspend
  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuspending(true);
    setSuspendError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason.trim() }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuspendError(resData.error || "Failed to suspend student");
        setIsSuspending(false);
        return;
      }

      if (student) {
        setStudent({
          ...student,
          profile: {
            ...student.profile,
            status: "suspended",
            suspendReason: suspendReason.trim(),
          },
        });
      }
      setIsSuspendOpen(false);
      setSuspendReason("");
    } catch {
      setSuspendError("Network error. Please try again.");
    } finally {
      setIsSuspending(false);
    }
  };

  // Reactivate
  const handleReactivate = async () => {
    setIsSuspending(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reactivate`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Failed to reactivate");

      if (student) {
        setStudent({
          ...student,
          profile: {
            ...student.profile,
            status: "active",
            suspendReason: null,
          },
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reactivation failed");
    } finally {
      setIsSuspending(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || deleteEmailInput.trim().toLowerCase() !== student.email.toLowerCase()) {
      setDeleteError("Email address does not match.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteEmailInput.trim().toLowerCase() }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(resData.error || "Failed to delete student");
        setIsDeleting(false);
        return;
      }

      // Deleted successfully -> redirect to students index
      router.replace("/admin/students");
    } catch {
      setDeleteError("Network error. Please try again.");
      setIsDeleting(false);
    }
  };

  // Link Card
  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setLinkError(null);

    const payload =
      linkInputMode === "serial"
        ? { serial: serialInput.trim() }
        : { qr: qrInput.trim() };

    try {
      const res = await fetch(`/api/admin/students/${studentId}/link-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLinkError(resData.error || "Failed to link card");
        setIsLinking(false);
        return;
      }

      setIsLinkOpen(false);
      setSerialInput("");
      setQrInput("");
      fetchStudentData();
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  // Void Card
  const handleVoidCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingCardId) return;
    setIsVoiding(true);
    setVoidError(null);

    try {
      const res = await fetch(`/api/admin/cards/${voidingCardId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason.trim() || "Voided by admin" }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVoidError(resData.error || "Failed to void card");
        setIsVoiding(false);
        return;
      }

      setVoidingCardId(null);
      setVoidReason("");
      fetchStudentData();
    } catch {
      setVoidError("Network error. Please try again.");
    } finally {
      setIsVoiding(false);
    }
  };

  // Change Flow
  const handleChangeFlow = async (targetFlow: CardFlow) => {
    setIsChangingFlow(true);
    setFlowError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardFlow: targetFlow }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlowError(resData.error || "Failed to update flow");
        setIsChangingFlow(false);
        return;
      }

      if (student) {
        setStudent({
          ...student,
          profile: { ...student.profile, cardFlow: targetFlow },
        });
      }
      setIsFlowOpen(false);
    } catch {
      setFlowError("Network error. Please try again.");
    } finally {
      setIsChangingFlow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Students</span>
        </Link>
        <StatusState
          icon={<GraduationCap className="size-8" />}
          variant="warning"
          title="Student not found"
          description={error || "The student account could not be found."}
          actions={
            <Button
              variant="primary"
              onClick={fetchStudentData}
              className="normal-case font-bold mt-2"
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const activeCard = student.cards.find((c) => c.status === "active");

  return (
    <div className="space-y-6">
      {/* Top Back Link */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Students</span>
        </Link>
      </div>

      {/* 1. PROFILE HEADER CARD */}
      <div className="p-5 sm:p-7 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <UserAvatar name={student.name} size={64} shape="rounded" />

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl font-normal uppercase tracking-wide text-foreground truncate">
                {student.name}
              </h1>

              {/* Status Badge */}
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                  student.profile.status === "active"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                )}
              >
                {student.profile.status}
              </span>

              {/* Flow Badge */}
              <Badge
                variant={student.profile.cardFlow === "digital" ? "brand" : "secondary"}
                className="text-[10px] uppercase font-bold"
              >
                {student.profile.cardFlow} Flow
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-mono">
              <span className="text-foreground font-bold font-sans">
                ID: {student.profile.universityId}
              </span>
              <span>&bull;</span>
              <span>{student.email}</span>
              <span>&bull;</span>
              <span className="font-sans">
                Registered: {formatCairoDateOnly(student.profile.registeredAt)}
              </span>
            </div>

            {student.profile.suspendReason && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-medium">
                Suspension Reason: {student.profile.suspendReason}
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="surface"
            size="sm"
            onClick={() => {
              setEditName(student.name);
              setEditUniId(student.profile.universityId);
              setEditError(null);
              setIsEditOpen(true);
            }}
            className="normal-case font-bold h-10 px-3.5 text-xs"
          >
            <Edit2 className="size-3.5 mr-1.5" />
            Edit Profile
          </Button>

          {student.profile.status === "active" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSuspendReason("");
                setSuspendError(null);
                setIsSuspendOpen(true);
              }}
              className="normal-case font-bold h-10 px-3.5 text-xs"
            >
              <Ban className="size-3.5 mr-1.5" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="surface"
              size="sm"
              disabled={isSuspending}
              onClick={handleReactivate}
              className="normal-case font-bold h-10 px-3.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" />
              Reactivate
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFlowOpen(true)}
            className="normal-case font-semibold h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowRightLeft className="size-3.5 mr-1" />
            Flow
          </Button>
        </div>
      </div>

      {/* TWO COLUMNS: Active Card & History / Wallet Passes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD & CARDS HISTORY */}
        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-brand dark:text-brand-soft" />
              <CardTitle className="text-lg text-foreground">
                MEMBERSHIP CARDS
              </CardTitle>
            </div>
            {!activeCard && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSerialInput("");
                  setQrInput("");
                  setLinkError(null);
                  setIsLinkOpen(true);
                }}
                className="normal-case font-bold h-8 px-3 text-xs"
              >
                <LinkIcon className="size-3 mr-1" />
                Link Card
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Active Card Details */}
            {activeCard ? (
              <div className="p-4 rounded-xl border-2 border-brand/30 dark:border-brand-soft/30 bg-brand/5 dark:bg-brand/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand dark:text-brand-soft block">
                      Active Card
                    </span>
                    <span className="font-mono text-lg font-bold text-foreground">
                      {activeCard.serial}
                    </span>
                  </div>
                  <Badge variant="brand" className="text-xs uppercase font-bold">
                    {activeCard.type}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground font-mono">
                  Linked: {formatCairoDateTime(activeCard.linkedAt)}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-brand/20">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setVoidingCardId(activeCard.id);
                      setVoidReason("");
                      setVoidError(null);
                    }}
                    className="h-8 px-3 text-xs normal-case font-bold"
                  >
                    <Ban className="size-3 mr-1" />
                    Void Card
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">No active card linked</p>
                <p>This student does not currently have an active physical or digital card.</p>
              </div>
            )}

            {/* Past Cards History */}
            {student.cards.filter((c) => c.status !== "active").length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
                  Previous Cards History
                </p>
                <div className="space-y-2">
                  {student.cards
                    .filter((c) => c.status !== "active")
                    .map((card) => (
                      <div
                        key={card.id}
                        className="p-3 rounded-xl border border-border bg-muted/30 text-xs space-y-1 font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{card.serial}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300">
                            {card.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-sans">
                          Type: <strong className="uppercase">{card.type}</strong> &bull; Voided:{" "}
                          {formatCairoDateTime(card.voidedAt)}
                        </div>
                        {card.voidReason && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-sans">
                            Reason: {card.voidReason}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WALLET PASSES */}
        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-sky-600 dark:text-sky-400" />
              <CardTitle className="text-lg text-foreground">
                WALLET PASSES
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs font-mono font-bold">
              {student.walletPasses.length} Issued
            </Badge>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            {student.walletPasses.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">No wallet passes issued</p>
                <p>The student has not yet added their SU Card to Google or Apple Wallet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.walletPasses.map((pass, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground capitalize">
                        {pass.platform} Wallet Pass
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        Active
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                      <p className="truncate">Object ID: {pass.objectId}</p>
                      <p>First Issued: {formatCairoDateTime(pass.firstIssuedAt)}</p>
                      <p>Last Synced: {formatCairoDateTime(pass.lastSyncedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FULL REDEMPTION HISTORY TABLE */}
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-brand dark:text-brand-soft" />
            <CardTitle className="text-lg text-foreground">
              REDEMPTION HISTORY
            </CardTitle>
          </div>
          <span className="text-xs font-mono text-muted-foreground font-bold">
            {redemptions.length} Scans Loaded
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {redemptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No discounts redeemed by this student yet.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Offer Claimed</th>
                      <th className="px-4 py-3 text-right">Bill Amount</th>
                      <th className="px-4 py-3 text-right">Time (Cairo)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {redemptions.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors font-mono">
                        <td className="px-4 py-3 font-sans font-bold text-foreground">
                          {r.vendorName}
                        </td>
                        <td className="px-4 py-3 font-sans text-foreground">
                          {r.branchName}
                        </td>
                        <td className="px-4 py-3 font-sans text-muted-foreground">
                          {r.offerTitle || "Standard Discount"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {r.billAmount ? formatCurrency(r.billAmount) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatCairoDateTime(r.confirmedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border p-3 space-y-2">
                {redemptions.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-border bg-card space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-foreground">{r.vendorName}</span>
                      <span className="font-mono text-brand dark:text-brand-soft">
                        {r.billAmount ? formatCurrency(r.billAmount) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{r.branchName}</span>
                      <span>{r.offerTitle || "Discount"}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono pt-1">
                      {formatCairoDateTime(r.confirmedAt)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreRedemptions}
                    disabled={isLoadingMore}
                    className="font-bold normal-case text-xs min-h-[40px]"
                  >
                    {isLoadingMore ? "Loading more…" : "Load more redemptions"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* DANGER ZONE: Delete Student */}
      <Card className="border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-rose-200 dark:border-rose-900/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="size-5 text-rose-600 dark:text-rose-400" />
            <div>
              <CardTitle className="text-base sm:text-lg text-rose-900 dark:text-rose-200">
                DANGER ZONE
              </CardTitle>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                Permanent student account deletion (M8-6c)
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground space-y-1 max-w-xl">
            <p className="font-semibold text-foreground">
              Deleting this student permanently removes their profile and voids their card.
            </p>
            <p>
              Their past redemptions are preserved anonymously so partner vendor statistics and financial totals remain intact.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={() => {
              setDeleteEmailInput("");
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            className="normal-case font-bold h-10 px-4 shrink-0"
          >
            <Trash2 className="size-4 mr-1.5" />
            Delete Student
          </Button>
        </CardContent>
      </Card>

      {/* MODAL 1: Edit Profile (Corrections) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          if (!isEditing) setIsEditOpen(false);
        }}
        title="Edit Student Profile"
        icon={<Edit2 className="size-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile}>
          <ModalBody className="space-y-4">
            {editError && (
              <Alert variant="destructive" size="sm" description={editError} />
            )}

            <Input
              id="editStudentName"
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <Input
              id="editStudentUniId"
              label="University ID (9 digits)"
              value={editUniId}
              onChange={(e) => setEditUniId(e.target.value)}
              pattern="^\d{9}$"
              maxLength={9}
              required
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isEditing}
              onClick={() => setIsEditOpen(false)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isEditing}
              className="normal-case font-bold"
            >
              {isEditing ? "Saving…" : "Save Changes"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 2: Suspend Student */}
      <Modal
        isOpen={isSuspendOpen}
        onClose={() => {
          if (!isSuspending) setIsSuspendOpen(false);
        }}
        title="Suspend Student Account"
        icon={<Ban className="size-5 text-rose-600" />}
        maxWidth="md"
      >
        <form onSubmit={handleSuspend}>
          <ModalBody className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Suspending this student will immediately block all card scans and update their mobile wallet passes.
            </p>

            {suspendError && (
              <Alert variant="destructive" size="sm" description={suspendError} />
            )}

            <Input
              id="suspendReasonInput"
              label="Suspension Reason (Required)"
              placeholder="e.g. Terms violation, reported fraud, disciplinary review"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              required
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isSuspending}
              onClick={() => setIsSuspendOpen(false)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSuspending || !suspendReason.trim()}
              className="normal-case font-bold"
            >
              {isSuspending ? "Suspending…" : "Confirm Suspension"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 3: Delete Student (Danger Zone) */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteOpen(false);
        }}
        title="Permanently Delete Student"
        icon={<Trash2 className="size-5 text-rose-600" />}
        maxWidth="md"
      >
        <form onSubmit={handleDeleteStudent}>
          <ModalBody className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
              <p className="font-bold">Warning: This action cannot be undone.</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>The student&apos;s personal profile is erased.</li>
                <li>Their active card is permanently cancelled.</li>
                <li>Past redemption history is preserved anonymously.</li>
              </ul>
            </div>

            {deleteError && (
              <Alert variant="destructive" size="sm" description={deleteError} />
            )}

            <div>
              <label htmlFor="confirmEmailDelete" className="block text-xs font-bold text-foreground mb-1">
                Type the student&apos;s email to confirm: <span className="font-mono text-rose-600 font-bold">{student.email}</span>
              </label>
              <Input
                id="confirmEmailDelete"
                type="email"
                placeholder={student.email}
                value={deleteEmailInput}
                onChange={(e) => setDeleteEmailInput(e.target.value)}
                required
                autoFocus
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setIsDeleteOpen(false)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting || deleteEmailInput.trim().toLowerCase() !== student.email.toLowerCase()}
              className="normal-case font-bold"
            >
              {isDeleting ? "Deleting…" : "Delete Student"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 4: Link Card */}
      <Modal
        isOpen={isLinkOpen}
        onClose={() => {
          if (!isLinking) setIsLinkOpen(false);
        }}
        title="Link Membership Card"
        icon={<LinkIcon className="size-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleLinkCard}>
          <ModalBody className="space-y-4">
            {linkError && (
              <Alert variant="destructive" size="sm" description={linkError} />
            )}

            <div className="flex rounded-xl p-1 bg-muted border border-border">
              <button
                type="button"
                onClick={() => setLinkInputMode("serial")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  linkInputMode === "serial"
                    ? "bg-white dark:bg-zinc-800 shadow-xs text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                By Serial Number
              </button>
              <button
                type="button"
                onClick={() => setLinkInputMode("qr")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  linkInputMode === "qr"
                    ? "bg-white dark:bg-zinc-800 shadow-xs text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                By QR Payload
              </button>
            </div>

            {linkInputMode === "serial" ? (
              <Input
                id="linkSerialDirect"
                label="Card Serial Number"
                placeholder="SU-000123 or 123"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                required
                autoFocus
              />
            ) : (
              <Textarea
                id="linkQrDirect"
                label="QR Code Text"
                placeholder="NUSU1:... or URL"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                rows={3}
                required
                autoFocus
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isLinking}
              onClick={() => setIsLinkOpen(false)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLinking}
              className="normal-case font-bold"
            >
              {isLinking ? "Linking…" : "Link Card"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 5: Void Card */}
      <Modal
        isOpen={voidingCardId !== null}
        onClose={() => {
          if (!isVoiding) setVoidingCardId(null);
        }}
        title="Void Membership Card"
        icon={<Ban className="size-5 text-rose-600" />}
        maxWidth="md"
      >
        <form onSubmit={handleVoidCard}>
          <ModalBody className="space-y-4">
            {voidError && (
              <Alert variant="destructive" size="sm" description={voidError} />
            )}

            <Input
              id="voidCardReason"
              label="Void Reason"
              placeholder="e.g. Card reported lost by student, replaced with physical card"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              required
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isVoiding}
              onClick={() => setVoidingCardId(null)}
              className="normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isVoiding}
              className="normal-case font-bold"
            >
              {isVoiding ? "Voiding…" : "Confirm Void"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL 6: Switch Flow */}
      <Modal
        isOpen={isFlowOpen}
        onClose={() => {
          if (!isChangingFlow) setIsFlowOpen(false);
        }}
        title="Change Card Flow"
        icon={<ArrowRightLeft className="size-5" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Current Flow: <strong className="uppercase">{student.profile.cardFlow}</strong>
          </p>

          {flowError && (
            <Alert variant="destructive" size="sm" description={flowError} />
          )}

          <p className="text-xs text-muted-foreground">
            Select the new flow for this student. Switching to digital grants immediate pass access.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isChangingFlow}
            onClick={() => setIsFlowOpen(false)}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          {student.profile.cardFlow === "physical" ? (
            <Button
              type="button"
              variant="primary"
              disabled={isChangingFlow}
              onClick={() => handleChangeFlow("digital")}
              className="normal-case font-bold"
            >
              {isChangingFlow ? "Switching…" : "Switch to Digital"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={isChangingFlow}
              onClick={() => handleChangeFlow("physical")}
              className="normal-case font-bold"
            >
              {isChangingFlow ? "Switching…" : "Switch to Physical"}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
