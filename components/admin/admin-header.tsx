"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, LogOut, Loader2, ShieldCheck, User } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { type StaffUser } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebar } from "./admin-sidebar";

interface AdminHeaderProps {
  user: StaffUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const roleLabel = user.role === "super_admin" ? "Super Admin" : "Admin";
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: Mobile hamburger & breadcrumb/title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden text-foreground hover:bg-muted"
            aria-label="Open sidebar menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              NUSU Staff
            </span>
            <span className="hidden sm:inline text-muted-foreground/50">/</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#018BCE]" />
              <span className="text-sm font-semibold text-foreground">SU Card Manager</span>
            </div>
          </div>
        </div>

        {/* Right: user menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group flex min-h-11 items-center gap-2.5 rounded-xl border border-transparent py-1.5 pl-1.5 pr-2 text-left transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#018BCE] data-popup-open:border-border data-popup-open:bg-muted/60"
            aria-label={`Account menu for ${user.name}`}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0F548D] to-[#0F3056] text-sm font-semibold text-white ring-2 ring-white shadow-sm">
              {initials || <User className="size-4" />}
            </span>
            <span className="hidden min-w-0 flex-col md:flex">
              <span className="truncate text-sm font-semibold leading-tight text-foreground max-w-[160px]">
                {user.name}
              </span>
              <span className="text-[11px] font-medium leading-tight text-[#018BCE]">{roleLabel}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-popup-open:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
            <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F548D] to-[#0F3056] text-sm font-semibold text-white">
                {initials || <User className="size-4" />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[#0F3056] px-2 py-0.5 text-[10px] font-semibold text-white">
                  <ShieldCheck className="size-3" />
                  {roleLabel}
                </span>
              </span>
            </div>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem
              variant="destructive"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="min-h-10 gap-2 rounded-lg px-3 text-sm font-medium"
            >
              {isSigningOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {isSigningOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <AdminSidebar isMobile onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
