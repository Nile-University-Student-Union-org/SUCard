"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  CreditCard,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { OfficeSetting, StudentHomeResponse } from "@/lib/student/types";
import {
  cairoDate,
  officeStatus,
  upcomingExceptions,
  weekSummary,
} from "@/lib/settings/office-hours";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function exceptionLabel(exception: OfficeSetting["schedule"]["exceptions"][number]): string {
  const day = new Date(`${exception.date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const hours = exception.closed ? "Closed" : `${exception.open}–${exception.close}`;
  return `${hours} ${day}${exception.note ? `: ${exception.note}` : ""}`;
}

export interface SwitchToPhysicalModalProps {
  isOpen: boolean;
  onClose: () => void;
  office: OfficeSetting;
  onSuccess: (updatedHome: StudentHomeResponse) => void;
}

export function SwitchToPhysicalModal({
  isOpen,
  onClose,
  office,
  onSuccess,
}: SwitchToPhysicalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const officeSchedule = office.schedule;
  const officeNow = mounted ? new Date() : null;
  const status = officeNow ? officeStatus(officeSchedule, officeNow) : null;
  const nextException = officeNow ? upcomingExceptions(officeSchedule, officeNow, 1)[0] : undefined;
  const exceptionWithin14Days = nextException && officeNow
    ? (Date.parse(`${nextException.date}T12:00:00Z`) - Date.parse(`${cairoDate(officeNow)}T12:00:00Z`)) / 86_400_000 <= 14
    : false;
  const upcomingExceptionLabel = nextException && exceptionWithin14Days
    ? exceptionLabel(nextException)
    : null;

  const handleSwitch = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/student/flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ cardFlow: "physical" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorText =
          data.error ||
          (res.status === 409
            ? "Physical cards are not currently available."
            : "Failed to switch to physical card.");
        setErrorMessage(errorText);
        setIsSubmitting(false);
        return;
      }

      toast.success("Switched to physical card. Collect your card from the SU room.");
      onSuccess(data as StudentHomeResponse);
      onClose();
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          setErrorMessage(null);
          onClose();
        }
      }}
      title="Switch to physical card"
      description="Collect a printed membership card from the Student Union desk"
      icon={<CreditCard className="size-5" />}
      maxWidth="md"
      zIndex="z-[80]"
      showCloseButton={!isSubmitting}
    >
      <ModalBody className="space-y-4">
        {errorMessage && (
          <Alert
            variant="destructive"
            size="sm"
            description={errorMessage}
            dismissible
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* Immediate void warning */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Digital pass will be voided immediately</p>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-normal">
              Switching will instantly deactivate your web QR and remove your Google Wallet pass. You will need to pick up a physical card to use discounts.
            </p>
          </div>
        </div>

        {/* Pickup & Office hours */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-3">
          <span className="text-xs font-semibold text-ash dark:text-zinc-400 block">
            Pickup location &amp; office hours
          </span>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5 text-foreground font-bold">
              <MapPin className="size-4 text-brand dark:text-brand-soft shrink-0 mt-0.5" />
              <span className="leading-snug">{office.location}</span>
            </div>

            {/* Today status */}
            <div className="flex items-center gap-2 font-medium">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  status?.openNow
                    ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                    : "bg-slate-400 dark:bg-zinc-500 ring-2 ring-slate-400/20"
                )}
                aria-hidden="true"
              />
              <span className={status?.openNow ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                {status?.todayLabel ?? weekSummary(officeSchedule)}
              </span>
              {status?.nextOpen && !status.openNow && (
                <span className="text-muted-foreground/80 text-xs">
                  · {status.nextOpen}
                </span>
              )}
            </div>

            {/* Week summary */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5 text-ash dark:text-zinc-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{weekSummary(officeSchedule)}</span>
            </div>

            {/* Upcoming Exception */}
            {upcomingExceptionLabel && (
              <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <Calendar className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-tight">{upcomingExceptionLabel}</span>
              </div>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setErrorMessage(null);
            onClose();
          }}
          disabled={isSubmitting}
          className="font-semibold normal-case min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSwitch}
          disabled={isSubmitting}
          className="font-bold normal-case min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2 motion-reduce:animate-none" />
              <span>Switching…</span>
            </>
          ) : (
            "Switch to physical card"
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
