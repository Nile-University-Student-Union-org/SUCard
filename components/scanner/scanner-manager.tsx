"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, Receipt } from "lucide-react";
import { toast } from "sonner";
import { TabBar, type TabBarItem } from "@/components/ui/tab-bar";
import { ScannerHeader } from "./scanner-header";
import { ScannerViewfinder } from "./scanner-viewfinder";
import { ScanValidPanel } from "./scan-valid-panel";
import { ScanInvalidPanel } from "./scan-invalid-panel";
import { ScannerTodayTab } from "./scanner-today-tab";
import { validateQr, confirmDiscount } from "./api";
import { notifySuccess, notifyError } from "@/lib/scanner/feedback";
import type {
  ScanContextResponse,
  ScanResultCode,
  ScanOffer,
} from "@/lib/vendors/types";
import type { UserNavUser, UserNavArea } from "@/components/ui/user-nav-dropdown";

interface ScannerManagerProps {
  initialContext: ScanContextResponse;
  user: UserNavUser;
  areas: UserNavArea[];
}

type TabKey = "scan" | "today";

const TABS: TabBarItem<TabKey>[] = [
  {
    id: "scan",
    label: "Scan Card",
    icon: <QrCode className="size-4" />,
  },
  {
    id: "today",
    label: "Today's Scans",
    icon: <Receipt className="size-4" />,
  },
];

export function ScannerManager({
  initialContext,
  user,
  areas,
}: ScannerManagerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("scan");
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Scan state
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Results
  const [validResult, setValidResult] = useState<{
    scanId: string;
    studentName: string;
    universityId: string;
    offers: ScanOffer[];
  } | null>(null);

  const [invalidResult, setInvalidResult] = useState<{
    code: ScanResultCode | "rate_limited" | string;
    resetsAt: string | null;
  } | null>(null);

  // Debounce tracking: ignore same QR for 3 seconds
  const lastScannedQrRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleQrDecoded = useCallback(
    async (qrString: string) => {
      const now = Date.now();
      const isSameAsRecent =
        lastScannedQrRef.current === qrString &&
        now - lastScannedTimeRef.current < 3000;

      if (isSameAsRecent || isValidating || validResult || invalidResult) {
        return;
      }

      lastScannedQrRef.current = qrString;
      lastScannedTimeRef.current = now;
      setIsValidating(true);

      try {
        const res = await validateQr(qrString);

        if (res.result === "valid" && res.student && res.offers.length > 0) {
          notifySuccess();
          setValidResult({
            scanId: res.scanId,
            studentName: res.student.name,
            universityId: res.student.universityId,
            offers: res.offers,
          });
        } else {
          notifyError();
          setInvalidResult({
            code: res.result,
            resetsAt: res.resetsAt,
          });
        }
      } catch (err: unknown) {
        notifyError();
        const msg =
          err instanceof Error
            ? err.message
            : "Network error validating card. Please check internet connection.";
        setInvalidResult({
          code: "invalid_qr",
          resetsAt: null,
        });
        toast.error(msg);
      } finally {
        setIsValidating(false);
      }
    },
    [isValidating, validResult, invalidResult]
  );

  const handleConfirmDiscount = async (
    offerId: string,
    billAmount?: number
  ) => {
    if (!validResult) return;
    setIsConfirming(true);

    try {
      await confirmDiscount(validResult.scanId, offerId, billAmount);
      notifySuccess();
      toast.success("Discount recorded successfully!");
      setValidResult(null);
    } catch (err: unknown) {
      notifyError();
      const msg =
        err instanceof Error ? err.message : "Failed to record discount";
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelValid = () => {
    setValidResult(null);
  };

  const handleDismissInvalid = () => {
    setInvalidResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground select-none">
      {/* Top Navigation Bar */}
      <ScannerHeader
        user={user}
        areas={areas}
        vendorName={initialContext.vendorName}
        branchName={initialContext.branchName}
        vendorLogoUrl={initialContext.vendorLogoUrl}
        isOnline={isOnline}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {activeTab === "scan" ? (
          <ScannerViewfinder
            vendorActive={initialContext.vendorActive}
            vendorName={initialContext.vendorName}
            isOnline={isOnline}
            onScan={handleQrDecoded}
            isProcessing={!!validResult || !!invalidResult}
            isValidating={isValidating}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ScannerTodayTab branchName={initialContext.branchName} />
          </div>
        )}

        {/* Valid Result Modal Panel */}
        {validResult && (
          <ScanValidPanel
            studentName={validResult.studentName}
            universityId={validResult.universityId}
            offers={validResult.offers}
            onConfirm={handleConfirmDiscount}
            onCancel={handleCancelValid}
            isConfirming={isConfirming}
          />
        )}

        {/* Invalid Result Modal Panel */}
        {invalidResult && (
          <ScanInvalidPanel
            code={invalidResult.code}
            resetsAt={invalidResult.resetsAt}
            onDismiss={handleDismissInvalid}
          />
        )}
      </main>

      {/* Bottom Floating Navigation Tabs */}
      <nav
        aria-label="Scanner views"
        className="sticky bottom-0 z-30 p-2.5 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg"
      >
        <div className="max-w-md mx-auto">
          <TabBar
            items={TABS}
            value={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              // Clear any modals when switching tabs
              setValidResult(null);
              setInvalidResult(null);
            }}
            ariaLabel="Scanner Modes"
            fullWidth
            size="md"
          />
        </div>
      </nav>
    </div>
  );
}
