import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanyardCard } from "@/components/landing/lanyard-card";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CurrentOffers } from "@/components/landing/current-offers";

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between bg-background text-foreground overflow-clip selection:bg-brand selection:text-white">
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
            className="normal-case font-semibold min-h-[44px]"
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
                className="w-full sm:w-auto min-h-[48px] px-8 text-base font-bold shadow-md"
              >
                <span>Get your card</span>
                <ArrowRight className="size-5 ml-1.5" />
              </ButtonLink>
              <ButtonLink
                href="#how-it-works"
                size="lg"
                variant="secondary"
                className="group w-full sm:w-auto min-h-[48px] px-6 text-base font-semibold text-brand dark:text-white bg-white/70 hover:bg-white/90 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-2 border-brand/20 hover:border-brand/40 dark:border-white/15 dark:hover:border-white/30 backdrop-blur-sm shadow-xs hover:shadow-sm"
              >
                <span>How it works</span>
                <ChevronDown className="size-4.5 ml-1.5 transition-transform duration-200 motion-safe:group-hover:translate-y-0.5 motion-reduce:group-hover:translate-y-0" />
              </ButtonLink>
            </div>
          </div>

          {/* Right Column: 3D Interactive Lanyard Hero / Responsive Static Preview */}
          <div className="lg:col-span-6 w-full flex items-center justify-center min-h-[320px] sm:min-h-[440px] md:min-h-[520px] lg:min-h-[600px]">
            <LanyardCard />
          </div>
        </section>

        <HowItWorks />

        <Suspense
          fallback={
            <section
              aria-hidden="true"
              className="relative w-full max-w-7xl mx-auto py-12 sm:py-20 px-4 sm:px-6 lg:px-8"
            >
              <div className="h-4 w-28 rounded-full bg-slate-200/80 dark:bg-zinc-800/80 animate-pulse mb-3" />
              <div className="h-9 w-64 rounded-xl bg-slate-200/80 dark:bg-zinc-800/80 animate-pulse mb-3" />
              <div className="h-4 w-72 max-w-full rounded-md bg-slate-200/80 dark:bg-zinc-800/80 animate-pulse mb-8" />
              <div className="flex gap-4 overflow-hidden pt-2 pb-8">
                {[1, 2, 3, 4].map((k) => (
                  <div
                    key={k}
                    className="aspect-[4/5] w-[76%] max-w-[17rem] sm:w-[17rem] shrink-0 rounded-2xl sm:rounded-[1.25rem] bg-slate-200/60 dark:bg-zinc-800/60 animate-pulse"
                  />
                ))}
              </div>
            </section>
          }
        >
          <CurrentOffers />
        </Suspense>

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
              Sign in with your NU Microsoft account (@nu.edu.eg) to activate your digital pass or link your physical card in seconds.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ButtonLink
                href="/login"
                size="lg"
                variant="accent"
                className="w-full sm:w-auto min-h-[48px] px-8 text-base font-bold shadow-lg"
              >
                <span>Get your card</span>
                <ArrowRight className="size-5 ml-1.5" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border/60 text-xs text-ash dark:text-zinc-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
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
              &copy; {new Date().getFullYear()} Nile University Student Union (NUSU).
            </p>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-semibold" aria-label="Footer links">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
            >
              Privacy Notice
            </Link>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
            >
              Sign In
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
            >
              How It Works
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

