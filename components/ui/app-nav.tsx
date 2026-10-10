"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, ArrowRight, LogOut } from "lucide-react";
import { cn } from "cn";
import { executeThemeTransition, prewarmThemePipeline } from "@/components/ui/theme-beam";
import {
  UserNavDropdown,
  type UserNavUser,
  type UserNavArea,
} from "@/components/ui/user-nav-dropdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import { toast } from "sonner";

const emptySubscribe = () => () => {};

export interface AppNavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

export interface AppNavProps {
  items: AppNavItem[];
  homeHref?: string;
  brandSubtitle?: string;
  brandContext?: React.ReactNode;
  mobileBrandContext?: React.ReactNode;
  user?: UserNavUser | null;
  areas?: UserNavArea[];
  currentArea?: "student" | "scanner" | "admin" | "vendor" | string;
  rightSlot?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function AppNav({
  items,
  homeHref = "/card",
  brandSubtitle = "Student Union",
  brandContext,
  mobileBrandContext,
  user,
  areas = [],
  currentArea = "student",
  rightSlot,
  className,
  ariaLabel = "Main Navigation",
}: AppNavProps) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { resolvedTheme, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== "undefined") {
      return window.scrollY > 20;
    }
    return false;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRect, setHoveredRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  } | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);


  const isDark = mounted ? resolvedTheme === "dark" : false;


  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Pre-warm the GPU clip-path pipeline so the first theme toggle doesn't stutter
  useEffect(() => {
    prewarmThemePipeline();
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Click outside and Escape key listener for mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  const handleLinkMouseEnter = (index: number) => {
    const el = linkRefs.current[index];
    if (el) {
      setHoveredRect({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        opacity: 1,
      });
    }
  };

  const handleNavMouseLeave = () => {
    setHoveredRect((prev) => (prev ? { ...prev, opacity: 0 } : null));
  };

  const handleLinkClick = (index: number, item: AppNavItem) => {
    setClickedIndex(index);
    item.onClick?.();
    setTimeout(() => {
      setClickedIndex(null);
    }, 450);
  };

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? "light" : "dark";
    executeThemeTransition(nextTheme, setTheme, e);
  };

  const isItemActive = (item: AppNavItem): boolean => {
    if (item.active !== undefined) {
      return item.active;
    }
    if (!item.href) return false;
    if (item.href === "/card") {
      return pathname === "/card" || pathname === "/welcome" || pathname.startsWith("/card/");
    }
    return pathname.startsWith(item.href);
  };

  const otherAreas = areas.filter((a) => (a.key ? a.key !== currentArea : true));

  const handleSwitchArea = async (area: UserNavArea) => {
    setMobileOpen(false);
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
        toast.error(`Couldn't save preferred area. Continuing to ${area.label}…`);
      } catch {
        toast.error(`Couldn't save preferred area. Continuing to ${area.label}…`);
      }
    }
    window.location.assign(area.href);
  };

  return (
    <>
      <style>{`
        .su-liquid-glass-bar {
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      border-radius 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .su-liquid-glass-bar-dark {
          background: rgba(3, 7, 18, 0.68);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.28),
            0 20px 48px -15px rgba(0, 0, 0, 0.85);
        }
        .su-liquid-glass-bar-dark.su-liquid-glass-bar-scrolled {
          background: rgba(3, 7, 18, 0.90);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.20),
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.38),
            0 24px 52px -16px rgba(0, 0, 0, 0.95);
        }
        .su-liquid-glass-bar-light {
          background: rgba(255, 255, 255, 0.76);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.85),
            inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.98),
            0 16px 36px -18px rgba(15, 48, 86, 0.16);
        }
        .su-liquid-glass-bar-light.su-liquid-glass-bar-scrolled {
          background: rgba(255, 255, 255, 0.88);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.95),
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 1),
            0 22px 48px -16px rgba(15, 48, 86, 0.22);
        }
        @keyframes su-specular-sweep {
          0% { transform: translate3d(-100%, 0, 0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate3d(100%, 0, 0); opacity: 0; }
        }
        @keyframes su-rim-flash {
          0% { opacity: 0; }
          35% { opacity: 0.9; }
          65% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes su-nav-click-burst {
          0% { transform: scale(1); }
          25% { transform: scale(0.92); }
          55% { transform: scale(1.06); }
          80% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes su-nav-click-ripple {
          0% { transform: scale(0.8); opacity: 0.9; box-shadow: 0 0 0 0 rgba(45, 177, 250, 0.7); }
          50% { transform: scale(1.12); opacity: 0.5; box-shadow: 0 0 16px 4px rgba(45, 177, 250, 0.4); }
          100% { transform: scale(1.28); opacity: 0; box-shadow: 0 0 24px 8px rgba(45, 177, 250, 0); }
        }
        @keyframes su-nav-click-glint {
          0% { opacity: 0.8; transform: translateX(-100%); }
          100% { opacity: 0; transform: translateX(100%); }
        }
        @keyframes su-icon-spring-pop {
          0% { transform: scale(0.82) rotate(-30deg); opacity: 0.5; }
          50% { transform: scale(1.2) rotate(190deg); opacity: 1; }
          75% { transform: scale(0.95) rotate(320deg); }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        .su-animate-specular-sweep {
          animation: su-specular-sweep 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform;
          transform: translateZ(0);
        }
        .su-animate-rim-flash {
          animation: su-rim-flash 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: opacity;
          transform: translateZ(0);
        }
        .su-animate-nav-click-burst {
          animation: su-nav-click-burst 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
        }
        .su-animate-nav-click-ripple {
          animation: su-nav-click-ripple 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
        .su-animate-nav-click-glint {
          animation: su-nav-click-glint 0.35s ease-out forwards;
          will-change: transform, opacity;
        }
        .su-animate-icon-pop {
          animation: su-icon-spring-pop 0.48s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .su-liquid-glass-bar {
            transition: none !important;
          }
          .su-animate-nav-click-burst,
          .su-animate-nav-click-ripple,
          .su-animate-nav-click-glint,
          .su-animate-specular-sweep,
          .su-animate-rim-flash,
          .su-animate-icon-pop {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className={cn(
          "fixed inset-x-0 z-50 px-3.5 sm:px-6 pointer-events-none transition-[top] duration-200 ease-out pt-[env(safe-area-inset-top,0px)] motion-reduce:transition-none",
          isScrolled ? "top-2 sm:top-3.5" : "top-3 sm:top-5",
          className
        )}
      >
        <header
          className={cn(
            "pointer-events-auto relative mx-auto w-full max-w-[820px] su-liquid-glass-bar",
            isDark
              ? cn(
                  "su-liquid-glass-bar-dark",
                  isScrolled && "su-liquid-glass-bar-scrolled scale-[0.99]"
                )
              : cn(
                  "su-liquid-glass-bar-light",
                  isScrolled && "su-liquid-glass-bar-scrolled scale-[0.99]"
                ),
            mobileOpen ? "rounded-3xl shadow-2xl" : "rounded-[28px] sm:rounded-full"
          )}
        >
          {/* Main Bar Container */}
          <div className="flex items-center justify-between gap-2.5 sm:gap-4 p-1.5 sm:p-2">
            {/* Brand + Context Slot */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={homeHref}
                className="group flex items-center gap-2.5 pl-3 pr-2 py-1 rounded-full transition-transform duration-200 active:scale-95 select-none cursor-pointer min-h-[44px] shrink-0"
                aria-label="NUSU Student Union"
              >
                <div className="relative flex items-center justify-center shrink-0 w-7 h-7">
                  <Image
                    src="/brand/su-icon-color.png"
                    alt="NUSU"
                    width={28}
                    height={28}
                    className={cn(
                      "h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-rotate-2",
                      isDark ? "hidden" : "block"
                    )}
                    priority
                  />
                  <Image
                    src="/brand/su-icon-white@hd.png"
                    alt="NUSU"
                    width={28}
                    height={28}
                    className={cn(
                      "h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-rotate-2",
                      isDark ? "block" : "hidden"
                    )}
                    priority
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span
                    className={cn(
                      "font-extrabold text-[15px] sm:text-[16px] tracking-tight transition-colors duration-200",
                      isDark
                        ? "text-white group-hover:text-white/90"
                        : "text-[#0F3056] group-hover:text-[#018BCE]"
                    )}
                  >
                    NUSU
                  </span>
                  <span
                    className={cn(
                      "text-[8px] font-bold tracking-[0.24em] uppercase mt-0.5 transition-colors duration-200",
                      isDark ? "text-white/90" : "text-[#018BCE]"
                    )}
                  >
                    {brandSubtitle}
                  </span>
                </div>
              </Link>

              {/* Optional Brand Context (e.g. Vendor name + branch on desktop) */}
              {brandContext && (
                <div className="hidden sm:flex items-center min-w-0">
                  {brandContext}
                </div>
              )}
            </div>

            {/* Desktop Nav Links: Stationary Liquid Glass with Fluid Sliding Hover Pill */}
            {items.length > 0 && (
              <nav
                onMouseLeave={handleNavMouseLeave}
                className={cn(
                  "relative hidden md:flex items-center gap-1 p-1 rounded-full transition-colors duration-300 ml-auto",
                  isDark
                    ? "bg-white/[0.08] ring-1 ring-white/15"
                    : "bg-[#0F3056]/[0.04] ring-1 ring-[#0F3056]/[0.06]"
                )}
                aria-label={ariaLabel}
              >
                {/* Fluid Sliding Hover Pill */}
                {hoveredRect && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                      isDark
                        ? "bg-white/15 ring-1 ring-white/20 shadow-[0_2px_12px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                        : "bg-white/85 ring-1 ring-[#0F3056]/10 shadow-[0_2px_8px_rgba(15,48,86,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]"
                    )}
                    style={{
                      left: `${hoveredRect.left}px`,
                      top: `${hoveredRect.top}px`,
                      width: `${hoveredRect.width}px`,
                      height: `${hoveredRect.height}px`,
                      opacity: hoveredRect.opacity,
                      transform: hoveredRect.opacity === 0 ? "scale(0.95)" : "scale(1)",
                    }}
                  />
                )}

                {items.map((item, index) => {
                  const active = isItemActive(item);
                  const isClicked = clickedIndex === index;
                  const itemKey = item.href || item.label;

                  const commonClasses = cn(
                    "relative min-h-[34px] px-4 flex items-center justify-center rounded-full text-[13.5px] font-semibold transition-colors duration-200 cursor-pointer select-none z-10",
                    isClicked && "su-animate-nav-click-burst",
                    active
                      ? isDark
                        ? "bg-white/20 text-white shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-white/30"
                        : "bg-white text-[#0F3056] shadow-[0_2px_8px_rgba(15,48,86,0.08),inset_0_1px_1px_rgba(255,255,255,1)] ring-1 ring-black/[0.05]"
                      : isDark
                      ? "text-white/75 hover:text-white"
                      : "text-[#0F3056]/70 hover:text-[#0F3056]"
                  );

                  const content = (
                    <>
                      {/* Click Ripple Effect */}
                      {isClicked && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full su-animate-nav-click-ripple pointer-events-none ring-2 ring-[#018BCE]/60"
                        />
                      )}
                      {/* Click Specular Glint */}
                      {isClicked && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent su-animate-nav-click-glint" />
                        </span>
                      )}
                      <span
                        className="relative z-10 cursor-pointer transform-gpu"
                        style={{ transform: "translateZ(0)" }}
                      >
                        {item.label}
                      </span>
                    </>
                  );

                  if (item.href) {
                    return (
                      <Link
                        key={itemKey}
                        ref={(el) => {
                          linkRefs.current[index] = el;
                        }}
                        onMouseEnter={() => handleLinkMouseEnter(index)}
                        onClick={() => handleLinkClick(index, item)}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={commonClasses}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={itemKey}
                      type="button"
                      ref={(el) => {
                        linkRefs.current[index] = el;
                      }}
                      onMouseEnter={() => handleLinkMouseEnter(index)}
                      onClick={() => handleLinkClick(index, item)}
                      aria-current={active ? "page" : undefined}
                      className={commonClasses}
                    >
                      {content}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Action Island: Extra Actions + Theme Toggle + User Menu + Mobile Menu Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Tool group: extra actions + theme toggle share one quiet pill instead of separate grey circles */}
              <div
                className={cn(
                  "flex items-center gap-0.5 rounded-full p-0.5",
                  isDark ? "bg-white/[0.08] ring-1 ring-white/15" : "bg-[#0F3056]/[0.04] ring-1 ring-black/[0.06]"
                )}
              >
              {/* Extra Right Actions Slot (e.g. Sound toggle, online status) */}
              {rightSlot}

              {/* Theme Toggle Button */}
              <button
                type="button"
                data-theme-toggle
                onClick={handleToggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={cn(
                  "group/theme relative size-10 rounded-full flex items-center justify-center transition-[transform,background-color,color] duration-200 ease-out cursor-pointer active:scale-90 motion-reduce:transition-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isDark ? "hover:bg-white/15" : "hover:bg-white hover:shadow-xs"
                )}
              >
                {isDark ? (
                  <Sun
                    size={15}
                    strokeWidth={2.2}
                    className={cn(
                      "transition-transform duration-300 group-hover/theme:rotate-45 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.45)]"
                    )}
                  />
                ) : (
                  <Moon
                    size={15}
                    strokeWidth={2.2}
                    className={cn(
                      "transition-transform duration-300 group-hover/theme:-rotate-12",
                      "text-[#0F3056] group-hover/theme:text-[#018BCE]"
                    )}
                  />
                )}
              </button>

              </div>

              {/* Desktop User Menu Dropdown */}
              {user && (
                <div className="hidden md:flex items-center">
                  <UserNavDropdown
                    user={user}
                    areas={areas}
                    currentArea={currentArea as "student" | "scanner" | "admin" | "vendor"}
                  />
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  "md:hidden relative size-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center active:scale-90 transition-[transform,background-color,color] duration-150 ease-out motion-reduce:transition-none cursor-pointer",
                  isDark
                    ? "bg-white/15 hover:bg-white/25 ring-1 ring-white/25 text-white"
                    : "bg-white/60 hover:bg-white/90 ring-1 ring-black/[0.06] text-[#0F3056]"
                )}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                <div className="w-4 h-3 flex flex-col justify-between items-center relative pointer-events-none">
                  <span
                    className={cn(
                      "w-4 h-0.5 rounded-full transition-transform duration-200 ease-out origin-center motion-reduce:transition-none",
                      isDark ? "bg-white" : "bg-[#0F3056]",
                      mobileOpen && "translate-y-[5px] rotate-45"
                    )}
                  />
                  <span
                    className={cn(
                      "w-4 h-0.5 rounded-full transition-opacity duration-200 ease-out motion-reduce:transition-none",
                      isDark ? "bg-white" : "bg-[#0F3056]",
                      mobileOpen && "opacity-0"
                    )}
                  />
                  <span
                    className={cn(
                      "w-4 h-0.5 rounded-full transition-transform duration-200 ease-out origin-center motion-reduce:transition-none",
                      isDark ? "bg-white" : "bg-[#0F3056]",
                      mobileOpen && "-translate-y-[5px] -rotate-45"
                    )}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Expanded Menu Dropdown */}
          <div
            className={cn(
              "md:hidden grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
              mobileOpen
                ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 pointer-events-none"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="px-3.5 pb-4 pt-1">
                {/* Mobile Context / Vendor Card (if provided) */}
                {mobileBrandContext && (
                  <div className="mb-2">
                    {mobileBrandContext}
                  </div>
                )}

                <div
                  className={cn(
                    "h-px w-full mb-3",
                    isDark ? "bg-white/15" : "bg-[#0F3056]/10"
                  )}
                />

                {/* Mobile Nav Items */}
                {items.length > 0 && (
                  <nav className="flex flex-col gap-1.5" aria-label={`Mobile ${ariaLabel}`}>
                    {items.map((item, idx) => {
                      const active = isItemActive(item);
                      const Icon = item.icon;
                      const itemKey = item.href || item.label;

                      const itemClasses = cn(
                        "min-h-[44px] px-4 flex items-center justify-between rounded-xl text-[14px] font-medium transition-[transform,background-color,color] duration-140 ease-out active:scale-[0.97] motion-reduce:transition-none w-full text-left",
                        mobileOpen && "animate-fade-up",
                        mobileOpen && idx === 0 && "stagger-1",
                        mobileOpen && idx === 1 && "stagger-2",
                        mobileOpen && idx === 2 && "stagger-3",
                        active
                          ? isDark
                            ? "bg-white/20 text-white font-bold shadow-xs ring-1 ring-white/20"
                            : "bg-white/95 text-[#0F3056] font-bold shadow-xs ring-1 ring-black/[0.05]"
                          : isDark
                          ? "text-white/80 hover:text-white hover:bg-white/10"
                          : "text-[#0F3056]/75 hover:text-[#0F3056] hover:bg-black/[0.04]"
                      );

                      const inner = (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon className="size-4 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <ArrowRight
                            className={cn(
                              "size-3.5 transition-transform duration-150 ease-out",
                              active
                                ? isDark
                                  ? "text-white translate-x-0.5"
                                  : "text-[#0F3056] translate-x-0.5"
                                : "opacity-35"
                            )}
                          />
                        </>
                      );

                      if (item.href) {
                        return (
                          <Link
                            key={itemKey}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onClick={() => {
                              setMobileOpen(false);
                              item.onClick?.();
                            }}
                            className={itemClasses}
                          >
                            {inner}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={itemKey}
                          type="button"
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            setMobileOpen(false);
                            item.onClick?.();
                          }}
                          className={itemClasses}
                        >
                          {inner}
                        </button>
                      );
                    })}
                  </nav>
                )}

                {/* User Account Section on Mobile */}
                {user && (
                  <div
                    className={cn(
                      "mt-3 pt-3 border-t flex flex-col gap-2",
                      isDark ? "border-white/15" : "border-[#0F3056]/10"
                    )}
                  >
                    {/* User Info Header */}
                    <div
                      className={cn(
                        "p-2.5 rounded-xl flex items-center justify-between gap-3 border",
                        isDark
                          ? "bg-white/5 border-white/10 text-white"
                          : "bg-black/[0.03] border-black/[0.06] text-[#0F3056]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={user.name} size={32} shape="rounded" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate leading-tight">{user.name}</p>
                          <p
                            className={cn(
                              "text-[10px] truncate",
                              isDark ? "text-white/60" : "text-muted-foreground"
                            )}
                          >
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-semibold shrink-0 border",
                          isDark
                            ? "bg-white/15 text-white border-white/20"
                            : "bg-[#0F3056]/10 text-[#0F3056] border-[#0F3056]/20"
                        )}
                      >
                        {user.role === "super_admin"
                          ? "Super Admin"
                          : user.role === "admin"
                          ? "Admin"
                          : user.role === "cashier"
                          ? "Cashier"
                          : user.role === "vendor_manager"
                          ? "Vendor Manager"
                          : "Student"}
                      </span>
                    </div>

                    {/* Switch Area Links (if any) */}
                    {otherAreas.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1">
                        {otherAreas.map((area) => (
                          <button
                            key={area.href}
                            type="button"
                            onClick={() => handleSwitchArea(area)}
                            className={cn(
                              "min-h-[44px] flex items-center justify-between w-full px-3.5 rounded-xl text-xs font-semibold transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none cursor-pointer text-left",
                              isDark
                                ? "bg-white/10 hover:bg-white/15 text-white ring-1 ring-white/15"
                                : "bg-white/80 hover:bg-white text-[#0F3056] ring-1 ring-black/[0.06]"
                            )}
                          >
                            <span>{area.label}</span>
                            <ArrowRight className="size-3.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Sign Out Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className={cn(
                        "min-h-[44px] flex items-center justify-between w-full px-3.5 rounded-xl text-xs font-semibold transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none cursor-pointer text-left",
                        "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="size-4 text-rose-600 dark:text-rose-400" />
                        <span>Sign out</span>
                      </div>
                      <ArrowRight className="size-3.5 text-rose-600 dark:text-rose-400 opacity-60" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Logout Confirmation Modal */}
      {user && (
        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          user={user}
          isAdmin={user.role === "admin" || user.role === "super_admin"}
          redirectTo="/login"
        />
      )}
    </>
  );
}
