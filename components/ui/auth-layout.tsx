"use client";

import React from "react";
import { AmbientBackdrop } from "./ambient-backdrop";
import { AuthHeader } from "./auth-header";
import { cn } from "cn";

export interface AuthLayoutProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  onBackClick?: () => void;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  className?: string;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  backHref = "/",
  backLabel = "Back",
  onBackClick,
  headerContent,
  footerContent,
  maxWidth = "md",
  className,
}) => {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-foreground isolate flex flex-col justify-between selection:bg-brand selection:text-white relative">
      <AmbientBackdrop />

      {/* Top Header Bar */}
      <AuthHeader
        backHref={backHref}
        backLabel={backLabel}
        onBackClick={onBackClick}
      >
        {headerContent}
      </AuthHeader>

      {/* Main Content Slot */}
      <main className="flex-1 min-w-0 flex items-center justify-center px-4 py-6 sm:py-10 z-10">
        <div className={cn("w-full min-w-0 [overflow-wrap:anywhere]", maxWidthMap[maxWidth], className)}>
          {children}
        </div>
      </main>

      {/* Structured Footer */}
      {footerContent !== undefined ? (
        <footer className="w-full mt-auto py-3.5 sm:py-4 px-4 sm:px-6 text-xs text-ash dark:text-zinc-500 border-t border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 pb-safe">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
            <div className="text-center sm:text-left">
              {footerContent}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 text-[11px] font-medium text-ash dark:text-zinc-400">
              <span>Nile University Student Union</span>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="w-full mt-auto py-3.5 sm:py-4 px-4 sm:px-6 text-xs text-ash dark:text-zinc-500 border-t border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 pb-safe">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
            <div className="text-center sm:text-left text-xs text-muted-foreground font-medium">
              SU Card &copy; {new Date().getFullYear()} Nile University Student Union
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-ash dark:text-zinc-400">
              <span>NUSU Admin Console</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
