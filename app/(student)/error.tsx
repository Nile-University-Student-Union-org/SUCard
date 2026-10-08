"use client";

import React from "react";
import { ErrorView } from "@/components/error-view";

export default function StudentError({
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
      title="STUDENT PORTAL ERROR"
      description="We couldn't load your student membership data right now. Please try reloading or head back to your card."
      homeHref="/card"
      homeLabel="View card"
      portalName="Student Card"
    />
  );
}
