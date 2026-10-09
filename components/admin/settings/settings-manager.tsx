"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Building2,
  Clock,
  Mail,
  AlertTriangle,
  RotateCcw,
  Users,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
  Smartphone,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import type { Settings, SettingsResponse } from "@/lib/student/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { StatusState } from "@/components/ui/status-state";

interface SettingsManagerProps {
  role: string;
}

export function SettingsManager({ role }: SettingsManagerProps) {
  const isSuperAdmin = role === "super_admin";

  const [data, setData] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<"digital" | "physical">("digital");
  const [hasQuota, setHasQuota] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<string>("");
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const quotaInputRef = useRef<HTMLInputElement>(null);
  const [allowDigitalUpgrade, setAllowDigitalUpgrade] = useState(true);
  const [officeLocation, setOfficeLocation] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [studentEmailPattern, setStudentEmailPattern] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mode change confirmation modal
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

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
          setOfficeHours(resData.settings.office.hours);
          setStudentEmailPattern(resData.settings.studentEmailPattern);
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

  const executeSave = async () => {
    const parsedQuota = mode === "physical" && hasQuota ? Number(quotaRemaining) : null;
    if (parsedQuota !== null && (!/^(0|[1-9]\d*)$/.test(quotaRemaining) || !Number.isSafeInteger(parsedQuota))) {
      setQuotaError("Enter a whole, nonnegative number of physical sign-ups.");
      setIsConfirmSaveOpen(false);
      requestAnimationFrame(() => quotaInputRef.current?.focus());
      return;
    }
    setIsSaving(true);
    setSaveError(null);

    const patch: Partial<Settings> = {
      issuance: {
        mode,
        physicalQuotaRemaining: parsedQuota,
      },
      allowDigitalUpgrade,
      office: {
        location: officeLocation.trim(),
        hours: officeHours.trim(),
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
        setIsConfirmSaveOpen(false);
        return;
      }

      setData(resData as SettingsResponse);
      setIsConfirmSaveOpen(false);
      toast.success("Settings updated successfully");
    } catch {
      setSaveError("Network error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (mode === "physical" && hasQuota && (!/^(0|[1-9]\d*)$/.test(quotaRemaining) || !Number.isSafeInteger(Number(quotaRemaining)))) {
      setQuotaError("Enter a whole, nonnegative number of physical sign-ups.");
      quotaInputRef.current?.focus();
      return;
    }
    setQuotaError(null);

    // If mode is changing, confirm with high-impact dialog
    const isModeChanging = data && mode !== data.settings.issuance.mode;
    if (isModeChanging) {
      setIsConfirmSaveOpen(true);
    } else {
      void executeSave();
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
      <form onSubmit={handleSaveClick} className="space-y-6">
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
              <span>CARD ISSUANCE RULES</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define whether new students receive instant digital cards or collect physical cards at the office.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400 block mb-2">
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
              <span>OFFICE LOCATION &amp; HOURS</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Displayed to students who need to collect physical cards or resolve account issues.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <Input
              id="officeLocation"
              label="Pickup Location"
              placeholder="e.g. Student Union Office, Building A, Ground Floor"
              leftIcon={<Building2 className="size-4" />}
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              required
            />

            <Input
              id="officeHours"
              label="Office Hours"
              placeholder="e.g. Sunday–Thursday 10:00 AM – 4:00 PM"
              leftIcon={<Clock className="size-4" />}
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Section 3: Student Email Pattern (Super Admin Only) */}
        {isSuperAdmin && (
          <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl">
            <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
                <Mail className="size-5 text-brand dark:text-brand-soft shrink-0" />
                <span>STUDENT EMAIL PATTERN</span>
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

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSaving}
            loadingText="Saving…"
            className="font-bold min-h-[44px] normal-case px-6"
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog: High-impact Mode Change */}
      <Modal
        isOpen={isConfirmSaveOpen}
        onClose={() => {
          if (!isSaving) setIsConfirmSaveOpen(false);
        }}
        title="Confirm Issuance Mode Change"
        icon={<AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />}
        maxWidth="md"
        role="alertdialog"
      >
        <ModalBody className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              You are changing the default issuance mode from{" "}
              <span className="uppercase font-mono">{currentSavedMode}</span> to{" "}
              <span className="uppercase font-mono">{mode}</span>.
            </p>
            <div className="text-muted-foreground space-y-1">
              <p>
                <strong>Consequence:</strong> All future Nile University students registering via Microsoft SSO will immediately follow the <strong>{mode}</strong> issuance path.
              </p>
              {mode === "physical" ? (
                <p>
                  New students will be required to visit the SU Office to collect a physical card before their account becomes active.
                </p>
              ) : (
                <p>
                  New students will receive instant digital membership cards upon signup. Existing pending students will remain pending until individually or bulk switched.
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => setIsConfirmSaveOpen(false)}
            className="normal-case font-semibold min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSaving}
            loadingText="Saving…"
            onClick={() => void executeSave()}
            className="normal-case font-bold min-h-[44px]"
          >
            Confirm & Save
          </Button>
        </ModalFooter>
      </Modal>

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
