"use client";

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { UserAvatar } from "./user-avatar";
import { LogoutConfirmModal } from "./logout-confirm-modal";
import {
  ChevronDown,
  ShieldCheck,
  User,
  CreditCard,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "cn";

const emptySubscribe = () => () => {};

export interface UserNavUser {
  id?: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "student" | string;
}

export interface UserNavArea {
  key?: "student" | "admin" | "scanner" | "vendor";
  label: string;
  href: string;
}

interface UserNavDropdownProps {
  user: UserNavUser;
  areas?: UserNavArea[];
  currentArea?: "student" | "admin" | "scanner" | "vendor";
  className?: string;
}

export const UserNavDropdown: React.FC<UserNavDropdownProps> = ({
  user,
  areas,
  currentArea,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: Math.round(rect.bottom + 8),
        right: Math.round(Math.max(16, window.innerWidth - rect.right)),
      });
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, updateCoords]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const isSuperAdmin = user.role === "super_admin";
  const isAdmin = user.role === "admin" || isSuperAdmin;
  const activeArea = currentArea || (typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? "admin" : "student");
  const otherAreas = areas ? areas.filter((a) => (a.key ? a.key !== activeArea : true)) : [];

  const handleSwitchArea = async (area: UserNavArea) => {
    setIsOpen(false);
    if (area.key) {
      try {
        const res = await fetch("/api/me/area", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: area.key }),
        });
        if (res.ok) {
          const data = (await res.json()) as { href: string };
          window.location.assign(data.href || area.href);
          return;
        }
      } catch {
        // Fallback to direct navigation
      }
    }
    window.location.assign(area.href);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User account menu for ${user.name}`}
        className={cn(
          "flex items-center gap-2.5 p-1 sm:pr-3 rounded-2xl hover:bg-muted/60 active:bg-muted/60 transition-all duration-200 min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.96]",
          isOpen && "bg-brand/10 dark:bg-brand/15"
        )}
      >
        <UserAvatar
          name={user.name}
          size={32}
          shape="rounded"
          className="border border-border shrink-0 transition-transform duration-200"
        />

        <div className="hidden sm:flex flex-col text-left max-w-[130px] md:max-w-[150px]">
          <span className="text-xs font-black text-foreground truncate leading-tight">
            {firstName}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground truncate">
            {isSuperAdmin
              ? "Super admin"
              : user.role === "admin"
              ? "Admin"
              : user.role === "cashier"
              ? "Cashier"
              : user.role === "vendor_manager"
              ? "Vendor manager"
              : "Student"}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0",
            isOpen && "rotate-180 text-brand dark:text-brand-soft"
          )}
        />
      </button>

      {/* Portaled Dropdown Menu */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          role="menu"
          aria-label="User Account Options"
          className="fixed z-[65] w-80 sm:w-84 rounded-2xl border border-slate-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right text-foreground max-h-[calc(100vh-80px)] overflow-y-auto overscroll-contain no-scrollbar"
          style={{
            top: `${coords.top}px`,
            right: `${coords.right}px`,
          }}
        >
          {/* 1. Account Header Card */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/80 space-y-2">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={user.name}
                size={40}
                shape="rounded"
                className="border-2 border-brand/40 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-foreground truncate">{user.name}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                <div className="pt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border",
                      isSuperAdmin
                        ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-soft border-brand/30"
                        : user.role === "admin"
                        ? "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/30"
                        : user.role === "cashier"
                        ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30"
                        : user.role === "vendor_manager"
                        ? "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/30"
                        : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30"
                    )}
                  >
                    {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                    <span>
                      {isSuperAdmin
                        ? "Super Admin"
                        : user.role === "admin"
                        ? "Admin"
                        : user.role === "cashier"
                        ? "Cashier"
                        : user.role === "vendor_manager"
                        ? "Vendor Manager"
                        : "Student"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Menu Navigation Links */}
          <div className="space-y-0.5 pt-1 border-t border-border">
            {activeArea === "admin" ? (
              <>
                <Link
                  href="/admin/account"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted hover:translate-x-1 active:scale-[0.98] transition-all min-h-[44px] cursor-pointer group"
                >
                  <User className="w-4 h-4 text-brand dark:text-brand-soft group-hover:scale-110 transition-transform duration-200" />
                  <span className="flex-1">My account</span>
                </Link>

                <Link
                  href="/admin/cards"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted hover:translate-x-1 active:scale-[0.98] transition-all min-h-[44px] cursor-pointer group"
                >
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                  <span className="flex-1">Cards management</span>
                </Link>
              </>
            ) : (
              <Link
                href="/card"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted hover:translate-x-1 active:scale-[0.98] transition-all min-h-[44px] cursor-pointer group"
              >
                <CreditCard className="w-4 h-4 text-brand dark:text-brand-soft group-hover:scale-110 transition-transform duration-200" />
                <span className="flex-1">My SU Card</span>
              </Link>
            )}
          </div>

          {/* 3. Switch to Area Section (conditional when >1 area) */}
          {otherAreas.length > 0 && (
            <div className="pt-1 border-t border-border space-y-0.5">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Switch to
              </div>
              {otherAreas.map((area) => {
                const isCardArea =
                  area.key === "student" ||
                  area.label.toLowerCase().includes("card");
                return (
                  <button
                    key={area.href}
                    type="button"
                    onClick={() => handleSwitchArea(area)}
                    role="menuitem"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted hover:translate-x-1 active:scale-[0.98] transition-all min-h-[44px] cursor-pointer text-left group"
                  >
                    {isCardArea ? (
                      <CreditCard className="w-4 h-4 text-brand dark:text-brand-soft group-hover:scale-110 transition-transform duration-200 shrink-0" />
                    ) : (
                      <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-200 shrink-0" />
                    )}
                    <span className="flex-1">{area.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 5. Sign Out Footer Action */}
          <div className="pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsLogoutModalOpen(true);
              }}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 hover:translate-x-1 active:scale-[0.98] transition-all min-h-[44px] cursor-pointer text-left group"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-200" />
              <span>Sign out</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        user={user}
        isAdmin={isAdmin}
        redirectTo="/login"
      />
    </div>
  );
};
