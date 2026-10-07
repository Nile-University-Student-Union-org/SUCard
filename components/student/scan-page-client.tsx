"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, CreditCard, ScanLine, MapPin } from "lucide-react";
import { CardScanner } from "./card-scanner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ScanPageClient() {
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="w-full space-y-4 my-auto max-w-lg mx-auto">
      {/* Back to Card Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/card"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-ash dark:text-zinc-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px]"
          aria-label="Return to Card"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Card</span>
        </Link>
      </div>

      {/* Main Activation Card */}
      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="p-6 sm:p-8 text-center space-y-3 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto shadow-xs">
            <QrCode className="size-7" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-charcoal dark:text-white leading-tight">
              LINK PHYSICAL CARD
            </h1>
            <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium max-w-sm mx-auto mt-1">
              Scan the QR code on the back of your physical membership card to link and activate it.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
          {/* Quick Steps Guide */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ash dark:text-zinc-400 block">
              How to activate
            </span>
            <div className="space-y-2.5 text-xs sm:text-sm text-foreground">
              <div className="flex items-start gap-2.5">
                <CreditCard className="size-4 text-brand dark:text-brand-soft shrink-0 mt-0.5" />
                <span>Turn your physical SU Card over to see the activation QR code.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ScanLine className="size-4 text-brand dark:text-brand-soft shrink-0 mt-0.5" />
                <span>Point your phone camera to scan and activate instantly.</span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="size-4 text-ash dark:text-zinc-400 shrink-0 mt-0.5" />
                <span>Haven&apos;t received your card? Visit the SU office to collect it.</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsScannerOpen(true)}
            className="w-full font-bold normal-case min-h-[48px] text-sm sm:text-base shadow-xs"
          >
            <QrCode className="size-4 mr-2" />
            Open Camera Scanner
          </Button>
        </CardContent>
      </Card>

      {/* Camera Scanner Modal */}
      <CardScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => {
          setIsScannerOpen(false);
          router.push("/card");
        }}
      />
    </div>
  );
}
