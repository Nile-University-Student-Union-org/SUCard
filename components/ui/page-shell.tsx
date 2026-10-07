"use client";

import React from "react";
import { cn } from "cn";

export interface PageShellProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  mainClassName?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  header,
  children,
  footer,
  className,
  mainClassName,
}) => {
  return (
    <div className={cn("min-h-dvh flex flex-col bg-background text-foreground transition-colors", className)}>
      {header}
      <main className={cn("flex-1 flex flex-col", mainClassName)}>
        {children}
      </main>
      {footer}
    </div>
  );
};
