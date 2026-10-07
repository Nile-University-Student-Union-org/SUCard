import React from "react";

export function AmbientBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
    >
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand/10 dark:bg-brand/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand/10 dark:bg-brand-soft/10 blur-3xl" />
    </div>
  );
}
