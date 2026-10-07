"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Scan, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

export interface WalletQrModalProps {
  saveUrl: string | null;
  onClose: () => void;
}

/**
 * Desktop "Add to Google Wallet": shows the save link as a QR code to scan with a phone,
 * because Google Wallet passes are added directly to the phone.
 */
export function WalletQrModal({ saveUrl, onClose }: WalletQrModalProps) {
  const isOpen = !!saveUrl;
  const [qrSrc, setQrSrc] = useState<string | null>(null);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      zIndex="z-[80]"
      showCloseButton
      className="overflow-hidden"
    >
      <ModalHeader className="bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-900/90">
        <div className="flex items-center gap-3">
          <div className="size-10 sm:size-11 rounded-2xl bg-gradient-to-br from-[#018BCE] via-[#0F548D] to-[#0F3056] p-[1.5px] shadow-sm shadow-[#018BCE]/25 shrink-0">
            <div className="w-full h-full rounded-[14.5px] bg-white dark:bg-zinc-900 flex items-center justify-center">
              <Wallet className="size-5 sm:size-5.5 text-[#0F548D] dark:text-sky-300" aria-hidden="true" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <ModalTitle>ADD TO GOOGLE WALLET</ModalTitle>
            <ModalDescription>
              Scan with your phone camera — pass saving completes on your phone
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="p-5 sm:p-6 flex flex-col items-center space-y-4">
        {/* QR Code Container with Frame and Quiet Zone */}
        <div className="relative flex flex-col items-center">
          <div className="relative rounded-2xl bg-white p-3 sm:p-3.5 shadow-xl ring-4 ring-[#018BCE]/15 dark:ring-[#018BCE]/25 border border-slate-200/80">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated safe data URL
              <img
                src={qrSrc}
                alt="QR code to save pass to Google Wallet on your phone"
                width={240}
                height={240}
                className="size-[220px] sm:size-[240px] block select-none"
              />
            ) : (
              <div
                className="size-[220px] sm:size-[240px] animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-muted-foreground font-mono motion-reduce:animate-none"
                aria-hidden="true"
              >
                Generating QR…
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Scan className="size-3.5 text-brand dark:text-brand-soft" aria-hidden="true" />
            <span>Point your phone camera to scan</span>
          </div>
        </div>

        {/* 3 Step Instructions */}
        <div className="w-full max-w-sm space-y-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60 p-3.5 sm:p-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground font-medium">
            <span className="size-5 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/30 text-brand dark:text-brand-soft font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <span>Open your phone&apos;s camera.</span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground font-medium">
            <span className="size-5 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/30 text-brand dark:text-brand-soft font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <span>Point it at the QR code and tap the link.</span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground font-medium">
            <span className="size-5 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/30 text-brand dark:text-brand-soft font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <span>
              Tap <strong className="font-semibold text-foreground">Save</strong> in Google Wallet on your phone.
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center font-medium">
          This pass link is unique to your Nile University student account.
        </p>
      </ModalBody>

      <ModalFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
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
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
