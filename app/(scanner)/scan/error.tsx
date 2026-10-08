"use client";

import React from "react";
import { ErrorView } from "@/components/error-view";

export default function ScannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      error={error}
      reset={reset}
      title="SCANNER ERROR"
      description="An error occurred with the QR scanning engine or camera feed. Try reloading the scanner."
      homeHref="/scan"
      homeLabel="Reload scanner"
      portalName="Cashier Scanner"
    />
  );
}
