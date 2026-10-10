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
import {
  Camera,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Link2,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "cn";
import { copyToClipboard } from "@/lib/clipboard";

const emptySubscribe = () => () => {};

export interface WalletQrModalProps {
  saveUrl: string | null;
  onClose: () => void;
}

/**
 * Desktop "Add to Google Wallet": shows the save link as a QR code to scan with a phone.
 * Rebuilt from scratch with a focused card layout, smooth motion, and responsive bottom sheet.
 */
export function WalletQrModal({ saveUrl, onClose }: WalletQrModalProps) {
  const isOpen = Boolean(saveUrl);
  const [present, setPresent] = useState(isOpen);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!saveUrl) return;
    const ok = await copyToClipboard(saveUrl);
    if (ok) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Synchronize presence during render and handle exit timing
  if (isOpen && !present) {
    setPresent(true);
  }

  useEffect(() => {
    if (isOpen || !present) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(
      () => {
        setPresent(false);
      },
      reduceMotion ? 0 : 150
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
        if (!cancelled) {
          setQrSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrSrc(null);
        }
      });
    return () => {
      cancelled = true;
      setQrSrc(null);
    };
  }, [saveUrl]);

  // Lock body scroll while modal is present
  useEffect(() => {
    if (!present) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      const openModals = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (openModals.length <= 1) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [present]);

  // Focus trap, focus return, and keyboard handlers
  useEffect(() => {
    if (!present) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], [tabindex="0"]'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      } else {
        panelRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], [tabindex="0"]'
          )
        );

        if (focusable.length === 0) {
          event.preventDefault();
          panelRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (
            document.activeElement === first ||
            !panelRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !panelRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [present, onClose]);

  if (!mounted || !present) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop: navy tint (#06101D/70) + backdrop-blur-sm */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 bg-[#06101D]/70 backdrop-blur-sm motion-reduce:animate-none",
          isOpen
            ? "animate-in fade-in duration-[220ms] ease-out"
            : "animate-out fade-out duration-150 ease-in"
        )}
      />

      {/* Modal / Bottom Sheet Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-full sm:max-w-[400px] bg-white dark:bg-[#0B1B30] rounded-t-[28px] sm:rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-950/20 dark:shadow-black/70 overflow-y-auto sm:overflow-hidden text-foreground z-10 select-none pb-safe sm:pb-0 outline-hidden motion-reduce:animate-none",
          isOpen
            ? "animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-2 sm:slide-in-from-bottom-2 duration-[220ms] [animation-timing-function:cubic-bezier(0.22,1,0.36,1)]"
            : "animate-out fade-out zoom-out-[0.97] slide-out-to-bottom-2 sm:slide-out-to-bottom-2 duration-150 ease-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Mode Soft Radial Sky Glow at the Top (opacity <= 0.25) */}
        <div
          className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(1,139,206,0.22),transparent_70%)] pointer-events-none rounded-t-[28px]"
          aria-hidden="true"
        />

        {/* 36px Round Ghost Close Button (Top-Right, no header bar) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 size-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#018BCE]"
        >
          <X className="size-4 shrink-0" aria-hidden="true" />
        </button>

        {/* Content Container (24-28px rhythm) */}
        <div className="p-6 sm:p-7 flex flex-col items-center text-center relative z-10">
          {/* Eyebrow */}
          <span className="text-[11px] font-semibold text-[#018BCE]">
            Google Wallet
          </span>

          {/* Title */}
          <h2
            id={titleId}
            className="font-sans font-semibold text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight mt-1.5"
          >
            Add your card to your phone
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Scan with your phone&apos;s camera.
          </p>

          {/* QR Plate */}
          <div className="size-[232px] sm:size-[264px] rounded-[20px] bg-white p-3.5 sm:p-4 ring-1 ring-sky-400/40 shadow-lg shadow-[#018BCE]/15 dark:shadow-[#018BCE]/20 relative flex items-center justify-center shrink-0 mt-5 sm:mt-6">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- safe client-generated SVG data URL
              <img
                src={qrSrc}
                alt="QR code to add Nile University Student Union card to Google Wallet"
                width={232}
                height={232}
                className="w-full h-full block select-none"
              />
            ) : (
              <div
                className="w-full h-full rounded-xl relative overflow-hidden bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-mono after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] motion-reduce:after:animate-none after:bg-gradient-to-r after:from-transparent after:via-slate-200/70 after:to-transparent"
                aria-hidden="true"
              >
                Generating QR…
              </div>
            )}
          </div>

          {/* 3 Step Icons Row */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-slate-600 dark:text-slate-300 mt-5 sm:mt-6 text-xs font-semibold">
            <div className="flex items-center gap-1.5 shrink-0">
              <Camera className="size-4 text-[#018BCE] shrink-0" aria-hidden="true" />
              <span>Open camera</span>
            </div>
            <ChevronRight
              className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0"
              aria-hidden="true"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Link2 className="size-4 text-[#018BCE] shrink-0" aria-hidden="true" />
              <span>Tap the link</span>
            </div>
            <ChevronRight
              className="size-3.5 text-slate-300 dark:text-slate-600 shrink-0"
              aria-hidden="true"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Wallet className="size-4 text-[#018BCE] shrink-0" aria-hidden="true" />
              <span>Save to Wallet</span>
            </div>
          </div>

          {/* Quiet Browser & Copy Actions (Footer) */}
          {saveUrl && (
            <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap text-xs">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus-visible:outline-hidden focus-visible:underline cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 animate-icon-morph shrink-0" aria-hidden="true" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>Copy pass link</span>
                  </>
                )}
              </button>
              <span className="text-slate-300 dark:text-zinc-600 select-none" aria-hidden="true">&bull;</span>
              <a
                href={saveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus-visible:outline-hidden focus-visible:underline"
              >
                <span>Open in browser</span>
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
