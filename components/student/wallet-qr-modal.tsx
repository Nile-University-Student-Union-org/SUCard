"use client";

import React, {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { ExternalLink, Scan, Wallet, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export interface WalletQrModalProps {
  saveUrl: string | null;
  onClose: () => void;
}

/**
 * Desktop "Add to Google Wallet": shows the save link as a QR to scan with the phone,
 * since Google Wallet lives on the phone, not the computer.
 */
export function WalletQrModal({ saveUrl, onClose }: WalletQrModalProps) {
  const isOpen = !!saveUrl;
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [present, setPresent] = useState(isOpen);

  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Sync present state for smooth exit transitions
  if (isOpen && !present) setPresent(true);
  useEffect(() => {
    if (isOpen || !present) return;
    const timeout = window.setTimeout(
      () => setPresent(false),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180
    );
    return () => window.clearTimeout(timeout);
  }, [isOpen, present]);

  // Generate QR Code SVG Data URL
  useEffect(() => {
    if (!saveUrl) return;
    let cancelled = false;
    QRCode.toString(saveUrl, {
      type: "svg",
      errorCorrectionLevel: "L",
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((svg) => {
        if (!cancelled) setQrSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      })
      .catch(() => {
        if (!cancelled) setQrSrc(null);
      });
    return () => {
      cancelled = true;
      setQrSrc(null);
    };
  }, [saveUrl]);

  // Lock body scroll while modal is present
  useEffect(() => {
    if (present) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      const openModals = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (openModals.length === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [present]);

  // Focus trap & restore focus on close
  useEffect(() => {
    if (!present) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusFrame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button:not(:disabled), a[href], [tabindex="0"]'
      );
      (first || panelRef.current)?.focus();
    });

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex="0"]'
        )
      );
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleTab);
      previousFocus?.focus();
    };
  }, [present]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !present) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[80] flex min-w-0 items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {/* Brand-Tinted Backdrop: Deeper Navy Tint + Blur */}
      <div
        onClick={isOpen ? onClose : undefined}
        className={cn(
          "fixed inset-0 bg-[#0A1E38]/75 dark:bg-[#06101D]/85 backdrop-blur-md duration-200 motion-reduce:animate-none",
          isOpen ? "animate-in fade-in" : "animate-out fade-out"
        )}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative w-full min-w-0 max-w-md max-h-[92dvh] sm:max-h-[90dvh] flex flex-col bg-white dark:bg-[#0D223C] rounded-t-[28px] sm:rounded-[28px] border-t-2 sm:border border-slate-200/90 dark:border-[#0F548D]/50 shadow-[0_20px_60px_-15px_rgba(15,48,86,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] text-foreground overflow-hidden z-10 duration-200 motion-reduce:animate-none outline-none",
          isOpen
            ? "animate-in fade-in zoom-in-[0.96] slide-in-from-bottom-4 sm:slide-in-from-bottom-0"
            : "animate-out fade-out zoom-out-[0.96] slide-out-to-bottom-4 sm:slide-out-to-bottom-0 duration-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center items-center bg-transparent shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Ambient Top Glow & Header */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-gradient-to-b from-[#F4F7FB]/80 to-white dark:from-[#112845]/90 dark:to-[#0D223C] shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Wallet icon in brand gradient tile */}
            <div className="size-10 sm:size-11 rounded-2xl bg-gradient-to-br from-[#018BCE] via-[#0F548D] to-[#0F3056] p-[1.5px] shadow-sm shadow-[#018BCE]/25 shrink-0">
              <div className="w-full h-full rounded-[14.5px] bg-white dark:bg-[#0A1E38] flex items-center justify-center">
                <Wallet className="size-5 sm:size-5.5 text-[#0F548D] dark:text-sky-300" aria-hidden="true" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="font-heading text-lg sm:text-xl uppercase tracking-wider text-[#0A1E38] dark:text-white leading-tight font-normal"
              >
                ADD TO GOOGLE WALLET
              </h2>
              <p
                id={descriptionId}
                className="text-xs text-ash dark:text-zinc-400 font-normal leading-tight mt-0.5"
              >
                Scan with your phone to save your pass
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="size-9 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#018BCE]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="min-w-0 overflow-y-auto thin-scrollbar p-5 sm:p-6 flex-1 min-h-0 space-y-4 flex flex-col items-center">
          {/* Framed QR Code with Corner Accents & Soft Sky Ring */}
          <div className="relative flex flex-col items-center">
            {/* Ambient soft glow behind QR plate */}
            <div
              className="absolute -inset-2 bg-gradient-to-b from-[#018BCE]/20 via-[#0F548D]/10 to-transparent rounded-3xl blur-xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative rounded-2xl bg-white p-3 sm:p-3.5 shadow-xl ring-4 ring-[#018BCE]/15 dark:ring-[#018BCE]/25 border border-slate-200/80">
              {/* Corner accents sit outside the plate so the QR quiet zone stays clean */}
              <div
                className="absolute -top-2.5 -left-2.5 size-5 border-t-2 border-l-2 border-[#018BCE] rounded-tl-md pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -top-2.5 -right-2.5 size-5 border-t-2 border-r-2 border-[#018BCE] rounded-tr-md pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-2.5 -left-2.5 size-5 border-b-2 border-l-2 border-[#018BCE] rounded-bl-md pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-2.5 -right-2.5 size-5 border-b-2 border-r-2 border-[#018BCE] rounded-br-md pointer-events-none"
                aria-hidden="true"
              />

              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- generated data URL
                <img
                  src={qrSrc}
                  alt="QR code that opens Google Wallet on your phone"
                  width={260}
                  height={260}
                  className="size-[240px] sm:size-[260px] block select-none"
                />
              ) : (
                <div
                  className="size-[240px] sm:size-[260px] animate-pulse rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-mono"
                  aria-hidden="true"
                >
                  Generating QR…
                </div>
              )}
            </div>

            {/* Scan Prompt Caption */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              <Scan className="size-3 text-[#018BCE]" aria-hidden="true" />
              <span>Point your phone camera to scan</span>
            </div>
          </div>

          {/* 3 Step Rows with Numbered Sky Circles */}
          <div className="w-full max-w-sm space-y-2 rounded-2xl bg-slate-50/90 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60 p-3.5 sm:p-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-medium">
              <span className="size-5 rounded-full bg-[#018BCE]/15 dark:bg-[#018BCE]/25 border border-[#018BCE]/40 text-[#0F548D] dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                1
              </span>
              <span>Open the camera on your Android phone.</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-medium">
              <span className="size-5 rounded-full bg-[#018BCE]/15 dark:bg-[#018BCE]/25 border border-[#018BCE]/40 text-[#0F548D] dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                2
              </span>
              <span>Point it at the code and tap the link.</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-medium">
              <span className="size-5 rounded-full bg-[#018BCE]/15 dark:bg-[#018BCE]/25 border border-[#018BCE]/40 text-[#0F548D] dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                3
              </span>
              <span>
                Tap <strong className="font-semibold text-charcoal dark:text-white">Save</strong> in Google Wallet.
              </span>
            </div>
          </div>

          {/* Security Note */}
          <p className="text-[11px] text-ash dark:text-zinc-500 text-center font-medium">
            This code is just for you — don&apos;t share it.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50/95 dark:bg-[#0A1E38]/95 backdrop-blur-md px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200/80 dark:border-[#0F548D]/30 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 shrink-0 pb-safe">
          <Button
            variant="outline"
            size="md"
            onClick={() => saveUrl && window.open(saveUrl, "_blank", "noopener,noreferrer")}
            className="w-full sm:w-auto text-xs sm:text-sm font-semibold border-slate-300/80 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 normal-case min-h-[44px]"
          >
            <ExternalLink className="size-4 mr-1.5" />
            Open on this computer
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto px-8 text-xs sm:text-sm font-bold min-h-[44px] normal-case shadow-xs"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
