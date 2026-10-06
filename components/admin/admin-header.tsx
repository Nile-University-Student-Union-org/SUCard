"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Loader2, ShieldCheck, User } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { type StaffUser } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const roleLabel =
    user.role === "super_admin" ? "Super Admin" : "Admin";

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

        {/* Right: User details & Sign out */}
        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="size-8 rounded-full bg-[#0F3056] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              {user.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <User className="size-4 text-white" />
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-none">
                {user.name}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate max-w-[140px]">
                {user.email}
              </span>
            </div>
            <Badge
              variant={user.role === "super_admin" ? "default" : "secondary"}
              className="hidden sm:inline-flex text-[11px] font-medium h-5 px-2 bg-[#0F3056] text-white"
            >
              {roleLabel}
            </Badge>
          </div>

          <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />

          {/* Sign Out button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-8 gap-1.5 text-xs font-medium border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-colors"
          >
            {isSigningOut ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            <span className="hidden sm:inline">{isSigningOut ? "Signing out…" : "Sign out"}</span>
          </Button>
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
            <AdminSidebar isMobile onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
