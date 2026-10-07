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

  // Debounce search
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl text-foreground tracking-wide">
            STUDENT DEALS
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Exclusive discounts and partner offers for Nile University students
          </p>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor, offer or keyword…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-xs transition-colors"
            aria-label="Search deals"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand text-xs"
              aria-label="Clear search query"
            >
              ✕
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
                  <Icon className="h-3.5 w-3.5 shrink-0" />
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
            <Card key={n} className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3.5 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
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
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          }
        />
      ) : deals.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-muted-foreground">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl text-foreground">No Deals Found</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {search || category !== "all"
                ? "No active student deals matched your current search or category filter."
                : "There are currently no active offers available. Check back soon for new partner perks!"}
            </p>
          </div>
          {(search || category !== "all") && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
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
                className={`p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md border ${
                  isExhausted
                    ? "opacity-75 bg-slate-50/50 dark:bg-zinc-900/40 border-dashed"
                    : "border-border bg-card"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Vendor Info & Category */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {deal.logoUrl ? (
                        <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-border shrink-0">
                          <Image
                            src={deal.logoUrl}
                            alt={deal.vendorName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-lg border border-brand/20 shrink-0">
                          {deal.vendorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-semibold text-foreground leading-tight">
                          {deal.vendorName}
                        </h2>
                        {deal.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{deal.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="text-[11px] capitalize shrink-0 font-medium"
                    >
                      {deal.category}
                    </Badge>
                  </div>

                  {/* Offer Title & Discount Pill */}
                  <div>
                    <div className="flex items-baseline flex-wrap gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-brand text-white font-bold text-xs shadow-2xs">
                        <Tag className="h-3 w-3" />
                        {deal.discountLabel}
                      </span>

                      {/* Usage Limit status indicator */}
                      {isExhausted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-xs border border-amber-500/20">
                          <AlertCircle className="h-3 w-3" />
                          Limit reached
                        </span>
                      ) : deal.remainingUses !== null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-xs border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          {deal.remainingUses === 1
                            ? "1 use left"
                            : `${deal.remainingUses} uses left`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-muted-foreground text-xs">
                          {deal.limitText}
                        </span>
                      )}
                    </div>

                    <p className="text-base font-medium text-foreground">
                      {deal.title}
                    </p>
                  </div>

                  {/* Schedule & Reset Meta */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{deal.scheduleText}</span>
                    </div>
                    {deal.resetsAt && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>
                          Resets: {formatCairoDate(deal.resetsAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expandable Terms */}
                  {deal.terms && (
                    <div className="pt-1">
                      <button
                        onClick={() => toggleTerms(deal.offerId)}
                        className="flex items-center gap-1 text-xs text-brand font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded py-1"
                        aria-expanded={isTermsOpen}
                      >
                        <span>Terms & conditions</span>
                        {isTermsOpen ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isTermsOpen && (
                        <div className="mt-1.5 p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-xs text-muted-foreground leading-relaxed border border-border/60">
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
