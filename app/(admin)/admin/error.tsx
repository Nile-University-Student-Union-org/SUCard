"use client";

import React from "react";
import { ErrorView } from "@/components/error-view";

export default function AdminError({
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
      title="ADMIN CONSOLE ERROR"
      description="An error occurred while communicating with the admin backend services. Try reloading the section or return to the dashboard."
      homeHref="/admin"
      homeLabel="Admin dashboard"
      portalName="Admin Console"
    />
  );
}
