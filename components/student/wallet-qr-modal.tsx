"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Smartphone } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/**
 * Desktop "Add to Google Wallet": shows the save link as a QR to scan with the phone,
 * since Google Wallet lives on the phone, not the computer.
 */
export function WalletQrModal({ saveUrl, onClose }: { saveUrl: string | null; onClose: () => void }) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!saveUrl) return;
    let cancelled = false;
    QRCode.toString(saveUrl, { type: "svg", errorCorrectionLevel: "L", margin: 2, color: { dark: "#000000", light: "#FFFFFF" } })
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

  return (
    <Modal
      isOpen={!!saveUrl}
      onClose={onClose}
      title="Add to Google Wallet"
      description="Scan this code with your phone's camera to save your SU Card to Google Wallet."
      icon={<Smartphone className="size-5" />}
      maxWidth="md"
    >
      <ModalBody className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-white p-3 shadow-md border-2 border-slate-200 dark:border-zinc-700">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL
            <img src={qrSrc} alt="QR code that opens Google Wallet on your phone" width={272} height={272} className="size-[272px]" />
          ) : (
            <div className="size-[272px] animate-pulse rounded-lg bg-slate-100" aria-hidden="true" />
          )}
        </div>
        <ol className="w-full max-w-xs space-y-1.5 text-sm text-ash dark:text-zinc-400 list-decimal pl-5">
          <li>Open the camera on your Android phone.</li>
          <li>Point it at the code and tap the link.</li>
          <li>Tap <span className="font-semibold text-charcoal dark:text-white">Save</span> in Google Wallet.</li>
        </ol>
        <p className="text-xs text-ash dark:text-zinc-500 text-center">This code is just for you — don&apos;t share it.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => saveUrl && window.open(saveUrl, "_blank", "noopener,noreferrer")}>
          <ExternalLink className="size-4" />
          Open on this computer
        </Button>
        <Button onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  );
}
