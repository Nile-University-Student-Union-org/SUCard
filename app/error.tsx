"use client";

import React from "react";
import { ErrorView } from "@/components/error-view";

export default function RootError({
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
      title="SOMETHING WENT WRONG"
      description="An unexpected error occurred while loading this page. Please try again."
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
