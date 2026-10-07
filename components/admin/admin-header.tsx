"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const closeDrawer = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isMobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen]);

  // Focus management: trap focus & restore to trigger button on close
  useEffect(() => {
    if (!isMobileOpen) return;

    const previouslyFocused = triggerRef.current;

    // Focus the first focusable element inside drawer or the drawer container
    const timer = requestAnimationFrame(() => {
      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      } else {
        drawerRef.current?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isMobileOpen, closeDrawer]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b-2 border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 sm:px-6 backdrop-blur-md transition-colors">
        {/* Left: Mobile hamburger & breadcrumb/title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-foreground hover:bg-muted border border-border transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0"
            aria-label="Open sidebar menu"
            aria-expanded={isMobileOpen}
            aria-controls="admin-mobile-drawer"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-black text-charcoal dark:text-white truncate">
              SU Card Manager
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & User Navigation Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <UserNavDropdown user={user} areas={areas} currentArea="admin" />
        </div>
      </header>

      {/* Mobile Sidebar Slide-over Drawer */}
      {isMobileOpen && (
        <div
          id="admin-mobile-drawer"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200 motion-reduce:animate-none"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 outline-none animate-in slide-in-from-left-full duration-300 motion-reduce:animate-none"
          >
            <AdminSidebar
              role={user.role}
              isMobile
              onCloseMobile={closeDrawer}
            />
          </div>
        </div>
      )}
    </>
  );
}
