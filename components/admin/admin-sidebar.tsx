"use client";

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
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  soon?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    soon: true,
  },
  {
    title: "Cards",
    href: "/admin/cards",
    icon: CreditCard,
    active: true,
  },
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
  {
    title: "QR Studio",
    icon: QrCode,
    soon: true,
  },
  {
    title: "Settings",
    icon: Settings,
    soon: true,
  },
];

interface AdminSidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({ onCloseMobile, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-64 bg-[#0F3056] text-white border-r border-[#1D4B80] select-none">
      {/* Sidebar Header & Brand */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1D4B80]/60">
        <Link href="/admin/cards" className="flex items-center gap-3 focus-visible:outline-sky-400">
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCloseMobile}
            className="text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      {/* Union Badge */}
      <div className="px-6 py-3 border-b border-[#1D4B80]/40 bg-[#0A223E]/40">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span className="font-medium">Staff Portal</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-300 font-semibold">
            <span className="size-1.5 rounded-full bg-[#018BCE]" />
            v1.0
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin Navigation">
        {navItems.map((item) => {
          const isItemActive = item.href ? pathname.startsWith(item.href) : false;
          const Icon = item.icon;

          if (item.soon || !item.href) {
            return (
              <div
                key={item.title}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/45 cursor-not-allowed transition-colors"
                aria-disabled="true"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4.5 text-white/40" />
                  <span className="font-medium">{item.title}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="h-4.5 px-1.5 text-[10px] bg-white/10 text-white/60 border-none font-medium"
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
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isItemActive
                  ? "bg-[#018BCE] text-white shadow-md shadow-[#018BCE]/20 font-semibold"
                  : "text-white/80 hover:text-white hover:bg-[#174273]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "size-4.5 transition-colors",
                    isItemActive ? "text-white" : "text-white/70 group-hover:text-white"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {isItemActive && (
                <span className="size-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-[#1D4B80]/60 bg-[#0A223E]/30 text-xs text-white/60 space-y-2">
        <div className="flex items-center gap-2 text-white/80 font-medium">
          <Sparkles className="size-3.5 text-[#018BCE]" />
          <span>NUSU Admin Hub</span>
        </div>
        <p className="text-[11px] leading-tight text-white/50">
          Nile University Student Union Physical & Digital Cards
        </p>
      </div>
    </aside>
  );
}
