"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  GraduationCap,
  Link as LinkIcon,
  Ban,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  ArrowRightLeft,
  Download,
  CheckSquare,
  Eye,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { StudentSearchItem, StudentSearchResponse, CardFlow } from "@/lib/student/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { StatusState } from "@/components/ui/status-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { OverflowScroller } from "@/components/ui/overflow-scroller";
import {
  formatCairoDateOnly,
} from "@/components/ui/analytics-format";
import { cn } from "cn";

interface StudentsManagerProps {
  role: string;
}

export function StudentsManager({ role }: StudentsManagerProps) {
  const isSuperAdmin = role === "super_admin";

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [signedUpFrom, setSignedUpFrom] = useState("");
  const [signedUpTo, setSignedUpTo] = useState("");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // Data state
  const [students, setStudents] = useState<StudentSearchItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk action modals
  const [bulkAction, setBulkAction] = useState<"suspend" | "reactivate" | null>(null);
  const [bulkReason, setBulkReason] = useState("");
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Single action modals
  const [linkingStudent, setLinkingStudent] = useState<StudentSearchItem | null>(null);
  const [linkInputMode, setLinkInputMode] = useState<"serial" | "qr">("serial");
  const [serialInput, setSerialInput] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [voidingStudent, setVoidingStudent] = useState<StudentSearchItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const [flowStudent, setFlowStudent] = useState<StudentSearchItem | null>(null);
  const [isChangingFlow, setIsChangingFlow] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  const [promotingStudent, setPromotingStudent] = useState<StudentSearchItem | null>(null);
  const [revokingStudent, setRevokingStudent] = useState<StudentSearchItem | null>(null);
  const [isRoleChanging, setIsRoleChanging] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchStudents = useCallback(
    async (q: string, status: string, fromDate?: string, toDate?: string, cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (status && status !== "all") params.set("status", status);
        if (fromDate) params.set("signedUpFrom", fromDate);
        if (toDate) params.set("signedUpTo", toDate);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/students?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as StudentSearchResponse;
        return data;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to load students");
      }
    },
    []
  );

  // Debounced search & filter effect
  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      fetchStudents(searchQuery, statusFilter, signedUpFrom, signedUpTo)
        .then((data) => {
          if (active) {
            setStudents(data.students);
            setNextCursor(data.nextCursor);
            setSelectedIds(new Set());
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.message);
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, statusFilter, signedUpFrom, signedUpTo, fetchStudents]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsLoading(true);
    setError(null);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchStudents(
        searchQuery,
        statusFilter,
        signedUpFrom,
        signedUpTo,
        nextCursor
      );
      setStudents((prev) => [...prev, ...data.students]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (signedUpFrom) params.set("signedUpFrom", signedUpFrom);
    if (signedUpTo) params.set("signedUpTo", signedUpTo);
    window.open(`/api/admin/export/students?${params.toString()}`, "_blank");
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === students.length && students.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.profile.userId)));
    }
  };

  const handleToggleSelectOne = (userId: string) => {
    const next = new Set(selectedIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedIds(next);
  };

  // Bulk action submission
  const handleBulkSubmit = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    const targetCount = selectedIds.size;
    const targetAction = bulkAction;
    setIsBulkExecuting(true);
    setBulkError(null);

    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action: targetAction,
          ids: Array.from(selectedIds),
          reason: targetAction === "suspend" ? bulkReason.trim() : undefined,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(resData.error || "Bulk action failed");
        setIsBulkExecuting(false);
        return;
      }

      // Update in memory
      setStudents((prev) =>
        prev.map((s) =>
          selectedIds.has(s.profile.userId)
            ? {
                ...s,
                profile: {
                  ...s.profile,
                  status: targetAction === "suspend" ? "suspended" : "active",
                  suspendReason: targetAction === "suspend" ? bulkReason.trim() : null,
                },
              }
            : s
        )
      );

      setBulkAction(null);
      setBulkReason("");
      setSelectedIds(new Set());
      toast.success(
        `Successfully ${targetAction === "suspend" ? "suspended" : "reactivated"} ${targetCount} student account${targetCount === 1 ? "" : "s"}`
      );
    } catch {
      setBulkError("Network error. Please try again.");
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Single Link Card
  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingStudent) return;
    const student = linkingStudent;
    setIsLinking(true);
    setLinkError(null);

    const payload =
      linkInputMode === "serial"
        ? { serial: serialInput.trim() }
        : { qr: qrInput.trim() };

    try {
      const res = await fetch(`/api/admin/students/${student.profile.userId}/link-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLinkError(resData.error || "Failed to link card");
        setIsLinking(false);
        return;
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.profile.userId === student.profile.userId
            ? { ...s, card: resData.card }
            : s
        )
      );

      setLinkingStudent(null);
      setSerialInput("");
      setQrInput("");
      toast.success(`Card ${resData.card.serial} linked to ${student.name}`);
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  // Single Void Card
  const handleVoidCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingStudent || !voidingStudent.card) return;
    const student = voidingStudent;
    const activeCard = voidingStudent.card;
    const cardSerial = activeCard.serial;
    const cardId = activeCard.id;
    setIsVoiding(true);
    setVoidError(null);

    try {
      const res = await fetch(`/api/admin/cards/${cardId}/void`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ reason: voidReason.trim() || "Voided by admin" }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVoidError(resData.error || "Failed to void card");
        setIsVoiding(false);
        return;
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.profile.userId === student.profile.userId
            ? { ...s, card: null }
            : s
        )
      );

      setVoidingStudent(null);
      setVoidReason("");
      toast.success(`Card ${cardSerial} voided for ${student.name}`);
    } catch {
      setVoidError("Network error. Please try again.");
    } finally {
      setIsVoiding(false);
    }
  };

  // Single Change Flow
  const handleChangeFlow = async (targetFlow: CardFlow) => {
    if (!flowStudent) return;
    const student = flowStudent;
    setIsChangingFlow(true);
    setFlowError(null);

    try {
      const res = await fetch(`/api/admin/students/${student.profile.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ cardFlow: targetFlow }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlowError(resData.error || "Failed to update flow");
        setIsChangingFlow(false);
        return;
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.profile.userId === student.profile.userId
            ? { ...s, profile: { ...s.profile, cardFlow: targetFlow } }
            : s
        )
      );

      setFlowStudent(null);
      toast.success(`Updated ${student.name}'s issuance flow to ${targetFlow}`);
    } catch {
      setFlowError("Network error. Please try again.");
    } finally {
      setIsChangingFlow(false);
    }
  };

  // Staff promotion / revocation
  const handlePromoteAdmin = async () => {
    if (!promotingStudent) return;
    const student = promotingStudent;
    setIsRoleChanging(true);
    setRoleError(null);

    try {
      const res = await fetch("/api/admin/staff/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: student.email }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRoleError(resData.error || "Failed to promote student");
        setIsRoleChanging(false);
        return;
      }

      setPromotingStudent(null);
      toast.success(`Promoted ${student.name} to SU Admin`);
    } catch {
      setRoleError("Network error. Please try again.");
    } finally {
      setIsRoleChanging(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!revokingStudent) return;
    const student = revokingStudent;
    setIsRoleChanging(true);
    setRoleError(null);

    try {
      const res = await fetch(`/api/admin/staff/${student.profile.userId}/revoke`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRoleError(resData.error || "Failed to revoke admin role");
        setIsRoleChanging(false);
        return;
      }

      setRevokingStudent(null);
      toast.success(`Revoked SU Admin role for ${student.name}`);
    } catch {
      setRoleError("Network error. Please try again.");
    } finally {
      setIsRoleChanging(false);
    }
  };

  const isAllSelected = students.length > 0 && selectedIds.size === students.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < students.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Students"
        description="Search Nile University students, inspect card status, manage suspensions, and export records."
        actions={
          <Button
            variant="surface"
            size="sm"
            onClick={handleExportCsv}
            className="normal-case font-bold min-h-[44px] px-4 text-xs text-brand dark:text-brand-soft border-slate-300 dark:border-zinc-700"
          >
            <Download className="size-3.5 mr-1.5" />
            Export Students CSV
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Input
              id="studentSearch"
              type="search"
              placeholder="Search by name, email, or 9-digit ID…"
              leftIcon={<Search className="size-4 text-ash dark:text-zinc-400" />}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Status Filters & Date Picker Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <OverflowScroller className="max-w-full">
              <ToggleChip
                pressed={statusFilter === "all"}
                onPressedChange={() => {
                  setStatusFilter("all");
                  setIsLoading(true);
                }}
                size="sm"
                className="min-h-[40px]"
              >
                <span>All Statuses</span>
              </ToggleChip>
              <ToggleChip
                pressed={statusFilter === "active"}
                onPressedChange={() => {
                  setStatusFilter("active");
                  setIsLoading(true);
                }}
                size="sm"
                className="min-h-[40px]"
              >
                <span>Active</span>
              </ToggleChip>
              <ToggleChip
                pressed={statusFilter === "suspended"}
                onPressedChange={() => {
                  setStatusFilter("suspended");
                  setIsLoading(true);
                }}
                size="sm"
                className="min-h-[40px]"
              >
                <span>Suspended</span>
              </ToggleChip>
            </OverflowScroller>

            <Button
              variant={signedUpFrom || signedUpTo ? "primary" : "surface"}
              size="sm"
              onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
              className="min-h-[40px] px-3 text-xs normal-case font-bold"
            >
              <Calendar className="size-3.5 mr-1" />
              Sign-up Date
            </Button>
          </div>
        </div>

        {/* Optional Sign-up Date Range Filter Panel */}
        {isDateFilterOpen && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-border animate-in fade-in-0 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
              <div className="flex-1 min-w-[140px]">
                <DatePicker
                  id="registered-from"
                  label="Registered From"
                  value={signedUpFrom}
                  maxDate={signedUpTo || undefined}
                  onChange={(val) => {
                    setSignedUpFrom(val);
                    setIsLoading(true);
                  }}
                  placeholder="Select start date..."
                  clearable
                />
              </div>
              <span className="hidden sm:inline-block text-muted-foreground self-end pb-3 shrink-0 font-bold">
                &rarr;
              </span>
              <div className="flex-1 min-w-[140px]">
                <DatePicker
                  id="registered-to"
                  label="Registered To"
                  value={signedUpTo}
                  minDate={signedUpFrom || undefined}
                  onChange={(val) => {
                    setSignedUpTo(val);
                    setIsLoading(true);
                  }}
                  placeholder="Select end date..."
                  clearable
                />
              </div>
            </div>

            {(signedUpFrom || signedUpTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSignedUpFrom("");
                  setSignedUpTo("");
                  setIsLoading(true);
                }}
                className="self-stretch sm:self-end text-xs font-semibold normal-case min-h-[44px]"
              >
                Clear Dates
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Row Selection Floating Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#0F3056] text-white flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <CheckSquare className="size-5 text-sky-400 shrink-0" />
            <span className="text-xs font-bold font-mono">
              {selectedIds.size} {selectedIds.size === 1 ? "student" : "students"} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setBulkAction("suspend");
                setBulkReason("");
                setBulkError(null);
              }}
              className="min-h-[44px] px-3.5 text-xs normal-case font-bold"
            >
              <Ban className="size-3 mr-1" />
              Suspend Selected
            </Button>
            <Button
              variant="surface"
              size="sm"
              onClick={() => {
                setBulkAction("reactivate");
                setBulkReason("");
                setBulkError(null);
              }}
              className="min-h-[44px] px-3.5 text-xs normal-case font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            >
              <CheckCircle2 className="size-3 mr-1" />
              Reactivate Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="min-h-[44px] px-3 text-xs text-white/70 hover:text-white normal-case"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Students Data Display */}
      <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg sm:text-xl text-foreground">
              Student directory
            </CardTitle>
          </div>
          <Badge variant="brand" className="text-xs font-bold font-mono">
            {students.length} Loaded
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="p-8">
              <StatusState
                layout="panel"
                variant="destructive"
                icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
                title="Failed to load students"
                description={error}
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsLoading(true);
                      fetchStudents(searchQuery, statusFilter, signedUpFrom, signedUpTo)
                        .then((data) => {
                          setStudents(data.students);
                          setNextCursor(data.nextCursor);
                          setIsLoading(false);
                        })
                        .catch((err) => {
                          setError(err.message);
                          setIsLoading(false);
                        });
                    }}
                    className="normal-case font-bold min-h-[44px]"
                  >
                    <RotateCcw className="size-3.5 mr-1.5" />
                    Try again
                  </Button>
                }
              />
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-4" aria-busy="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-muted animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
                      <div className="h-3 w-48 bg-muted rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-muted rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<GraduationCap className="size-8" />}
                title={searchQuery ? "No matching students" : "No students found"}
                hint={
                  searchQuery
                    ? `No students matching "${searchQuery}". Try a different name, email, or university ID.`
                    : "No students registered for this filter selection."
                }
                action={
                  searchQuery ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearchChange("")}
                      className="normal-case font-bold min-h-[44px]"
                    >
                      Clear search
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 pl-4">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onCheckedChange={handleToggleSelectAll}
                          aria-label="Select all students"
                          size="sm"
                        />
                      </TableHead>
                      <TableHead className="min-w-48">Student</TableHead>
                      <TableHead className="w-28">University ID</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-28">Signed Up</TableHead>
                      <TableHead className="w-28">Last Scan</TableHead>
                      <TableHead className="min-w-36">Active Card</TableHead>
                      <TableHead className="text-right pr-6 min-w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const isSelected = selectedIds.has(student.profile.userId);
                      return (
                        <TableRow
                          key={student.profile.userId}
                          className={isSelected ? "bg-brand/5 dark:bg-brand/10" : undefined}
                        >
                          {/* Selection Checkbox */}
                          <TableCell className="pl-4 py-3.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelectOne(student.profile.userId)}
                              aria-label={`Select ${student.name}`}
                              size="sm"
                            />
                          </TableCell>

                          {/* Student Name & Email -> Link to Detail */}
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <UserAvatar name={student.name} size={36} shape="rounded" />
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/students/${student.profile.userId}`}
                                  className="font-bold text-xs text-foreground hover:text-brand dark:hover:text-brand-soft truncate block"
                                >
                                  {student.name}
                                </Link>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* University ID */}
                          <TableCell className="font-mono text-xs font-bold py-3.5 tabular-nums">
                            {student.profile.universityId}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell className="py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                student.profile.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                              )}
                            >
                              {student.profile.status}
                            </span>
                          </TableCell>

                          {/* Signed up date */}
                          <TableCell className="py-3.5 text-xs font-mono text-muted-foreground tabular-nums">
                            {formatCairoDateOnly(student.registeredAt || student.profile.registeredAt)}
                          </TableCell>

                          {/* Last redemption */}
                          <TableCell className="py-3.5 text-xs font-mono text-muted-foreground tabular-nums">
                            {student.lastRedemptionAt
                              ? formatCairoDateOnly(student.lastRedemptionAt)
                              : "—"}
                          </TableCell>

                          {/* Active Card */}
                          <TableCell className="py-3.5 text-xs font-mono">
                            {student.card ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-foreground">
                                  {student.card.serial}
                                </span>
                                <span className="block text-[10px] text-muted-foreground uppercase font-sans">
                                  {student.card.type}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs font-sans font-medium">
                                No card
                              </span>
                            )}
                          </TableCell>

                          {/* Grouped Actions */}
                          <TableCell className="text-right py-3.5 pr-6 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Primary: View detail page */}
                              <Link
                                href={`/admin/students/${student.profile.userId}`}
                                className="inline-flex items-center justify-center min-h-[44px] px-2.5 text-xs font-bold text-brand dark:text-brand-soft hover:bg-brand/10 rounded-xl transition-colors"
                              >
                                <Eye className="size-3.5 mr-1" />
                                View
                              </Link>

                              {/* Card Action: Link or Void */}
                              {student.card ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setVoidingStudent(student);
                                    setVoidReason("");
                                    setVoidError(null);
                                  }}
                                  className="min-h-[44px] px-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/10 normal-case"
                                >
                                  <Ban className="size-3.5 mr-1" />
                                  Void
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setLinkingStudent(student);
                                    setSerialInput("");
                                    setQrInput("");
                                    setLinkError(null);
                                  }}
                                  className="min-h-[44px] px-2.5 text-xs font-bold text-brand dark:text-brand-soft border-slate-200 dark:border-zinc-700 normal-case"
                                >
                                  <LinkIcon className="size-3.5 mr-1" />
                                  Link
                                </Button>
                              )}

                              {/* Flow Action */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFlowStudent(student);
                                  setFlowError(null);
                                }}
                                className="min-h-[44px] px-2 text-xs font-semibold normal-case text-muted-foreground hover:text-foreground"
                                title="Change Flow"
                              >
                                <ArrowRightLeft className="size-3.5 mr-1" />
                                Flow
                              </Button>

                              {/* Super Admin Staff Role Actions */}
                              {isSuperAdmin && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPromotingStudent(student);
                                      setRoleError(null);
                                    }}
                                    className="min-h-[44px] px-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 normal-case"
                                    title="Make admin"
                                  >
                                    <ShieldCheck className="size-3.5 mr-1" />
                                    Admin
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setRevokingStudent(student);
                                      setRoleError(null);
                                    }}
                                    className="min-h-[44px] px-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 normal-case"
                                    title="Remove admin"
                                  >
                                    <ShieldAlert className="size-3.5 mr-1" />
                                    Revoke
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View (< 1024px) */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-zinc-800 p-3 space-y-3">
                {students.map((student) => {
                  const isSelected = selectedIds.has(student.profile.userId);
                  return (
                    <div
                      key={student.profile.userId}
                      className={cn(
                        "p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 transition-colors",
                        isSelected ? "border-brand dark:border-brand-soft bg-brand/5" : ""
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelectOne(student.profile.userId)}
                            aria-label={`Select ${student.name}`}
                            size="sm"
                          />
                          <UserAvatar name={student.name} size={36} shape="rounded" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/students/${student.profile.userId}`}
                              className="font-bold text-xs text-foreground truncate block hover:underline"
                            >
                              {student.name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0",
                            student.profile.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                          )}
                        >
                          {student.profile.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-slate-100 dark:border-zinc-800">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            ID
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {student.profile.universityId}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            Card
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {student.card ? student.card.serial : "No card"}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Row Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Link
                          href={`/admin/students/${student.profile.userId}`}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-foreground hover:bg-slate-200"
                        >
                          <Eye className="size-3.5 mr-1" />
                          View Profile
                        </Link>

                        {student.card ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVoidingStudent(student);
                              setVoidReason("");
                              setVoidError(null);
                            }}
                            className="min-h-[44px] text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 normal-case px-3"
                          >
                            <Ban className="size-3.5 mr-1" />
                            Void
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLinkingStudent(student);
                              setSerialInput("");
                              setQrInput("");
                              setLinkError(null);
                            }}
                            className="min-h-[44px] text-xs font-bold normal-case text-brand dark:text-brand-soft px-3"
                          >
                            <LinkIcon className="size-3.5 mr-1" />
                            Link
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFlowStudent(student);
                            setFlowError(null);
                          }}
                          className="min-h-[44px] text-xs font-semibold normal-case text-muted-foreground px-3"
                        >
                          <ArrowRightLeft className="size-3.5 mr-1" />
                          Flow
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    loading={isLoadingMore}
                    loadingText="Loading more…"
                    className="font-bold normal-case text-xs min-h-[44px] px-6"
                  >
                    Load more students
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Modal (Suspend / Reactivate) */}
      <Modal
        isOpen={bulkAction !== null}
        onClose={() => {
          if (!isBulkExecuting) setBulkAction(null);
        }}
        title={bulkAction === "suspend" ? "Bulk Suspend Student Accounts" : "Bulk Reactivate Student Accounts"}
        icon={
          bulkAction === "suspend" ? (
            <Ban className="size-5 text-rose-600" />
          ) : (
            <CheckCircle2 className="size-5 text-emerald-600" />
          )
        }
        maxWidth="md"
        role="alertdialog"
      >
        <div className="space-y-4">
          <ModalBody className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs space-y-2">
              <p className="font-bold text-foreground">
                Target: <strong>{selectedIds.size}</strong> selected student account{selectedIds.size === 1 ? "" : "s"}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Consequence:</strong>{" "}
                {bulkAction === "suspend"
                  ? "Selected students will be immediately blocked from scanning their card at vendor locations. Their mobile passes will reflect suspension."
                  : "Selected students will immediately regain active card status and full discount privileges."}
              </p>
            </div>

            {bulkError && (
              <Alert variant="destructive" size="sm" description={bulkError} />
            )}

            {bulkAction === "suspend" && (
              <Input
                id="bulkReason"
                label="Suspension Reason (Required)"
                placeholder="e.g. Terms violation, graduation review, reported abuse"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                required
                autoFocus
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isBulkExecuting}
              onClick={() => setBulkAction(null)}
              className="normal-case font-semibold min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={bulkAction === "suspend" ? "destructive" : "primary"}
              disabled={isBulkExecuting || (bulkAction === "suspend" && !bulkReason.trim())}
              onClick={handleBulkSubmit}
              className="normal-case font-bold min-h-[44px]"
            >
              {isBulkExecuting ? "Processing…" : `Confirm & ${bulkAction === "suspend" ? "Suspend" : "Reactivate"} (${selectedIds.size})`}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* 1. Link Card Modal */}
      <Modal
        isOpen={linkingStudent !== null}
        onClose={() => {
          if (!isLinking) setLinkingStudent(null);
        }}
        title="Link Membership Card"
        icon={<LinkIcon className="size-5 text-brand" />}
        maxWidth="md"
      >
        <form onSubmit={handleLinkCard}>
          <ModalBody className="space-y-4">
            {linkingStudent && (
              <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 text-xs space-y-1.5">
                <p className="font-bold text-foreground">
                  Target Student: {linkingStudent.name}
                </p>
                <p className="text-muted-foreground font-mono text-[11px]">
                  ID: {linkingStudent.profile.universityId} &bull; {linkingStudent.email}
                </p>
                <p className="text-muted-foreground text-[11px] pt-1">
                  <strong>Consequence:</strong> Linking a physical card activates the card serial for this student. Any subsequent vendor scan will verify against their identity.
                </p>
              </div>
            )}

            {linkError && (
              <Alert variant="destructive" size="sm" description={linkError} />
            )}

            <div className="space-y-3">
              <div className="flex rounded-xl p-1 bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => setLinkInputMode("serial")}
                  className={`flex-1 min-h-[38px] text-xs font-bold rounded-lg transition-all ${
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
                  className={`flex-1 min-h-[38px] text-xs font-bold rounded-lg transition-all ${
                    linkInputMode === "qr"
                      ? "bg-white dark:bg-zinc-800 shadow-xs text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  By QR Code Text
                </button>
              </div>

              {linkInputMode === "serial" ? (
                <Input
                  id="linkSerial"
                  label="Card Serial Number"
                  placeholder="SU-000123 or 123"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  helperText="Enter the serial printed on the physical card"
                  required
                  autoFocus
                />
              ) : (
                <Textarea
                  id="linkQr"
                  label="QR Code Payload"
                  placeholder="NUSU1:... or URL"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  helperText="Paste the full QR code payload"
                  rows={3}
                  required
                  autoFocus
                />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isLinking}
              onClick={() => setLinkingStudent(null)}
              className="normal-case font-semibold min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLinking}
              loadingText="Linking…"
              className="normal-case font-bold min-h-[44px]"
            >
              Link Card
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* 2. Void Card Modal */}
      <Modal
        isOpen={voidingStudent !== null}
        onClose={() => {
          if (!isVoiding) setVoidingStudent(null);
        }}
        title="Void Membership Card"
        icon={<Ban className="size-5 text-rose-600" />}
        maxWidth="md"
        role="alertdialog"
      >
        <form onSubmit={handleVoidCard}>
          <ModalBody className="space-y-4">
            {voidingStudent?.card && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
                <p className="font-bold text-rose-700 dark:text-rose-300">
                  Target Card: {voidingStudent.card.serial} ({voidingStudent.card.type})
                </p>
                <p className="text-muted-foreground">
                  Assigned Holder: {voidingStudent.name} (ID {voidingStudent.profile.universityId})
                </p>
                <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1">
                  <strong>Consequence:</strong> This card serial will be permanently invalidated in the system. The student will have no active card until a replacement is linked.
                </p>
              </div>
            )}

            {voidError && (
              <Alert variant="destructive" size="sm" description={voidError} />
            )}

            <Input
              id="voidReason"
              label="Void Reason"
              placeholder="e.g. Card reported lost by student, replaced, damaged"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              helperText="Recorded in the permanent audit trail"
              required
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isVoiding}
              onClick={() => setVoidingStudent(null)}
              className="normal-case font-semibold min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              loading={isVoiding}
              loadingText="Voiding…"
              disabled={!voidReason.trim()}
              className="normal-case font-bold min-h-[44px]"
            >
              Confirm & Void Card
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* 3. Change Flow Modal */}
      <Modal
        isOpen={flowStudent !== null}
        onClose={() => {
          if (!isChangingFlow) setFlowStudent(null);
        }}
        title="Change Student Issuance Flow"
        icon={<ArrowRightLeft className="size-5 text-brand" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-4">
          {flowStudent && (
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs space-y-2">
              <p className="font-bold text-foreground">
                Target: {flowStudent.name} ({flowStudent.email})
              </p>
              <p className="text-muted-foreground">
                Current Flow: <strong className="uppercase font-mono">{flowStudent.profile.cardFlow}</strong>
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                <strong>Consequence:</strong>{" "}
                {flowStudent.profile.cardFlow === "physical"
                  ? "Switching to Digital will immediately issue a digital web pass for this student to access discounts."
                  : "Switching to Physical will mark the student as awaiting physical card collection at the SU desk."}
              </p>
            </div>
          )}

          {flowError && (
            <Alert variant="destructive" size="sm" description={flowError} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isChangingFlow}
            onClick={() => setFlowStudent(null)}
            className="normal-case font-semibold min-h-[44px]"
          >
            Cancel
          </Button>
          {flowStudent?.profile.cardFlow === "physical" ? (
            <Button
              type="button"
              variant="primary"
              loading={isChangingFlow}
              loadingText="Updating…"
              onClick={() => handleChangeFlow("digital")}
              className="normal-case font-bold min-h-[44px]"
            >
              Switch to Digital
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              loading={isChangingFlow}
              loadingText="Updating…"
              onClick={() => handleChangeFlow("physical")}
              className="normal-case font-bold min-h-[44px]"
            >
              Switch to Physical
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* 4. Promote Admin Modal */}
      <Modal
        isOpen={promotingStudent !== null}
        onClose={() => {
          if (!isRoleChanging) setPromotingStudent(null);
        }}
        title="Promote Student to SU Admin"
        icon={<ShieldCheck className="size-5 text-brand" />}
        maxWidth="md"
        role="alertdialog"
      >
        <ModalBody className="space-y-3">
          {promotingStudent && (
            <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 text-xs space-y-1.5">
              <p className="font-bold text-foreground">
                Target User: {promotingStudent.name}
              </p>
              <p className="text-muted-foreground font-mono text-[11px]">
                {promotingStudent.email}
              </p>
              <p className="text-muted-foreground text-[11px] pt-1">
                <strong>Consequence:</strong> This student will be granted full staff administrative access to the SU Card management console, including card issuance, vendor management, and audit logs.
              </p>
            </div>
          )}

          {roleError && (
            <Alert variant="destructive" size="sm" description={roleError} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isRoleChanging}
            onClick={() => setPromotingStudent(null)}
            className="normal-case font-semibold min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={isRoleChanging}
            loadingText="Promoting…"
            onClick={handlePromoteAdmin}
            className="normal-case font-bold min-h-[44px]"
          >
            Confirm Promotion
          </Button>
        </ModalFooter>
      </Modal>

      {/* 5. Revoke Admin Modal */}
      <Modal
        isOpen={revokingStudent !== null}
        onClose={() => {
          if (!isRoleChanging) setRevokingStudent(null);
        }}
        title="Revoke SU Admin Privileges"
        icon={<ShieldAlert className="size-5 text-amber-600" />}
        maxWidth="md"
        role="alertdialog"
      >
        <ModalBody className="space-y-3">
          {revokingStudent && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <p className="font-bold text-foreground">
                Target User: {revokingStudent.name}
              </p>
              <p className="text-muted-foreground font-mono text-[11px]">
                {revokingStudent.email}
              </p>
              <p className="text-muted-foreground text-[11px] pt-1">
                <strong>Consequence:</strong> Administrative console access will be revoked immediately. The user will retain their standard student membership and card access.
              </p>
            </div>
          )}

          {roleError && (
            <Alert variant="destructive" size="sm" description={roleError} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isRoleChanging}
            onClick={() => setRevokingStudent(null)}
            className="normal-case font-semibold min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isRoleChanging}
            loadingText="Revoking…"
            onClick={handleRevokeAdmin}
            className="normal-case font-bold min-h-[44px]"
          >
            Confirm Role Removal
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
