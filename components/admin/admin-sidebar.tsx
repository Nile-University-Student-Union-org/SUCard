"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  GraduationCap,
  Store,
  Tag,
  QrCode,
  Users,
  ScrollText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
}

interface NavGroup {
  label?: string;
  superAdminOnly?: boolean;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        soon: true,
      },
    ],
  },
  {
    label: "Cards",
    items: [
      {
        title: "Cards",
        href: "/admin/cards",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Members",
    items: [
      {
        title: "Students",
        icon: GraduationCap,
        soon: true,
      },
      {
        title: "Vendors",
        icon: Store,
        soon: true,
      },
      {
        title: "Offers",
        icon: Tag,
        soon: true,
      },
    ],
  },
  {
    label: "Design",
    items: [
      {
        title: "QR Studio",
        icon: QrCode,
        soon: true,
      },
    ],
  },
  {
    label: "Administration",
    superAdminOnly: true,
    items: [
      {
        title: "Staff",
        href: "/admin/staff",
        icon: Users,
      },
      {
        title: "Audit log",
        href: "/admin/audit",
        icon: ScrollText,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        icon: Settings,
        soon: true,
      },
    ],
  },
];

interface AdminSidebarProps {
  role?: string;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({ role = "admin", onCloseMobile, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = role === "super_admin";

  return (
    <aside className="flex flex-col h-full w-64 bg-[#0F3056] text-white border-r border-[#0A2240] select-none shadow-xl">
      {/* Sidebar Header & Brand */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <Link
          href="/admin/cards"
          className="flex items-center gap-3 focus-visible:outline-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
        >
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="SU Card Logo"
            width={140}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Union Badge */}
      <div className="px-6 py-3 border-b border-white/10 bg-[#0A2240]/60">
        <div className="flex items-center justify-between text-xs text-white/80">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-sky-200">
            {isSuperAdmin ? "Super Admin Portal" : "Staff Portal"}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-300 font-semibold">
            <span className="size-1.5 rounded-full bg-[#018BCE] animate-pulse" />
            2026/27
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar" aria-label="Admin Navigation">
        {navGroups.map((group) => {
          if (group.superAdminOnly && !isSuperAdmin) {
            return null;
          }

          return (
            <div key={group.label || "default"} className="space-y-1">
              {group.label && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200/60">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isItemActive = item.href ? pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) : false;
                const Icon = item.icon;

                if (item.soon || !item.href) {
                  return (
                    <div
                      key={item.title}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-white/40 cursor-not-allowed transition-colors"
                      aria-disabled="true"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-white/30 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[9px] bg-white/10 text-white/50 border-none font-bold uppercase"
                      >
                        Soon
                      </Badge>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group min-h-[40px] cursor-pointer",
                      isItemActive
                        ? "bg-[#018BCE] text-white shadow-sm font-extrabold"
                        : "text-white/80 hover:text-white hover:bg-white/10 active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isItemActive ? "text-white" : "text-white/70 group-hover:text-white"
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                    {isItemActive && (
                      <span className="size-1.5 rounded-full bg-white shrink-0" aria-hidden="true" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-white/10 bg-[#0A2240]/40 text-xs text-white/60 space-y-1">
        <p className="text-[11px] font-bold text-white/80 uppercase tracking-wide">
          Nile University Student Union
        </p>
        <p className="text-[10px] leading-tight text-white/45">
          SU Card Management &bull; 2026/2027
        </p>
      </div>
    </aside>
  );
}
