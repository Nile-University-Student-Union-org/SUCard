"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  CreditCard,
  Building2,
  Mail,
  AlertTriangle,
  RotateCcw,
  Users,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
  Smartphone,
  Gauge,
  Clock,
  Calendar,
  Copy,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { OfficeSchedule, Settings, SettingsResponse } from "@/lib/student/types";
import { weekSummary } from "@/lib/settings/office-hours";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DatePicker, formatDisplayDate, getCairoTodayString } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { StatusState } from "@/components/ui/status-state";
import { StickySaveBar } from "@/components/ui/sticky-save-bar";
import { ReviewChangesModal } from "@/components/ui/review-changes-modal";
import {
  computeSettingsDiff,
  type SettingsFormState,
  type WeeklyScheduleState,
} from "@/lib/settings/diff";
import { cn } from "@/lib/utils";
import { MailSenderCard } from "./mail-sender-card";

const DAYS = [
  { day: 0, name: "Sunday", short: "Sun", isWeekday: true },
  { day: 1, name: "Monday", short: "Mon", isWeekday: true },
  { day: 2, name: "Tuesday", short: "Tue", isWeekday: true },
  { day: 3, name: "Wednesday", short: "Wed", isWeekday: true },
  { day: 4, name: "Thursday", short: "Thu", isWeekday: true },
  { day: 5, name: "Friday", short: "Fri", isWeekday: false },
  { day: 6, name: "Saturday", short: "Sat", isWeekday: false },
];

const defaultWeeklyState: WeeklyScheduleState = {
  0: { isOpen: true, open: "09:00", close: "17:00" },
  1: { isOpen: true, open: "09:00", close: "17:00" },
  2: { isOpen: true, open: "09:00", close: "17:00" },
  3: { isOpen: true, open: "09:00", close: "17:00" },
  4: { isOpen: true, open: "09:00", close: "17:00" },
  5: { isOpen: false, open: "09:00", close: "17:00" },
  6: { isOpen: false, open: "09:00", close: "17:00" },
};

interface SettingsManagerProps {
  role: string;
}

