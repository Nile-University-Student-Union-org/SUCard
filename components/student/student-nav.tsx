"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Tag, Receipt } from "lucide-react";
import { cn } from "cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Card",
    href: "/card",
    icon: CreditCard,
  },
  {
    label: "Deals",
    href: "/deals",
    icon: Tag,
  },
  {
    label: "History",
    href: "/history",
    icon: Receipt,
  },
];

export function StudentDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-1.5" aria-label="Student Navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/card"
            ? pathname === "/card" || pathname === "/welcome" || pathname.startsWith("/card/")
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px]",
              isActive
                ? "bg-brand text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function StudentMobileBottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on welcome flow
  if (pathname === "/welcome") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-slate-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/card"
              ? pathname === "/card" || pathname.startsWith("/card/")
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl min-h-[48px] min-w-[64px] transition-all motion-reduce:transition-none motion-reduce:transform-none relative",
                isActive
                  ? "text-brand dark:text-brand-soft font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform motion-reduce:transition-none motion-reduce:transform-none",
                  isActive ? "scale-110 stroke-[2.5]" : "stroke-[2]"
                )}
              />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span
                  className="size-1 rounded-full bg-brand dark:bg-brand-soft absolute bottom-0.5"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
