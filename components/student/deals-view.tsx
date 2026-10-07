"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Search,
  Tag,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Utensils,
  Coffee,
  Dumbbell,
  BookOpen,
  Briefcase,
  Store,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  FileText,
} from "lucide-react";
import type { StudentDeal, StudentDealsResponse } from "@/lib/analytics/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { OverflowScroller } from "@/components/ui/overflow-scroller";
import { formatCairoDate } from "@/components/ui/analytics-format";

const CATEGORIES = [
  { id: "all", label: "All Deals", icon: Sparkles },
  { id: "food", label: "Food", icon: Utensils },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "other", label: "Other", icon: Store },
] as const;

export function DealsView() {
  const [deals, setDeals] = useState<StudentDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [, startTransition] = useTransition();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (debouncedSearch) params.set("q", debouncedSearch);

        const res = await fetch(`/api/student/deals?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load student deals");
        }
        const data: StudentDealsResponse = await res.json();
        if (!ignore) {
          setDeals(data.deals || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [category, debouncedSearch, refreshKey]);

  const toggleTerms = (offerId: string) => {
    setExpandedTerms((prev) => ({ ...prev, [offerId]: !prev[offerId] }));
  };

  const handleCategorySelect = (catId: string) => {
    startTransition(() => {
      setCategory(catId);
    });
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("all");
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-charcoal dark:text-white uppercase tracking-wider">
            STUDENT DEALS
          </h1>
          <p className="text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium mt-0.5">
            Exclusive discounts and partner offers for Nile University students
          </p>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ash dark:text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor, offer or keyword…"
            className="w-full h-12 pl-10 pr-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors"
            aria-label="Search student deals"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-ash dark:text-zinc-400 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg transition-colors cursor-pointer"
              aria-label="Clear search query"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category Chips Scroller */}
        <OverflowScroller className="py-1">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <ToggleChip
                  key={cat.id}
                  pressed={isSelected}
                  onPressedChange={() => handleCategorySelect(cat.id)}
                  aria-label={`Filter by ${cat.label}`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{cat.label}</span>
                </ToggleChip>
              );
            })}
          </div>
        </OverflowScroller>
      </div>

      {/* Deals Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-5 space-y-4 border border-border bg-card">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="pt-2 border-t border-border/50 flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <StatusState
          variant="destructive"
          title="Could not load deals"
          description={error}
          actions={
            <Button
              variant="outline"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="min-h-[44px]"
            >
              <RotateCcw className="size-4 mr-2" />
              Try Again
            </Button>
          }
        />
      ) : deals.length === 0 ? (
        <Card className="p-8 text-center space-y-4 border border-border bg-card">
          <div className="size-14 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto border border-brand/20">
            <Tag className="size-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground">
              No Deals Found
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {search || category !== "all"
                ? "No student deals matched your current search or filter. Try clearing filters."
                : "There are currently no active offers available. Check back soon for new partner perks!"}
            </p>
          </div>
          {(search || category !== "all") && (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="min-h-[44px] font-semibold"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal) => {
            const isTermsOpen = !!expandedTerms[deal.offerId];
            const isExhausted = deal.remainingUses === 0;

            return (
              <Card
                key={deal.offerId}
                className={`p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md border rounded-2xl ${
                  isExhausted
                    ? "opacity-75 bg-slate-50/50 dark:bg-zinc-900/40 border-dashed border-border"
                    : "border-border bg-card shadow-xs"
                }`}
              >
                <div className="space-y-4">
                  {/* 1. Leading Discount & Category Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand text-white font-bold text-xs shadow-2xs">
                        <Tag className="size-3.5" />
                        {deal.discountLabel}
                      </span>

                      {/* Usage Limit status indicator */}
                      {isExhausted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
                          <AlertCircle className="size-3.5" />
                          Limit reached
                        </span>
                      ) : deal.remainingUses !== null ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/20">
                          <CheckCircle2 className="size-3.5" />
                          {deal.remainingUses === 1
                            ? "1 use left"
                            : `${deal.remainingUses} uses left`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-muted-foreground text-xs font-medium border border-border/60">
                          {deal.limitText}
                        </span>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className="text-[11px] capitalize shrink-0 font-medium py-0.5"
                    >
                      {deal.category}
                    </Badge>
                  </div>

                  {/* 2. Vendor Information */}
                  <div className="flex items-center gap-3">
                    {deal.logoUrl ? (
                      <div className="relative size-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-border shrink-0">
                        <Image
                          src={deal.logoUrl}
                          alt={deal.vendorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-12 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center font-bold text-lg border border-brand/20 shrink-0">
                        {deal.vendorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-foreground leading-tight truncate">
                        {deal.vendorName}
                      </h2>
                      {deal.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="size-3 text-ash dark:text-zinc-400 shrink-0" />
                          <span>{deal.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Offer Title */}
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                      {deal.title}
                    </p>
                  </div>

                  {/* 4. Schedule & Reset Metadata */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0 text-ash dark:text-zinc-400" />
                      <span>{deal.scheduleText}</span>
                    </div>
                    {deal.resetsAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0 text-ash dark:text-zinc-400" />
                        <span>
                          Resets: {formatCairoDate(deal.resetsAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 5. Expandable Terms & Conditions with >= 44px Tap Target */}
                  {deal.terms && (
                    <div className="pt-2 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => toggleTerms(deal.offerId)}
                        aria-expanded={isTermsOpen}
                        aria-controls={`terms-${deal.offerId}`}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-brand dark:text-brand-soft border border-slate-200/80 dark:border-zinc-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand min-h-[44px] cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileText className="size-3.5 text-brand dark:text-brand-soft" />
                          <span>Terms &amp; conditions</span>
                        </span>
                        {isTermsOpen ? (
                          <ChevronUp className="size-4 shrink-0" />
                        ) : (
                          <ChevronDown className="size-4 shrink-0" />
                        )}
                      </button>

                      {isTermsOpen && (
                        <div
                          id={`terms-${deal.offerId}`}
                          className="mt-2 p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-800/90 text-xs text-muted-foreground leading-relaxed border border-border/80 motion-reduce:transition-none"
                        >
                          {deal.terms}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