export function SettingsManager({ role }: SettingsManagerProps) {
  const isSuperAdmin = role === "super_admin";

  const [data, setData] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Saved snapshot for diff & dirty tracking
  const [savedSnapshot, setSavedSnapshot] = useState<SettingsFormState | null>(null);

  // Form state
  const [mode, setMode] = useState<"digital" | "physical">("digital");
  const [hasQuota, setHasQuota] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<string>("");
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const quotaInputRef = useRef<HTMLInputElement>(null);
  const [allowDigitalUpgrade, setAllowDigitalUpgrade] = useState(true);
  const [officeLocation, setOfficeLocation] = useState("");
  const [weekly, setWeekly] = useState<WeeklyScheduleState>(defaultWeeklyState);
  const [exceptions, setExceptions] = useState<OfficeSchedule["exceptions"]>([]);
  const [studentEmailPattern, setStudentEmailPattern] = useState("");

  // Exception form state
  const [newExDate, setNewExDate] = useState("");
  const [newExClosed, setNewExClosed] = useState(true);
  const [newExOpen, setNewExOpen] = useState("09:00");
  const [newExClose, setNewExClose] = useState("17:00");
  const [newExNote, setNewExNote] = useState("");
  const [newExError, setNewExError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Review changes modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Bulk switch dialog state
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load settings (HTTP ${res.status})`);
        }

        const resData = (await res.json()) as SettingsResponse;
        if (!ignore) {
          setData(resData);
          setMode(resData.settings.issuance.mode);
          const quota = resData.settings.issuance.physicalQuotaRemaining;
          setHasQuota(quota !== null);
          setQuotaRemaining(quota !== null ? String(quota) : "");
          setAllowDigitalUpgrade(resData.settings.allowDigitalUpgrade);
          setOfficeLocation(resData.settings.office.location);

          const rawWeekly = resData.settings.office.schedule?.weekly ?? [];
          const parsedWeekly: WeeklyScheduleState = { ...defaultWeeklyState };
          for (let d = 0; d <= 6; d++) {
            const match = rawWeekly.find((w) => w.day === d);
            if (match) {
              parsedWeekly[d] = { isOpen: true, open: match.open, close: match.close };
            } else {
              parsedWeekly[d] = { isOpen: false, open: "09:00", close: "17:00" };
            }
          }
          setWeekly(parsedWeekly);
          setExceptions(resData.settings.office.schedule?.exceptions ?? []);

          setStudentEmailPattern(resData.settings.studentEmailPattern);

          // Store initial snapshot for diffing
          setSavedSnapshot({
            mode: resData.settings.issuance.mode,
            hasQuota: quota !== null,
            quotaRemaining: quota !== null ? String(quota) : "",
            allowDigitalUpgrade: resData.settings.allowDigitalUpgrade,
            officeLocation: resData.settings.office.location,
            weekly: parsedWeekly,
            exceptions: resData.settings.office.schedule?.exceptions ?? [],
            studentEmailPattern: resData.settings.studentEmailPattern,
          });

          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load settings");
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const getDayValidationError = useCallback(
    (day: number): string | null => {
      const item = weekly[day];
      if (!item || !item.isOpen) return null;
      if (!item.open || !item.close) return "Opening and closing times are required.";
      if (item.open >= item.close) return "Closing time must be after opening time.";
      return null;
    },
    [weekly]
  );

  const liveSchedule: OfficeSchedule = {
    weekly: Object.entries(weekly)
      .filter(([, config]) => config.isOpen && config.open && config.close && config.open < config.close)
      .map(([dayStr, config]) => ({
        day: Number(dayStr),
        open: config.open,
        close: config.close,
      })),
    exceptions,
  };
  const currentWeekSummary = weekSummary(liveSchedule);

  const handleCopyToWeekdays = (sourceDay: number) => {
    const source = weekly[sourceDay];
    setWeekly((prev) => {
      const next = { ...prev };
      for (const d of [0, 1, 2, 3, 4]) {
        next[d] = {
          isOpen: source.isOpen,
          open: source.open,
          close: source.close,
        };
      }
      return next;
    });
    toast.success(`Copied ${DAYS[sourceDay].name}'s schedule to all weekdays (Sun–Thu)`);
  };

  const handleAddException = () => {
    setNewExError(null);
    if (!newExDate) {
      setNewExError("Please pick a date for the override.");
      return;
    }
    if (exceptions.some((ex) => ex.date === newExDate)) {
      setNewExError("An override for this date is already configured.");
      return;
    }
    if (!newExClosed) {
      if (!newExOpen || !newExClose) {
        setNewExError("Both opening and closing times are required.");
        return;
      }
      if (newExOpen >= newExClose) {
        setNewExError("Closing time must be after opening time.");
        return;
      }
    }

    const newEntry: OfficeSchedule["exceptions"][number] = {
      date: newExDate,
      closed: newExClosed,
      open: newExClosed ? undefined : newExOpen,
      close: newExClosed ? undefined : newExClose,
      note: newExNote.trim() ? newExNote.trim().slice(0, 120) : undefined,
    };

    setExceptions((prev) => [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
    setNewExDate("");
    setNewExClosed(true);
    setNewExOpen("09:00");
    setNewExClose("17:00");
    setNewExNote("");
    setNewExError(null);
    toast.success("Date override added");
  };

  const handleRemoveException = (dateToRemove: string) => {
    setExceptions((prev) => prev.filter((ex) => ex.date !== dateToRemove));
    toast.success("Date override removed");
  };

  const currentFormState: SettingsFormState = useMemo(
    () => ({
      mode,
      hasQuota,
      quotaRemaining,
      allowDigitalUpgrade,
      officeLocation,
      weekly,
      exceptions,
      studentEmailPattern,
    }),
    [
      mode,
      hasQuota,
      quotaRemaining,
      allowDigitalUpgrade,
      officeLocation,
      weekly,
      exceptions,
      studentEmailPattern,
    ]
  );

  const changes = useMemo(() => {
    if (!savedSnapshot) return [];
    return computeSettingsDiff(savedSnapshot, currentFormState, isSuperAdmin);
  }, [savedSnapshot, currentFormState, isSuperAdmin]);

  const isDirty = changes.length > 0;
  const changeCount = useMemo(() => {
    return changes.reduce((acc, c) => acc + (c.listChanges?.length ?? 1), 0);
  }, [changes]);

  const handleDiscard = useCallback(() => {
    if (!savedSnapshot) return;
    setMode(savedSnapshot.mode);
    setHasQuota(savedSnapshot.hasQuota);
    setQuotaRemaining(savedSnapshot.quotaRemaining);
    setAllowDigitalUpgrade(savedSnapshot.allowDigitalUpgrade);
    setOfficeLocation(savedSnapshot.officeLocation);
    setWeekly(savedSnapshot.weekly);
    setExceptions(savedSnapshot.exceptions);
    setStudentEmailPattern(savedSnapshot.studentEmailPattern);
    setQuotaError(null);
    setSaveError(null);
    setNewExError(null);
    toast.success("Unsaved changes discarded");
  }, [savedSnapshot]);

  const validateFormBeforeReview = useCallback((): boolean => {
    setSaveError(null);
    setQuotaError(null);

    const parsedQuota = mode === "physical" && hasQuota ? Number(quotaRemaining) : null;
    if (
      parsedQuota !== null &&
      (!/^(0|[1-9]\d*)$/.test(quotaRemaining) || !Number.isSafeInteger(parsedQuota))
    ) {
      setQuotaError("Enter a whole, nonnegative number of physical sign-ups.");
      requestAnimationFrame(() => quotaInputRef.current?.focus());
      return false;
    }

    if (!officeLocation.trim()) {
      setSaveError("Pickup location is required.");
      return false;
    }

    for (let d = 0; d <= 6; d++) {
      const err = getDayValidationError(d);
      if (err) {
        setSaveError(`${DAYS[d].name}: ${err}`);
        return false;
      }
    }

    return true;
  }, [mode, hasQuota, quotaRemaining, officeLocation, getDayValidationError]);

  const handleOpenReview = useCallback(() => {
    if (!validateFormBeforeReview()) return;
    if (!isDirty) {
      toast.info("No unsaved changes to review.");
      return;
    }
    setIsReviewModalOpen(true);
  }, [validateFormBeforeReview, isDirty]);

  // Keyboard shortcut: Ctrl+S / Cmd+S opens review modal when dirty
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty) {
          handleOpenReview();
        } else {
          toast.info("No unsaved changes to save.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, handleOpenReview]);

  const executeSave = async () => {
    if (!validateFormBeforeReview()) {
      setIsReviewModalOpen(false);
      return;
    }

    const parsedQuota = mode === "physical" && hasQuota ? Number(quotaRemaining) : null;
    setIsSaving(true);
    setSaveError(null);

    const weeklyPayload: OfficeSchedule["weekly"] = [];
    for (let d = 0; d <= 6; d++) {
      const cfg = weekly[d];
      if (cfg.isOpen) {
        weeklyPayload.push({
          day: d,
          open: cfg.open,
          close: cfg.close,
        });
      }
    }

    const patch: Partial<Settings> = {
      issuance: {
        mode,
        physicalQuotaRemaining: parsedQuota,
      },
      allowDigitalUpgrade,
      office: {
        location: officeLocation.trim(),
        schedule: {
          weekly: weeklyPayload,
          exceptions: exceptions.slice().sort((a, b) => a.date.localeCompare(b.date)),
        },
      },
    };

    if (isSuperAdmin) {
      patch.studentEmailPattern = studentEmailPattern.trim();
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(patch),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSaveError(resData.error || "Failed to update settings.");
        setIsSaving(false);
        return;
      }

      const updatedData = resData as SettingsResponse;
      setData(updatedData);

      const rawWeekly = updatedData.settings.office.schedule?.weekly ?? [];
      const parsedWeekly: WeeklyScheduleState = { ...defaultWeeklyState };
      for (let d = 0; d <= 6; d++) {
        const match = rawWeekly.find((w) => w.day === d);
        if (match) {
          parsedWeekly[d] = { isOpen: true, open: match.open, close: match.close };
        } else {
          parsedWeekly[d] = { isOpen: false, open: "09:00", close: "17:00" };
        }
      }
      const quota = updatedData.settings.issuance.physicalQuotaRemaining;

      setSavedSnapshot({
        mode: updatedData.settings.issuance.mode,
        hasQuota: quota !== null,
        quotaRemaining: quota !== null ? String(quota) : "",
        allowDigitalUpgrade: updatedData.settings.allowDigitalUpgrade,
        officeLocation: updatedData.settings.office.location,
        weekly: parsedWeekly,
        exceptions: updatedData.settings.office.schedule?.exceptions ?? [],
        studentEmailPattern: updatedData.settings.studentEmailPattern,
      });

      setIsReviewModalOpen(false);
      toast.success("Settings updated successfully");
    } catch {
      setSaveError("Network error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSwitchToDigital = async () => {
    setIsSwitching(true);
    setSwitchFeedback(null);

    try {
      const res = await fetch("/api/admin/students/switch-pending-to-digital", {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSwitchFeedback(resData.error || "Failed to switch pending students to digital.");
        setIsSwitching(false);
        return;
      }

      setIsSwitchModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
      toast.success(
        `Switched ${data?.stats.pendingPhysicalStudents ?? 0} pending students to digital issuance`
      );
    } catch {
      setSwitchFeedback("Network error. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-4xl" aria-busy="true">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl">
        <StatusState
          layout="panel"
          variant="destructive"
          icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
          title="Failed to load settings"
          description={error || "An unexpected error occurred."}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRefreshTrigger((prev) => prev + 1);
              }}
              className="normal-case min-h-[44px]"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const currentSavedMode = data.settings.issuance.mode;
  const currentSavedQuota = data.settings.issuance.physicalQuotaRemaining;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <PageHeader
        title="SETTINGS"
        description="Manage card issuance rules, physical quota, office collection details, and access patterns."
      />
      {isSuperAdmin && <MailSenderCard />}

      {/* Primary Status Hierarchy: Mode, Quota, Stock, and Queue */}
      <section aria-label="Issuance Status & Overview" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Mode Tile */}
          <StatTile
            label="Active Issuance Mode"
            value={currentSavedMode === "digital" ? "Instant Digital" : "Physical Pickup"}
            subText={
              currentSavedMode === "digital"
                ? "New signups get web cards immediately"
                : "New signups await office card collection"
            }
            icon={<Smartphone className="size-5" />}
            accent={currentSavedMode === "digital" ? "brand" : "blue"}
          />

          {/* Physical Quota Tile */}
          <StatTile
            label="Physical Quota"
            value={currentSavedQuota !== null ? `${currentSavedQuota} Left` : "Unlimited"}
            subText={
              currentSavedQuota !== null
                ? "Auto-switches to digital when 0"
                : "No registration limit enforced"
            }
            icon={<Gauge className="size-5" />}
            accent="blue"
          />

          {/* Unassigned Cards in Stock */}
          <StatTile
            label="Cards in Stock"
            value={data.stats.unassignedCardsInStock}
            subText="Unassigned physical cards ready"
            icon={<Layers className="size-5" />}
            accent="blue"
          />

          {/* Pending Physical Queue */}
          <StatTile
            label="Pending Students"
            value={data.stats.pendingPhysicalStudents}
            subText={
              data.stats.pendingPhysicalStudents > 0
                ? "Awaiting physical card link"
                : "Queue is empty"
            }
            icon={<Users className="size-5" />}
            accent={data.stats.warning ? "rose" : "brand"}
          />
        </div>

        {/* Single Bulk Switch Entry Point / Stock Warning */}
        {data.stats.pendingPhysicalStudents > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                {data.stats.warning ? (
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <ArrowRightLeft className="size-4 text-brand dark:text-brand-soft shrink-0" />
                )}
                <h3 className="text-sm font-bold text-foreground">
                  {data.stats.warning ? "Physical Card Stock Shortage" : "Pending Physical Students Queue"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.stats.warning
                  ? `There are ${data.stats.pendingPhysicalStudents} pending physical students, but only ${data.stats.unassignedCardsInStock} unassigned cards in stock.`
                  : `${data.stats.pendingPhysicalStudents} student${data.stats.pendingPhysicalStudents === 1 ? "" : "s"} currently waiting for physical card pickup.`}
              </p>
            </div>

            <Button
              type="button"
              variant={data.stats.warning ? "primary" : "outline"}
              size="sm"
              onClick={() => setIsSwitchModalOpen(true)}
              className="shrink-0 font-bold normal-case text-xs min-h-[44px] px-4"
            >
              <ArrowRightLeft className="size-3.5 mr-1.5" />
              Switch {data.stats.pendingPhysicalStudents} to Digital
            </Button>
          </div>
        )}
      </section>

      {/* Settings Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleOpenReview();
        }}
        className="space-y-6"
      >
        {saveError && (
          <Alert
            variant="destructive"
            title="Error"
            description={saveError}
            dismissible
            onDismiss={() => setSaveError(null)}
          />
        )}

        {/* Section 1: Card Issuance Mode (M2a) */}
        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl">
          <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
              <CreditCard className="size-5 text-brand dark:text-brand-soft shrink-0" />
              <span>Card issuance rules</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define whether new students receive instant digital cards or collect physical cards at the office.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-ash dark:text-zinc-400 block mb-2">
                Default Issuance Flow for New Sign-ups
              </label>
              <SegmentedControl
                ariaLabel="Card issuance mode"
                value={mode}
                onChange={(val) => setMode(val as "digital" | "physical")}
                options={[
                  { value: "digital", label: "Digital Card (Instant Pass)" },
                  { value: "physical", label: "Physical Card (Office Collection)" },
                ]}
              />
            </div>

            {/* Physical Quota Option (when physical is selected) */}
            {mode === "physical" && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-4 animate-in fade-in duration-200">
                <Switch
                  checked={hasQuota}
                  onCheckedChange={(checked) => {
                    setHasQuota(checked);
                    setQuotaError(null);
                    if (!checked) setQuotaRemaining("");
                  }}
                  label="Limit physical cards to next N sign-ups"
                  description="Automatically switch issuance to digital once the quota runs out."
                />

                {hasQuota && (
                  <div className="pt-2 max-w-xs">
                    <Input
                      ref={quotaInputRef}
                      id="quotaRemaining"
                      name="quotaRemaining"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      label="Remaining Physical Sign-ups"
                      placeholder="e.g. 50"
                      value={quotaRemaining}
                      onChange={(e) => {
                        setQuotaRemaining(e.target.value);
                        setQuotaError(null);
                      }}
                      error={quotaError ?? undefined}
                      helperText="Decrements automatically with every new student registration."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Digital to Physical Upgrade Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Switch
                checked={allowDigitalUpgrade}
                onCheckedChange={setAllowDigitalUpgrade}
                label="Allow digital → physical upgrade"
                description="Allow students with active digital cards to claim a physical card later at the SU desk."
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: SU Office Details */}
        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl">
          <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
              <Building2 className="size-5 text-brand dark:text-brand-soft shrink-0" />
              <span>Office location &amp; hours</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure pickup location, weekly operating schedule, and specific holiday or exam break overrides.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Pickup Location Field */}
            <Input
              id="officeLocation"
              label="Pickup Location"
              placeholder="e.g. Student Union Office, Building A, Ground Floor"
              leftIcon={<Building2 className="size-4" />}
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              helperText="Physical card pickup desk shown on student pass and collection cards."
              required
            />

            {/* Weekly Operating Hours (Sun..Sat) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
                <div>
                  <h3 className="font-sans font-semibold text-xs text-ash dark:text-zinc-400">
                    Weekly Operating Hours (Egypt Work Week: Sun–Thu)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure standard daily open hours. Sunday is the first working day of the week.
                  </p>
                </div>
              </div>

              {/* 7 Days Table / Rows: Sun to Sat */}
              <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-zinc-900/50">
                {DAYS.map(({ day, name, isWeekday }) => {
                  const config = weekly[day] ?? { isOpen: false, open: "09:00", close: "17:00" };
                  const error = getDayValidationError(day);

                  return (
                    <div
                      key={day}
                      className={cn(
                        "p-3.5 sm:p-4 transition-colors",
                        config.isOpen
                          ? "bg-white dark:bg-zinc-900"
                          : "bg-slate-50/70 dark:bg-zinc-900/30 text-muted-foreground"
                      )}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Day Name & Weekday Badge */}
                        <div className="flex items-center gap-2.5 min-w-[140px] sm:min-w-[160px]">
                          <span className="font-bold text-sm text-foreground">
                            {name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              isWeekday
                                ? "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                            )}
                          >
                            {isWeekday ? "Weekday" : "Weekend"}
                          </span>
                        </div>

                        {/* Open/Closed Toggle + Hours Inputs */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 max-w-lg">
                          <div className="shrink-0">
                            <Switch
                              id={`switch-day-${day}`}
                              checked={config.isOpen}
                              onCheckedChange={(checked) => {
                                setWeekly((prev) => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    isOpen: checked,
                                  },
                                }));
                              }}
                              aria-label={`${name} open status`}
                              label={config.isOpen ? "Open" : "Closed"}
                            />
                          </div>

                          {config.isOpen ? (
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <div className="flex-1 min-w-[95px]">
                                <TimePicker
                                  id={`time-open-${day}`}
                                  value={config.open}
                                  onChange={(val) => {
                                    setWeekly((prev) => ({
                                      ...prev,
                                      [day]: { ...prev[day], open: val },
                                    }));
                                  }}
                                  ariaLabel={`${name} opening time`}
                                  error={error ? " " : undefined}
                                />
                              </div>

                              <span className="text-xs text-muted-foreground font-bold shrink-0">
                                to
                              </span>

                              <div className="flex-1 min-w-[95px]">
                                <TimePicker
                                  id={`time-close-${day}`}
                                  value={config.close}
                                  onChange={(val) => {
                                    setWeekly((prev) => ({
                                      ...prev,
                                      [day]: { ...prev[day], close: val },
                                    }));
                                  }}
                                  ariaLabel={`${name} closing time`}
                                  error={error ? " " : undefined}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic py-2">
                              Closed all day
                            </div>
                          )}
                        </div>

                        {/* Copy to All Weekdays Action */}
                        <div className="shrink-0 flex items-center justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToWeekdays(day)}
                            className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 font-medium normal-case"
                            title={`Apply ${name}'s schedule to Sunday–Thursday`}
                          >
                            <Copy className="size-3.5 mr-1.5 shrink-0" />
                            Copy to weekdays
                          </Button>
                        </div>
                      </div>

                      {/* Inline Validation Error */}
                      {error && (
                        <p className="text-xs font-bold text-destructive mt-2 flex items-center gap-1">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>{error}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Summary Line */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-brand/5 dark:bg-brand/10 border border-brand/20 text-xs">
                <Clock className="size-4 text-brand dark:text-brand-soft shrink-0" />
                <span className="font-bold text-foreground">Live Weekly Summary:</span>
                <span className="font-semibold text-brand dark:text-brand-soft font-mono">{currentWeekSummary}</span>
              </div>
            </div>

            {/* Specific Dates / Exceptions Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h3 className="font-sans font-semibold text-xs text-ash dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-brand dark:text-brand-soft shrink-0" />
                    <span>Specific Dates &amp; Holiday Overrides</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Set date-specific closures or custom hours for exam periods and public holidays.
                  </p>
                </div>
              </div>

              {/* Existing Exceptions List */}
              {exceptions.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 text-xs text-muted-foreground italic">
                  No date-specific overrides configured. Office operates on standard weekly hours.
                </div>
              ) : (
                <div className="space-y-2">
                  {exceptions
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((ex) => {
                      const dayName = new Date(`${ex.date}T12:00:00Z`).toLocaleDateString("en-GB", {
                        weekday: "short",
                        timeZone: "UTC",
                      });
                      const displayDate = `${formatDisplayDate(ex.date)} (${dayName})`;

                      return (
                        <div
                          key={ex.date}
                          className="p-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-foreground">
                              {displayDate}
                            </span>

                            {ex.closed ? (
                              <Badge variant="destructive" size="sm">
                                Closed
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm">
                                <Clock className="size-3 mr-1" />
                                {ex.open} – {ex.close}
                              </Badge>
                            )}

                            {ex.note && (
                              <span className="text-xs text-muted-foreground font-medium truncate max-w-xs">
                                “{ex.note}”
                              </span>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveException(ex.date)}
                            aria-label={`Remove override for ${displayDate}`}
                            className="size-9 rounded-lg text-ash hover:text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Add Date Override Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-4">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  Add Date Override
                </span>

                {newExError && (
                  <p className="text-xs font-bold text-destructive flex items-center gap-1 animate-in fade-in-0 duration-150">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>{newExError}</span>
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                  {/* Shared DatePicker */}
                  <DatePicker
                    label="Date"
                    placeholder="Select future date…"
                    value={newExDate}
                    onChange={(date) => {
                      setNewExDate(date);
                      setNewExError(null);
                    }}
                    minDate={getCairoTodayString()}
                    disabledDates={exceptions.map((ex) => ex.date)}
                    clearable
                  />

                  {/* Switch: Closed all day */}
                  <div className="pt-0.5 sm:pt-6">
                    <Switch
                      id="newExClosed"
                      checked={newExClosed}
                      onCheckedChange={(checked) => {
                        setNewExClosed(checked);
                        setNewExError(null);
                      }}
                      label="Closed all day"
                      description={newExClosed ? "Office will be closed on this date." : "Custom open and close times."}
                    />
                  </div>

                  {/* Optional Note */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Input
                      id="newExNote"
                      label="Reason / Note (Optional)"
                      placeholder="e.g. Exam break, Public holiday"
                      value={newExNote}
                      onChange={(e) => setNewExNote(e.target.value.slice(0, 120))}
                      maxLength={120}
                    />
                  </div>
                </div>

                {/* Custom Hours inputs if not closed */}
                {!newExClosed && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                      Custom Hours for This Date
                    </label>
                    <div className="flex items-center gap-3 max-w-sm">
                      <div className="flex-1">
                        <TimePicker
                          id="newExOpen"
                          value={newExOpen}
                          onChange={(val) => {
                            setNewExOpen(val);
                            setNewExError(null);
                          }}
                          ariaLabel="Opening time for override"
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">to</span>
                      <div className="flex-1">
                        <TimePicker
                          id="newExClose"
                          value={newExClose}
                          onChange={(val) => {
                            setNewExClose(val);
                            setNewExError(null);
                          }}
                          ariaLabel="Closing time for override"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddException}
                    disabled={!newExDate}
                    className="font-bold text-xs normal-case min-h-[40px] px-4"
                  >
                    <Plus className="size-3.5 mr-1.5" />
                    Add Date Override
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Student Email Pattern (Super Admin Only) */}
        {isSuperAdmin && (
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
                <Mail className="size-5 text-brand dark:text-brand-soft shrink-0" />
                <span>Student email pattern</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Regular expression used to validate student emails during Microsoft SSO onboarding.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              <Alert
                variant="warning"
                size="sm"
                title="Super Admin Setting"
                description="Changing this regular expression will immediately affect who is permitted to register via Microsoft SSO."
                icon={<ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />}
              />

              <Input
                id="studentEmailPattern"
                label="Email Regex Pattern"
                placeholder="^[a-z]\.[a-z]+\d{4}@nu\.edu\.eg$"
                value={studentEmailPattern}
                onChange={(e) => setStudentEmailPattern(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </CardContent>
          </Card>
        )}

      </form>

      {/* Sticky Bottom Save Bar */}
      <StickySaveBar
        isDirty={isDirty}
        changeCount={changeCount}
        onDiscard={handleDiscard}
        onReview={handleOpenReview}
        isSaving={isSaving}
      />

      {/* Review & Confirm Changes Modal */}
      <ReviewChangesModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          if (!isSaving) setIsReviewModalOpen(false);
        }}
        onConfirm={executeSave}
        changes={changes}
        isSaving={isSaving}
      />

      {/* Confirmation Dialog: Switch All Pending to Digital */}
      <Modal
        isOpen={isSwitchModalOpen}
        onClose={() => {
          if (!isSwitching) setIsSwitchModalOpen(false);
        }}
        title="Switch Pending Students to Digital?"
        icon={<ArrowRightLeft className="size-5 text-brand" />}
        maxWidth="md"
        role="alertdialog"
      >
        <ModalBody className="space-y-3">
          <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/20 text-xs space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Target: <strong>{data.stats.pendingPhysicalStudents}</strong> pending student{data.stats.pendingPhysicalStudents === 1 ? "" : "s"}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Consequence:</strong> All students currently in the physical pickup queue will immediately receive active digital membership passes. Their status will change to digital and they can open the SU Card portal to access partner discounts right away.
            </p>
          </div>

          {switchFeedback && (
            <Alert variant="destructive" size="sm" description={switchFeedback} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            disabled={isSwitching}
            onClick={() => setIsSwitchModalOpen(false)}
            className="normal-case font-semibold min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSwitching}
            loadingText="Switching…"
            onClick={handleBulkSwitchToDigital}
            className="normal-case font-bold min-h-[44px]"
          >
            {`Confirm & Switch ${data.stats.pendingPhysicalStudents} Students`}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
