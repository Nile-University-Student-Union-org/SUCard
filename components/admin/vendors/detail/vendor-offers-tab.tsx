"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Tag,
  History,
  Edit2,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/ui/status-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listOffers, updateOffer } from "../api";
import { formatDiscount } from "@/lib/vendors/types";
import { VendorOfferModal } from "./vendor-offer-modal";
import { VendorOfferHistoryModal } from "./vendor-offer-history-modal";
import { OfferCard } from "@/components/offers/offer-card";
import { cn } from "cn";
import type { OfferDto, OfferPeriod } from "@/lib/vendors/types";

interface VendorOffersTabProps {
  vendorId: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatScheduleSummary(offer: OfferDto): string {
  let daysText = "Every day";
  if (offer.activeDays && offer.activeDays.length > 0 && offer.activeDays.length < 7) {
    daysText = offer.activeDays.map((d) => DAY_NAMES[d]).join(", ");
  }

  let hoursText = "All day";
  if (offer.activeFrom && offer.activeTo) {
    hoursText = `${offer.activeFrom.slice(0, 5)}–${offer.activeTo.slice(0, 5)}`;
  } else if (offer.activeFrom) {
    hoursText = `From ${offer.activeFrom.slice(0, 5)}`;
  }

  return `${daysText} • ${hoursText}`;
}

function formatLimitSummary(count: number | null, period: OfferPeriod): string {
  if (period === "unlimited") return "Unlimited";
  if (count === 1) return `1 per ${period}`;
  return `${count} per ${period}`;
}

export function VendorOffersTab({ vendorId }: VendorOffersTabProps) {
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferDto | null>(null);
  const [historyOffer, setHistoryOffer] = useState<OfferDto | null>(null);

  const fetchOffersList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listOffers(vendorId);
      setOffers(res.offers || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load offers"
      );
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    let active = true;
    listOffers(vendorId)
      .then((res) => {
        if (active) {
          setOffers(res.offers || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load offers"
          );
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [vendorId]);

  const handleOfferSaved = (saved: OfferDto) => {
    setOffers((prev) => {
      const exists = prev.some((o) => o.id === saved.id);
      if (exists) {
        return prev.map((o) => (o.id === saved.id ? saved : o));
      }
      return [saved, ...prev];
    });
    setEditingOffer(null);
    setIsCreateOpen(false);
  };

  const handleToggleStatus = async (offer: OfferDto) => {
    const nextStatus = offer.status === "active" ? "paused" : "active";
    try {
      const res = await updateOffer(offer.id, { status: nextStatus });
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? res.offer : o))
      );
      toast.success(
        `Offer ${nextStatus === "active" ? "resumed" : "paused"}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update offer status"
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans font-semibold text-xl text-foreground">
            Discount offers
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Active deals, percentage discounts, item limits, and redemption rules.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="normal-case font-bold h-11 min-h-[44px] px-5 shadow-xs"
        >
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          <span>Add offer</span>
        </Button>
      </div>

      {/* Offers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card/60 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : error ? (
        <StatusState
          icon={<AlertCircle className="size-6" />}
          variant="warning"
          title="Could not load offers"
          description={error}
          actions={
            <Button
              variant="primary"
              onClick={fetchOffersList}
              className="normal-case font-bold mt-2 h-11 min-h-[44px] px-5"
            >
              Retry
            </Button>
          }
        />
      ) : offers.length === 0 ? (
        <StatusState
          icon={<Tag className="size-6" />}
          variant="default"
          title="No offers configured"
          description="Create at least one offer so student cards can be scanned for discounts at this store."
          actions={
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="normal-case font-bold mt-2 h-11 min-h-[44px] px-5"
            >
              Create first offer
            </Button>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {offers.map((offer) => {
            const discountLabel = formatDiscount(offer);
            const scheduleSummary = formatScheduleSummary(offer);
            const limitSummary = formatLimitSummary(offer.limitCount, offer.limitPeriod);

            return (
              <div
                key={offer.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Promo Image Thumbnail or "No image yet" State */}
                  {offer.imageUrl ? (
                    <OfferCard
                      offer={{
                        id: offer.id,
                        title: offer.title,
                        discountLabel,
                        imageUrl: offer.imageUrl,
                        terms: offer.terms,
                      }}
                      variant="thumbnail"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingOffer(offer)}
                      aria-label={`No promo image for ${offer.title}. Click to edit and upload 4:5 poster.`}
                      className="group relative aspect-[4/5] w-14 sm:w-16 overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800/80 border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 p-1 text-center shrink-0 hover:border-brand/60 hover:bg-brand/5 dark:hover:bg-brand/10 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="size-4 text-muted-foreground group-hover:text-brand dark:group-hover:text-brand-soft transition-colors" />
                      <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-brand dark:group-hover:text-brand-soft leading-tight">
                        No image
                      </span>
                    </button>
                  )}

                  {/* Offer Details & Badges */}
                  <div className="min-w-0 space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand text-white font-sans font-semibold text-xs shadow-xs">
                        <Tag className="size-3.5" />
                        <span>{discountLabel}</span>
                      </span>

                      <h4 className="font-bold text-base text-foreground truncate">
                        {offer.title}
                      </h4>

                      {/* Status Pill */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border",
                          offer.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            offer.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                        <span>{offer.status}</span>
                      </span>

                      {/* Visibility Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border",
                          offer.visible
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-zinc-500/10 text-zinc-500 border-zinc-400/30"
                        )}
                      >
                        {offer.visible ? (
                          <>
                            <Eye className="size-3" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </span>

                      {/* No Image Nudge Pill */}
                      {!offer.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingOffer(offer)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer transition-colors"
                        >
                          <ImageIcon className="size-3" />
                          <span>No promo image &bull; Add poster</span>
                        </button>
                      )}
                    </div>

                    {offer.description && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {offer.description}
                      </p>
                    )}

                    {/* Limits and Schedule Row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <span>Limit:</span>
                        <span className="text-brand dark:text-brand-soft">{limitSummary}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>{scheduleSummary}</span>
                      </div>

                      {(offer.startsAt || offer.endsAt) && (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="size-3" />
                          <span>
                            {offer.startsAt || "Always"} &rarr; {offer.endsAt || "Ongoing"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(offer)}
                    className={cn(
                      "normal-case font-bold text-xs h-11 min-h-[44px] px-3.5",
                      offer.status === "active"
                        ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    )}
                  >
                    {offer.status === "active" ? "Pause" : "Resume"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryOffer(offer)}
                    className="normal-case font-bold text-xs h-11 min-h-[44px] px-3.5 rounded-xl border-border"
                  >
                    <History className="size-3.5 mr-1" />
                    <span>History</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingOffer(offer)}
                    className="normal-case font-bold text-xs h-11 min-h-[44px] px-3.5 rounded-xl border-border"
                  >
                    <Edit2 className="size-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      <VendorOfferModal
        isOpen={isCreateOpen || !!editingOffer}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingOffer(null);
        }}
        vendorId={vendorId}
        editingOffer={editingOffer}
        onOfferSaved={handleOfferSaved}
      />

      {/* Offer Revision History Modal */}
      <VendorOfferHistoryModal
        offer={historyOffer}
        isOpen={!!historyOffer}
        onClose={() => setHistoryOffer(null)}
      />
    </div>
  );
}
