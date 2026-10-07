"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode } from "lucide-react";
import { CardScanner } from "./card-scanner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ScanPageClient() {
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(true);

  return (
    <div className="w-full space-y-4 my-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/card"
          className="inline-flex items-center gap-2 text-xs font-bold text-ash dark:text-zinc-400 hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Card</span>
        </Link>
      </div>

      <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="p-6 text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto shadow-xs">
            <QrCode className="size-7" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-charcoal dark:text-white">
            LINK YOUR SU CARD
          </h1>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium max-w-xs mx-auto">
            Scan the QR code on the back of your physical membership card to link it to your account.
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto font-bold normal-case min-h-[48px]"
          >
            Open Camera Scanner
          </Button>
        </CardContent>
      </Card>

      <CardScanner
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          router.push("/card");
        }}
        onSuccess={() => {
          router.push("/card");
        }}
      />
    </div>
  );
}
