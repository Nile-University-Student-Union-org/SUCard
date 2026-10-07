"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  Clock,
  Mail,
  AlertTriangle,
  RotateCcw,
  Check,
  Loader2,
  Users,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
} from "lucide-react";
import type { Settings, SettingsResponse } from "@/lib/student/types";
import { Button } from "@/components/ui/button";
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
  const [allowDigitalUpgrade, setAllowDigitalUpgrade] = useState(true);
  const [officeLocation, setOfficeLocation] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [studentEmailPattern, setStudentEmailPattern] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const parsedQuota =
      mode === "physical" && hasQuota && quotaRemaining.trim() !== ""
        ? parseInt(quotaRemaining.trim(), 10)
        : null;

    if (hasQuota && mode === "physical" && (isNaN(parsedQuota as number) || (parsedQuota as number) < 0)) {
      setSaveError("Please enter a valid non-negative quota number.");
      setIsSaving(false);
      return;
    }

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
        return;
      }

      setData(resData as SettingsResponse);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
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
    } catch {
      setSwitchFeedback("Network error. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded-md animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
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
              className="normal-case"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-charcoal dark:text-white">
          SETTINGS
        </h1>
        <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-1">
          Manage card issuance rules, physical quota, office collection details, and access patterns.
        </p>
      </div>

      {/* Stock & Pending Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatTile
          label="Pending Physical Students"
          value={data.stats.pendingPhysicalStudents}
          subText="Students on physical flow awaiting card link"
          icon={<Users className="size-5" />}
          accent={data.stats.warning ? "rose" : "brand"}
        />

        <StatTile
          label="Unassigned Cards in Stock"
          value={data.stats.unassignedCardsInStock}
          subText="Physical cards ready for issuance"
          icon={<Layers className="size-5" />}
          accent="blue"
        />
      </div>

      {/* Stock Deficit Warning Alert */}
      {data.stats.warning && (
        <Alert
          variant="warning"
          title="Physical Stock Warning"
          description={`There are ${data.stats.pendingPhysicalStudents} pending physical students, but only ${data.stats.unassignedCardsInStock} unassigned cards in stock.`}
          icon={<AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSwitchModalOpen(true)}
              className="text-xs font-bold border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 normal-case"
            >
              Switch pending to digital
            </Button>
          }
        />
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {saveError && (
          <Alert variant="destructive" title="Error" description={saveError} dismissible onDismiss={() => setSaveError(null)} />
        )}
        {saveSuccess && (
          <Alert variant="success" title="Success" description="Settings updated successfully." icon={<Check className="size-4" />} />
        )}

        {/* Section 1: Card Issuance Mode (M2a) */}
        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl">
          <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
              <CreditCard className="size-5 text-brand dark:text-brand-soft shrink-0" />
              <span>CARD ISSUANCE</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define whether new students receive instant digital cards or collect physical cards at the office.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400 block mb-2">
                Default Issuance Flow
              </label>
              <SegmentedControl
                ariaLabel="Card issuance mode"
                value={mode}
                onChange={(val) => setMode(val as "digital" | "physical")}
                options={[
                  { value: "digital", label: "Digital Card (Instant)" },
                  { value: "physical", label: "Physical Card (Office Pickup)" },
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
                    if (!checked) setQuotaRemaining("");
                  }}
                  label="Limit physical cards to next N sign-ups"
                  description="Automatically switch issuance to digital once the quota runs out."
                />

                {hasQuota && (
                  <div className="pt-2 max-w-xs">
                    <Input
                      id="quotaRemaining"
                      type="number"
                      min={0}
                      label="Remaining Physical Sign-ups"
                      placeholder="e.g. 50"
                      value={quotaRemaining}
                      onChange={(e) => setQuotaRemaining(e.target.value)}
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

            {/* Quick Action: Bulk Switch Pending to Digital */}
            {data.stats.pendingPhysicalStudents > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">
                    Switch All Pending Physical Students
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Instantly issue digital cards to all {data.stats.pendingPhysicalStudents} students waiting for physical cards.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSwitchModalOpen(true)}
                  className="shrink-0 font-bold normal-case text-xs"
                >
                  <ArrowRightLeft className="size-3.5 mr-1.5" />
                  Switch to Digital
                </Button>
              </div>
            )}
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
            disabled={isSaving}
            className="font-bold min-h-[44px] normal-case px-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog: Switch All Pending to Digital */}
      <Modal
        isOpen={isSwitchModalOpen}
        onClose={() => {
          if (!isSwitching) setIsSwitchModalOpen(false);
        }}
        title="Switch Pending Students to Digital?"
        icon={<ArrowRightLeft className="size-5" />}
        maxWidth="md"
      >
        <ModalBody className="space-y-3">
          <p className="text-sm text-foreground">
            This will switch all <strong>{data.stats.pendingPhysicalStudents}</strong> students currently on the physical flow to the digital flow and immediately issue them digital membership cards.
          </p>
          <p className="text-xs text-muted-foreground">
            They will be able to access their cards immediately upon opening the SU Card portal.
          </p>
          {switchFeedback && (
            <p className="text-xs text-destructive font-bold">{switchFeedback}</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            disabled={isSwitching}
            onClick={() => setIsSwitchModalOpen(false)}
            className="normal-case font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isSwitching}
            onClick={handleBulkSwitchToDigital}
            className="normal-case font-bold"
          >
            {isSwitching ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Switching…
              </>
            ) : (
              "Confirm & Switch All"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
