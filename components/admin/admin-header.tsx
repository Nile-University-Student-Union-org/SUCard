"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { type StaffUser } from "@/lib/auth/guards";
import type { Area } from "@/lib/student/types";
import { UserNavDropdown } from "@/components/ui/user-nav-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AdminSidebar } from "./admin-sidebar";

interface AdminHeaderProps {
  user: StaffUser;
  areas?: Area[];
}

export function AdminHeader({ user, areas }: AdminHeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b-2 border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 sm:px-6 backdrop-blur-md transition-colors">
        {/* Left: Mobile hamburger & breadcrumb/title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-foreground hover:bg-muted border border-border transition-all active:scale-95 cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-charcoal dark:text-white truncate">
              SU Card Manager
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & User Navigation Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <UserNavDropdown user={user} areas={areas} currentArea="admin" />
        </div>
      </header>

      {/* Mobile Sidebar Slide-over Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] shadow-2xl z-50 animate-in slide-in-from-left-full duration-300">
            <AdminSidebar
              role={user.role}
              isMobile
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
