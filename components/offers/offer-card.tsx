"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  BookOpen,
  Briefcase,
  Coffee,
  Dumbbell,
  Maximize2,
  ScanLine,
  Store,
  Utensils,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { VendorCategory } from "@/lib/vendors/types";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

const CATEGORY_META: Record<
  VendorCategory,
  { label: string; icon: LucideIcon; glow: string }
> = {
  food: { label: "Food", icon: Utensils, glow: "#F59E0B" },
  coffee: { label: "Coffee", icon: Coffee, glow: "#D6A26B" },
  fitness: { label: "Fitness", icon: Dumbbell, glow: "#34D399" },
  books: { label: "Books", icon: BookOpen, glow: "#A78BFA" },
  services: { label: "Services", icon: Briefcase, glow: "#38BDF8" },
  other: { label: "Partner", icon: Store, glow: "#5B9BE6" },
};

export interface OfferCardOffer {
  id?: string;
  offerId?: string;
  vendorId?: string;
  vendorName?: string;
  logoUrl?: string | null;
  imageUrl?: string | null;
  category?: VendorCategory | string;
  title: string;
  discountLabel?: string;
  terms?: string | null;
  limitText?: string | null;
  scheduleText?: string | null;
  location?: string | null;
  remainingUses?: number | null;
  resetsAt?: string | null;
}

export interface OfferCardProps {
  offer: OfferCardOffer;
  className?: string;
  sizes?: string;
  priority?: boolean;
  lazy?: boolean;
  variant?: "default" | "carousel" | "thumbnail" | "compact";
  showLightboxOnTap?: boolean;
  onImageClick?: (offer: OfferCardOffer) => void;
  index?: number;
  total?: number;
}

/**
 * Shared OfferCard component:
 * - When imageUrl exists: renders the 4:5 promo poster uncropped without overlay text.
 *   Tapping opens a full-size lightbox viewer so fine-print terms are readable, with pinch-zoom support on phones.
 * - When imageUrl is null: renders the cleaned-up NUSU brand gradient tile.
 */
