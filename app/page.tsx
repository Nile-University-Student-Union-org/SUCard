import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0F3056] text-white overflow-hidden selection:bg-[#018BCE] selection:text-white">
      {/* Ambient background brand glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-[#018BCE]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[32rem] rounded-full bg-[#0F548D]/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[40rem] rounded-full bg-[#018BCE]/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="Nile University Student Union"
            width={160}
            height={48}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-xs transition-colors"
          render={<Link href="/login" />}
        >
          <ShieldCheck className="size-4 mr-1 text-[#018BCE]" />
          Staff Portal
        </Button>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-4xl mx-auto">
        {/* Card Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs sm:text-sm font-medium text-sky-200 mb-8 shadow-inner">
          <span className="size-2 rounded-full bg-[#018BCE] animate-pulse" />
          Official Membership System
        </div>

        {/* Hero Title in Anton */}
        <h1 className="font-heading text-6xl sm:text-8xl md:text-9xl tracking-wider uppercase text-white font-normal drop-shadow-sm mb-4">
          SU CARD
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-slate-200 font-normal max-w-2xl mx-auto mb-10 leading-relaxed">
          Nile University Student Union membership card
        </p>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none">
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-[#018BCE] text-white hover:bg-[#018BCE]/90 shadow-lg shadow-[#018BCE]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            render={<Link href="/login" />}
          >
            <span>Staff login</span>
            <ArrowRight className="size-5 ml-1.5" />
          </Button>
        </div>

        {/* Decorative Card preview silhouette */}
        <div className="mt-16 w-full max-w-md p-6 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 backdrop-blur-xl shadow-2xl text-left flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-sky-300 font-semibold">
              Nile University Student Union
            </span>
            <span className="text-xs font-mono text-white/70">2026/2027</span>
          </div>
          <div className="h-16 flex items-center justify-between pt-2">
            <div>
              <div className="h-4 w-32 bg-white/20 rounded-sm mb-2" />
              <div className="h-3 w-20 bg-white/15 rounded-sm" />
            </div>
            <div className="size-12 rounded-lg bg-white/20 p-2 flex items-center justify-center">
              <div className="size-8 border-2 border-white/60 rounded-xs border-dashed" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-white/60">
        <p>© {new Date().getFullYear()} Nile University Student Union (NUSU). All rights reserved.</p>
      </footer>
    </div>
  );
}
