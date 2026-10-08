"use client";

import React from "react";
import { ErrorView } from "@/components/error-view";

export default function VendorError({
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
      title="VENDOR PORTAL ERROR"
      description="An error occurred while loading vendor partner tools or offers. Try reloading the page."
      homeHref="/vendor"
      homeLabel="Vendor dashboard"
      portalName="Partner Portal"
    />
  );
}