export function OfferCard({
  offer,
  className,
  sizes = "(max-width: 640px) 76vw, (max-width: 1024px) 300px, 320px",
  priority = false,
  lazy = true,
  variant = "default",
  showLightboxOnTap = true,
  onImageClick,
  index,
  total,
}: OfferCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const rawCat = (offer.category as VendorCategory) || "other";
  const meta = CATEGORY_META[rawCat] ?? CATEGORY_META.other;
  const CategoryIcon = meta.icon;

  const discountText = offer.discountLabel || "Special Offer";
  const vendorDisplayName = offer.vendorName || "Partner Offer";
  const hasImage = Boolean(offer.imageUrl);

  const handleCardClick = () => {
    if (onImageClick) {
      onImageClick(offer);
      return;
    }
    if (hasImage && showLightboxOnTap) {
      setIsLightboxOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && hasImage && showLightboxOnTap) {
      e.preventDefault();
      handleCardClick();
    }
  };

  const isCarousel = variant === "carousel";
  const isThumbnail = variant === "thumbnail";

  if (isThumbnail && hasImage) {
    return (
      <>
        <button
          type="button"
          onClick={handleCardClick}
          aria-label={`View promo poster for ${vendorDisplayName}`}
          className={cn(
            "group relative aspect-[4/5] w-14 sm:w-16 overflow-hidden rounded-xl bg-slate-900 border border-border shadow-xs hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer shrink-0 transition-all",
            className
          )}
        >
          <Image
            src={offer.imageUrl!}
            alt={offer.title}
            fill
            sizes="64px"
            className="object-contain"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Maximize2 className="size-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
          </div>
        </button>

        {isLightboxOpen && (
          <OfferLightbox
            imageUrl={offer.imageUrl!}
            vendorName={vendorDisplayName}
            discountLabel={discountText}
            title={offer.title}
            terms={offer.terms}
            onClose={() => setIsLightboxOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <article
        data-tile={isCarousel ? "true" : undefined}
        role={isCarousel ? "group" : undefined}
        aria-roledescription={isCarousel ? "slide" : undefined}
        aria-label={
          isCarousel && typeof index === "number" && typeof total === "number"
            ? `${index + 1} of ${total}: ${vendorDisplayName}, ${discountText}`
            : `${vendorDisplayName} — ${discountText}`
        }
        className={cn(
          "group relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-2xl sm:rounded-[1.25rem] transition-all duration-300",
          hasImage
            ? "bg-slate-950 border border-slate-200/80 dark:border-zinc-800 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.85)] cursor-pointer focus-within:ring-2 focus-within:ring-brand motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-reduce:transition-none"
            : "p-4 sm:p-5 bg-gradient-to-br from-[#0F548D] via-[#0F3056] to-[#0A1E38] text-white ring-1 ring-inset ring-white/10 shadow-[0_22px_44px_-22px_rgb(15_48_86/0.65)] dark:shadow-[0_22px_44px_-22px_rgb(0_0_0/0.9)] motion-safe:hover:-translate-y-1.5 motion-reduce:transition-none",
          isCarousel && "w-[76%] max-w-[17rem] shrink-0 snap-start sm:w-[17rem]",
          className
        )}
      >
        {hasImage ? (
          /* Promo Image Presentation: Clean, Uncropped 4:5 Box without Text Overlay */
          <div
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            tabIndex={showLightboxOnTap ? 0 : undefined}
            role={showLightboxOnTap ? "button" : undefined}
            aria-label={`View full-size promo poster for ${vendorDisplayName}: ${discountText}. Tap to inspect terms.`}
            className="relative size-full overflow-hidden rounded-2xl sm:rounded-[1.25rem] bg-slate-950 focus:outline-none"
          >
            <Image
              src={offer.imageUrl!}
              alt={`${vendorDisplayName} — ${discountText}`}
              fill
              sizes={sizes}
              className="object-contain transition-transform duration-300 motion-safe:group-hover:scale-[1.02] motion-reduce:transform-none"
              priority={priority}
              loading={priority ? undefined : lazy ? "lazy" : undefined}
            />

            {/* Subtle Expand Indicator on Hover/Focus */}
            <div
              aria-hidden="true"
              className="absolute top-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 shadow-md ring-1 ring-white/20 pointer-events-none"
            >
              <Maximize2 className="size-4 stroke-[2.2]" />
            </div>
          </div>
        ) : (
          /* Fallback Cleaned-up Gradient Tile */
          <>
            {/* Subtle category glow */}
            <span
              aria-hidden="true"
              style={{ background: meta.glow }}
              className="absolute -right-10 -top-14 -z-10 size-48 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30 pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-35 [background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom_left,#000,transparent_70%)] pointer-events-none"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"
            />

            {/* Header: Partner Logo & Category */}
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-brand shadow-md ring-1 ring-black/5">
                {offer.logoUrl ? (
                  <Image
                    src={offer.logoUrl}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="size-full object-contain p-1"
                  />
                ) : (
                  <CategoryIcon className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.95rem] font-semibold leading-tight text-white">
                  {vendorDisplayName}
                </p>
                <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {meta.label}
                </p>
              </div>
            </div>

            {/* Bottom: Discount & SU Card Badge */}
            <div className="mt-auto">
              <p
                className={cn(
                  "font-heading uppercase leading-[0.92] tracking-wide line-clamp-2 drop-shadow-sm text-white",
                  discountText.length > 14
                    ? "text-[1.45rem] sm:text-[1.6rem]"
                    : "text-[2.2rem] sm:text-[2.45rem]"
                )}
              >
                {discountText}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-white/70">
                  {offer.title.trim().toLowerCase() !== discountText.trim().toLowerCase()
                    ? offer.title
                    : "With your SU Card"}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
                  <ScanLine className="size-3" />
                  SU Card
                </span>
              </div>
            </div>
          </>
        )}
      </article>

      {/* Full-size Lightbox Viewer with Pinch-to-zoom support */}
      {isLightboxOpen && hasImage && (
        <OfferLightbox
          imageUrl={offer.imageUrl!}
          vendorName={vendorDisplayName}
          discountLabel={discountText}
          title={offer.title}
          terms={offer.terms}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}

interface OfferLightboxProps {
  imageUrl: string;
  vendorName: string;
  discountLabel: string;
  title: string;
  terms?: string | null;
  onClose: () => void;
}

function OfferLightbox({
  imageUrl,
  vendorName,
  discountLabel,
  title,
  terms,
  onClose,
}: OfferLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((z) => Math.min(2.5, z + 0.35));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((z) => Math.max(1, z - 0.35));
  };

  const handleZoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${vendorName} promo offer poster and fine print`}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-3 sm:p-6 overflow-hidden animate-in fade-in-0 duration-200 select-none"
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between gap-4 py-2 px-1 text-white shrink-0 z-20">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-lg sm:text-xl uppercase tracking-wide text-white truncate">
              {vendorName}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-brand text-white text-xs font-bold uppercase tracking-wider">
              {discountLabel}
            </span>
          </div>
          <p className="text-xs text-white/70 truncate">{title}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls on desktop / large displays */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-full p-1 border border-white/15">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              aria-label="Zoom in"
              className="size-9 rounded-full flex items-center justify-center hover:bg-white/20 text-white disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              aria-label="Zoom out"
              className="size-9 rounded-full flex items-center justify-center hover:bg-white/20 text-white disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ZoomOut className="size-4" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
                className="px-2 h-9 rounded-full flex items-center gap-1 hover:bg-white/20 text-xs font-mono font-bold text-white cursor-pointer transition-colors"
              >
                <RotateCcw className="size-3" />
                <span>{Math.round(zoomLevel * 100)}%</span>
              </button>
            )}
          </div>

          {/* Close Button with >= 44px tap target */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="size-11 min-h-[44px] min-w-[44px] rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <X className="size-6 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Main Image Stage (Pinch-zoomable on mobile, Zoomable on desktop) */}
      <main
        ref={containerRef}
        onClick={handleBackdropClick}
        className="relative flex-1 w-full max-w-4xl flex items-center justify-center my-auto p-1 sm:p-2 overflow-auto touch-pan-x touch-pan-y"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      >
        <div
          className="relative aspect-[4/5] w-full max-h-[78vh] sm:max-h-[80vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl transition-transform duration-150"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
          }}
        >
          <Image
            src={imageUrl}
            alt={`${vendorName} — ${title}. Offer details and terms.`}
            fill
            sizes="(max-width: 768px) 96vw, 1080px"
            className="object-contain rounded-2xl"
            priority
            unoptimized
          />
        </div>
      </main>

      {/* Footer / Fine Print & Terms */}
      <footer className="w-full max-w-4xl py-2 px-1 text-center shrink-0 z-20 space-y-0.5">
        {terms && (
          <p className="text-[11px] sm:text-xs text-white/80 font-medium line-clamp-2">
            &ldquo;{terms}&rdquo;
          </p>
        )}
        <p className="text-[10px] sm:text-[11px] text-white/50">
          Pinch or double-tap on mobile to zoom into fine print terms &bull; Press Esc or tap outside to close
        </p>
      </footer>
    </div>,
    document.body
  );
}
