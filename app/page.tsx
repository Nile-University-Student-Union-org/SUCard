"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Utensils,
  Laptop,
  Trophy,
  Lock,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanyardCard } from "@/components/landing/lanyard-card";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-background text-foreground overflow-clip selection:bg-brand selection:text-white">
      {/* Ambient background brand glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-[30rem] rounded-full bg-brand/10 dark:bg-brand/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-40 size-[32rem] rounded-full bg-brand-soft/10 dark:bg-brand-soft/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/4 size-[36rem] rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/su-logo-color.png"
              alt="Nile University Student Union"
              width={160}
              height={48}
              className="h-9 sm:h-10 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/brand/su-logo-white@hd.png"
              alt="Nile University Student Union"
              width={160}
              height={48}
              className="h-9 sm:h-10 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ButtonLink
            href="/login"
            variant="outline"
            size="sm"
            className="normal-case font-semibold"
          >
            <span>Sign in</span>
          </ButtonLink>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col">
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pt-8 sm:pb-16 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Hero Heading in Anton Display */}
            <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wider uppercase text-charcoal dark:text-white font-normal drop-shadow-xs mb-4 leading-[0.9]">
              SU CARD
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-ash dark:text-zinc-300 font-normal max-w-xl mb-8 leading-relaxed">
              Your Nile University Student Union card. Show it at partners and save.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto mb-10">
              <ButtonLink
                href="/login"
                size="lg"
                variant="primary"
                className="w-full sm:w-auto h-12 px-8 text-base font-bold shadow-md"
              >
                <span>Get your card</span>
                <ArrowRight className="size-5 ml-1.5" />
              </ButtonLink>
              <ButtonLink
                href="#how-it-works"
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto h-12 px-6 text-base font-semibold"
              >
                <span>How it works</span>
              </ButtonLink>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-ash dark:text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Instant NU verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Google Wallet ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Lanyard Hero */}
          <div className="lg:col-span-6 w-full flex items-center justify-center min-h-[480px] sm:min-h-[560px] lg:min-h-[640px]">
            <LanyardCard />
          </div>
        </section>

        <HowItWorks />

        {/* Benefits & Privileges Strip */}
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-2xl bg-slate-100/80 dark:bg-zinc-900/60 border-2 border-slate-200 dark:border-zinc-800 p-8 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-tactile bg-brand/10 dark:bg-brand-soft/20 flex items-center justify-center text-brand dark:text-brand-soft shrink-0">
                  <Utensils className="size-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg text-charcoal dark:text-white uppercase mb-1">
                    Dining & Cafes
                  </h4>
                  <p className="text-xs text-ash dark:text-zinc-400 font-medium leading-relaxed">
                    Enjoy up to 25% off at campus eateries and partner food chains.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 rounded-tactile bg-brand/10 dark:bg-brand-soft/20 flex items-center justify-center text-brand dark:text-brand-soft shrink-0">
                  <Laptop className="size-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg text-charcoal dark:text-white uppercase mb-1">
                    Tech & Supplies
                  </h4>
                  <p className="text-xs text-ash dark:text-zinc-400 font-medium leading-relaxed">
                    Special student pricing on hardware, books, and printing services.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 rounded-tactile bg-brand/10 dark:bg-brand-soft/20 flex items-center justify-center text-brand dark:text-brand-soft shrink-0">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg text-charcoal dark:text-white uppercase mb-1">
                    Sports & Events
                  </h4>
                  <p className="text-xs text-ash dark:text-zinc-400 font-medium leading-relaxed">
                    Priority access to NUSU tournaments, trips, and campus gym facilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 rounded-tactile bg-brand/10 dark:bg-brand-soft/20 flex items-center justify-center text-brand dark:text-brand-soft shrink-0">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg text-charcoal dark:text-white uppercase mb-1">
                    Cryptographic Security
                  </h4>
                  <p className="text-xs text-ash dark:text-zinc-400 font-medium leading-relaxed">
                    Tamper-proof digital signatures protect your identity and card validity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-slate-900 text-white p-8 sm:p-12 lg:p-16 border-2 border-brand-soft/30 shadow-2xl relative overflow-hidden">
            <div
              className="absolute -top-24 -right-24 size-72 rounded-full bg-sky-400/20 blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-24 size-72 rounded-full bg-brand-soft/20 blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            <h2 className="relative z-10 font-heading text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wider mb-4 leading-tight">
              CLAIM YOUR SU CARD TODAY
            </h2>
            <p className="relative z-10 text-base sm:text-lg text-sky-100/90 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
              Sign in with your NU Microsoft account and your card is ready in seconds.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ButtonLink
                href="/login"
                size="lg"
                variant="accent"
                className="w-full sm:w-auto h-12 px-8 text-base font-bold shadow-lg"
              >
                <span>Get started</span>
                <ArrowRight className="size-5 ml-1.5" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border/60 text-xs text-ash dark:text-zinc-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/su-icon-color.png"
              alt="NUSU Icon"
              width={24}
              height={24}
              className="size-6 object-contain dark:hidden"
            />
            <Image
              src="/brand/su-icon-white@hd.png"
              alt="NUSU Icon"
              width={24}
              height={24}
              className="size-6 object-contain hidden dark:block"
            />
            <p>
              &copy; {new Date().getFullYear()} Nile University Student Union (NUSU). All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-brand dark:hover:text-brand-soft transition-colors font-medium underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="hover:text-brand dark:hover:text-brand-soft transition-colors font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
