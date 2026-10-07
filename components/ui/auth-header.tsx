"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "cn";

export interface AuthHeaderProps {
  backHref?: string;
  backLabel?: string;
  onBackClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  backHref = "/",
  backLabel = "Back",
  onBackClick,
  className,
  children,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref || "/");
    }
  };

  return (
    <header
      className={cn(
        "w-full z-20 py-4 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex items-center justify-between",
        className
      )}
    >
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-[12px] text-xs font-bold uppercase tracking-wider
                   border-2 border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm
                   text-charcoal dark:text-zinc-200 hover:border-brand/40 dark:hover:border-brand-soft/40 
                   hover:text-brand dark:hover:text-brand-soft active:scale-[0.98] transition-all cursor-pointer select-none"
        aria-label={backLabel}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel}</span>
      </button>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/su-icon-color.png"
            alt="SU Logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain dark:hidden"
          />
          <Image
            src="/brand/su-icon-white@hd.png"
            alt="SU Logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain hidden dark:block"
          />
          <span className="font-heading uppercase text-sm font-bold tracking-wider text-charcoal dark:text-white hidden sm:inline-block">
            SU Card
          </span>
        </Link>
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
};
