"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  GraduationCap,
  Link as LinkIcon,
  Ban,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ArrowRightLeft,
  X,
} from "lucide-react";
import type { StudentSearchItem, StudentSearchResponse, CardFlow } from "@/lib/student/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

interface StudentsManagerProps {
  role: string;
}

export function StudentsManager({ role }: StudentsManagerProps) {
  const isSuperAdmin = role === "super_admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentSearchItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link card modal state
  const [linkingStudent, setLinkingStudent] = useState<StudentSearchItem | null>(null);
  const [linkInputMode, setLinkInputMode] = useState<"serial" | "qr">("serial");
  const [serialInput, setSerialInput] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Void card modal state
  const [voidingStudent, setVoidingStudent] = useState<StudentSearchItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  // Change flow state
  const [flowStudent, setFlowStudent] = useState<StudentSearchItem | null>(null);
  const [isChangingFlow, setIsChangingFlow] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  // Promote / Revoke staff role state
  const [promotingStudent, setPromotingStudent] = useState<StudentSearchItem | null>(null);
  const [revokingStudent, setRevokingStudent] = useState<StudentSearchItem | null>(null);
  const [isRoleChanging, setIsRoleChanging] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (q: string, cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
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
  }, []);

  // Initial load and search query effect
  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      fetchStudents(searchQuery)
        .then((data) => {
          if (active) {
            setStudents(data.students);
            setNextCursor(data.nextCursor);
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
  }, [searchQuery, fetchStudents]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsLoading(true);
    setError(null);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchStudents(searchQuery, nextCursor);
      setStudents((prev) => [...prev, ...data.students]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingStudent) return;
    setIsLinking(true);
    setLinkError(null);

    const payload =
      linkInputMode === "serial"
        ? { serial: serialInput.trim() }
        : { qr: qrInput.trim() };

    try {
      const res = await fetch(`/api/admin/students/${linkingStudent.profile.userId}/link-card`, {
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

      // Update student in local state
      setStudents((prev) =>
        prev.map((s) =>
          s.profile.userId === linkingStudent.profile.userId
            ? { ...s, card: resData.card }
            : s
        )
      );

      setLinkingStudent(null);
      setSerialInput("");
      setQrInput("");
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleVoidCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingStudent || !voidingStudent.card) return;
    setIsVoiding(true);
    setVoidError(null);

    try {
      const res = await fetch(`/api/admin/cards/${voidingStudent.card.id}/void`, {
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

      // Update student in local state
      setStudents((prev) =>
        prev.map((s) =>
          s.profile.userId === voidingStudent.profile.userId
            ? { ...s, card: null }
            : s
        )
      );

      setVoidingStudent(null);
      setVoidReason("");
    } catch {
      setVoidError("Network error. Please try again.");
    } finally {
      setIsVoiding(false);
    }
  };

  const handleChangeFlow = async (targetFlow: CardFlow) => {
    if (!flowStudent) return;
    setIsChangingFlow(true);
    setFlowError(null);

    try {
      const res = await fetch(`/api/admin/students/${flowStudent.profile.userId}`, {
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
          s.profile.userId === flowStudent.profile.userId
            ? { ...s, profile: { ...s.profile, cardFlow: targetFlow } }
            : s
        )
      );

      setFlowStudent(null);
    } catch {
      setFlowError("Network error. Please try again.");
    } finally {
      setIsChangingFlow(false);
    }
  };

  const handlePromoteAdmin = async () => {
    if (!promotingStudent) return;
    setIsRoleChanging(true);
    setRoleError(null);

    try {
      const res = await fetch("/api/admin/staff/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: promotingStudent.email }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRoleError(resData.error || "Failed to promote student");
        setIsRoleChanging(false);
        return;
      }

      setPromotingStudent(null);
    } catch {
      setRoleError("Network error. Please try again.");
    } finally {
      setIsRoleChanging(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!revokingStudent) return;
    setIsRoleChanging(true);
    setRoleError(null);

    try {
      const res = await fetch(`/api/admin/staff/${revokingStudent.profile.userId}/revoke`, {
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
    } catch {
      setRoleError("Network error. Please try again.");
    } finally {
      setIsRoleChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white">
            STUDENTS
          </h1>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-1">
            Search registered Nile University students, manage membership cards, and update card flows.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Input
          id="studentSearch"
          type="text"
          placeholder="Search by name, email, or 9-digit ID…"
          leftIcon={<Search className="size-4 text-ash dark:text-zinc-400" />}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ash dark:text-zinc-400 hover:text-foreground cursor-pointer"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Students Data Display */}
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">
            Student Directory
          </CardTitle>
          <Badge variant="brand" className="text-xs font-bold">
            {students.length} {students.length === 1 ? "Student" : "Students"}
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
                      fetchStudents(searchQuery)
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
                    className="normal-case font-bold"
                  >
                    <RotateCcw className="size-3.5 mr-1.5" />
                    Try again
                  </Button>
                }
              />
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
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
              <StatusState
                layout="panel"
                icon={<GraduationCap className="size-8 text-muted-foreground" />}
                title={searchQuery ? "No matching students" : "No students found"}
                description={
                  searchQuery
                    ? `No students matching "${searchQuery}". Try a different name, email, or ID.`
                    : "No students have registered their cards yet."
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
                      <TableHead className="min-w-48">Student</TableHead>
                      <TableHead className="w-32">University ID</TableHead>
                      <TableHead className="w-28">Flow</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead className="min-w-40">Active Card</TableHead>
                      <TableHead className="text-right pr-6 min-w-44">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.profile.userId}>
                        {/* Student Name & Email */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar name={student.name} size={36} shape="rounded" />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">
                                {student.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {student.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* University ID */}
                        <TableCell className="font-mono text-xs font-bold py-3.5">
                          {student.profile.universityId}
                        </TableCell>

                        {/* Flow Badge */}
                        <TableCell className="py-3.5">
                          <Badge
                            variant={student.profile.cardFlow === "digital" ? "brand" : "secondary"}
                            className="text-[10px] uppercase font-bold"
                          >
                            {student.profile.cardFlow}
                          </Badge>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="py-3.5">
                          <span
                            className={
                              student.profile.status === "active"
                                ? "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                : "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                            }
                          >
                            {student.profile.status}
                          </span>
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

                        {/* Actions */}
                        <TableCell className="text-right py-3.5 pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Change Flow */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFlowStudent(student)}
                              className="h-8 px-2 text-xs font-semibold normal-case text-muted-foreground hover:text-foreground"
                              title="Change Flow"
                            >
                              <ArrowRightLeft className="size-3.5 mr-1" />
                              Flow
                            </Button>

                            {/* Link Card */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLinkingStudent(student);
                                setSerialInput("");
                                setQrInput("");
                                setLinkError(null);
                              }}
                              className="h-8 px-2.5 text-xs font-bold text-brand dark:text-brand-soft border-slate-200 dark:border-zinc-700 normal-case"
                            >
                              <LinkIcon className="size-3.5 mr-1" />
                              Link
                            </Button>

                            {/* Void Card (if active card) */}
                            {student.card && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setVoidingStudent(student);
                                  setVoidReason("");
                                  setVoidError(null);
                                }}
                                className="h-8 px-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-500/10 normal-case"
                              >
                                <Ban className="size-3.5 mr-1" />
                                Void
                              </Button>
                            )}

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
                                  className="h-8 px-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 normal-case"
                                  title="Make admin"
                                >
                                  <ShieldCheck className="size-3.5 mr-1" />
                                  Make Admin
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRevokingStudent(student);
                                    setRoleError(null);
                                  }}
                                  className="h-8 px-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 normal-case"
                                  title="Remove admin"
                                >
                                  <ShieldAlert className="size-3.5 mr-1" />
                                  Remove Admin
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View (< 1024px) */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-zinc-800 p-3 space-y-3">
                {students.map((student) => (
                  <div
                    key={student.profile.userId}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={student.name} size={36} shape="rounded" />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={student.profile.cardFlow === "digital" ? "brand" : "secondary"}
                        className="text-[10px] uppercase font-bold shrink-0"
                      >
                        {student.profile.cardFlow}
                      </Badge>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLinkingStudent(student);
                          setSerialInput("");
                          setQrInput("");
                          setLinkError(null);
                        }}
                        className="flex-1 min-h-[40px] text-xs font-bold normal-case text-brand dark:text-brand-soft"
                      >
                        <LinkIcon className="size-3.5 mr-1" />
                        Link Card
                      </Button>

                      {student.card && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVoidingStudent(student);
                            setVoidReason("");
                            setVoidError(null);
                          }}
                          className="min-h-[40px] text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 normal-case"
                        >
                          <Ban className="size-3.5 mr-1" />
                          Void
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFlowStudent(student)}
                        className="min-h-[40px] text-xs font-semibold normal-case text-muted-foreground"
                      >
                        <ArrowRightLeft className="size-3.5 mr-1" />
                        Flow
                      </Button>

                      {isSuperAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPromotingStudent(student);
                              setRoleError(null);
                            }}
                            className="min-h-[40px] text-xs font-semibold text-sky-600 dark:text-sky-400 normal-case"
                          >
                            <ShieldCheck className="size-3.5 mr-1" />
                            Make Admin
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRevokingStudent(student);
                              setRoleError(null);
                            }}
                            className="min-h-[40px] text-xs font-semibold text-amber-600 dark:text-amber-400 normal-case"
                          >
                            <ShieldAlert className="size-3.5 mr-1" />
                            Remove Admin
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="font-bold normal-case text-xs min-h-[40px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Loading more…
                      </>
                    ) : (
                      "Load more students"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 1. Link Card Modal */}
      <Modal
        isOpen={linkingStudent !== null}
        onClose={() => {
          if (!isLinking) setLinkingStudent(null);
        }}
        title="Link Membership Card"
        icon={<LinkIcon className="size-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleLinkCard}>
          <ModalBody className="space-y-4">
            {linkingStudent && (
              <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
                <p className="font-bold text-foreground">{linkingStudent.name}</p>
                <p className="text-muted-foreground font-mono">
                  ID: {linkingStudent.profile.universityId} &bull; {linkingStudent.email}
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
                  helperText="Enter the serial printed on the card"
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
              {isLinking ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Linking…
                </>
              ) : (
                "Link Card"
              )}
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
      >
        <form onSubmit={handleVoidCard}>
          <ModalBody className="space-y-4">
            {voidingStudent?.card && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                <p className="font-bold text-rose-700 dark:text-rose-300">
                  Card: {voidingStudent.card.serial} ({voidingStudent.card.type})
                </p>
                <p className="text-muted-foreground">
                  Linked to: {voidingStudent.name} (ID {voidingStudent.profile.universityId})
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
              {isVoiding ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Voiding…
                </>
              ) : (
                "Confirm & Void Card"
              )}
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
        icon={<ArrowRightLeft className="size-5" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-4">
          {flowStudent && (
            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
              <p className="font-bold text-foreground">{flowStudent.name}</p>
              <p className="text-muted-foreground">
                Current Flow: <strong className="uppercase">{flowStudent.profile.cardFlow}</strong>
              </p>
            </div>
          )}

          {flowError && (
            <Alert variant="destructive" size="sm" description={flowError} />
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Select the new flow for this student. Switching to digital will allow them to access the digital card web pass immediately.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isChangingFlow}
            onClick={() => setFlowStudent(null)}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          {flowStudent?.profile.cardFlow === "physical" ? (
            <Button
              type="button"
              variant="primary"
              disabled={isChangingFlow}
              onClick={() => handleChangeFlow("digital")}
              className="normal-case font-bold"
            >
              {isChangingFlow ? "Updating…" : "Switch to Digital"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={isChangingFlow}
              onClick={() => handleChangeFlow("physical")}
              className="normal-case font-bold"
            >
              {isChangingFlow ? "Updating…" : "Switch to Physical"}
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
        title="Promote to SU Admin"
        icon={<ShieldCheck className="size-5 text-brand" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-3">
          {promotingStudent && (
            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
              <p className="font-bold text-foreground">{promotingStudent.name}</p>
              <p className="text-muted-foreground">{promotingStudent.email}</p>
            </div>
          )}

          {roleError && (
            <Alert variant="destructive" size="sm" description={roleError} />
          )}

          <p className="text-xs text-muted-foreground">
            This will grant this student staff access to the SU Card Admin console.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isRoleChanging}
            onClick={() => setPromotingStudent(null)}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isRoleChanging}
            onClick={handlePromoteAdmin}
            className="normal-case font-bold"
          >
            {isRoleChanging ? "Promoting…" : "Promote to Admin"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* 5. Revoke Admin Modal */}
      <Modal
        isOpen={revokingStudent !== null}
        onClose={() => {
          if (!isRoleChanging) setRevokingStudent(null);
        }}
        title="Remove SU Admin Role"
        icon={<ShieldAlert className="size-5 text-amber-600" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-3">
          {revokingStudent && (
            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs space-y-1">
              <p className="font-bold text-foreground">{revokingStudent.name}</p>
              <p className="text-muted-foreground">{revokingStudent.email}</p>
            </div>
          )}

          {roleError && (
            <Alert variant="destructive" size="sm" description={roleError} />
          )}

          <p className="text-xs text-muted-foreground">
            This will revoke admin console access for this student. They will retain their student membership.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isRoleChanging}
            onClick={() => setRevokingStudent(null)}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isRoleChanging}
            onClick={handleRevokeAdmin}
            className="normal-case font-bold"
          >
            {isRoleChanging ? "Revoking…" : "Remove Admin Role"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
