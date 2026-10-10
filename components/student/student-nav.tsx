"use client";

import React from "react";
import { CreditCard, Tag, Receipt } from "lucide-react";
import { AppNav, type AppNavItem } from "@/components/ui/app-nav";
import type { UserNavUser, UserNavArea } from "@/components/ui/user-nav-dropdown";

const STUDENT_NAV_ITEMS: AppNavItem[] = [
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

export interface StudentNavProps {
  user?: UserNavUser | null;
  areas?: UserNavArea[];
  className?: string;
}

export function StudentNav({ user, areas = [], className }: StudentNavProps) {
  return (
    <AppNav
      items={STUDENT_NAV_ITEMS}
      homeHref="/card"
      brandSubtitle="Student Union"
      user={user}
      areas={areas}
      currentArea="student"
      className={className}
      ariaLabel="Student Navigation"
    />
  );
}

// Backward-compatible exports
export function StudentDesktopNav() {
  return null;
}

export function StudentMobileBottomNav() {
  return null;
}
