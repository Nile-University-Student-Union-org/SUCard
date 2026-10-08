"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, CreditCard, User, Layers, AlertCircle, X, ExternalLink } from "lucide-react";
import { lookupCard } from "./api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface LookupResult {
  id: string;
  type: "digital" | "physical";
  serial: string;
  status: "unassigned" | "active" | "void";
  qr: string;
  linkedAt: string | null;
  batchLabel: string | null;
  student: {
    userId: string;
    name: string;
    email: string;
    universityId: string;
  } | null;
}

export function CardLookupPanel() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const isQr = trimmed.startsWith("NUSU1:") || trimmed.startsWith("http");
      const res = await lookupCard(
        isQr ? { qr: trimmed } : { serial: trimmed }
      );

      if (res && res.card) {
        setResult(res.card);
      } else {
        setError("Card not found. Check the serial number or QR code.");
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Card not found. Check the serial or QR code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResult(null);
    setError(null);
  };

  return (
    <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
        <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
          <Search className="size-5 text-brand dark:text-brand-soft shrink-0" />
          <span>LOOK UP A CARD</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter a serial number (e.g. SU-000123 or 123) or paste a QR code payload to inspect card status and ownership.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              id="cardLookupInput"
              type="text"
              placeholder="Enter serial like SU-000123 or paste QR…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<CreditCard className="size-4 text-ash dark:text-zinc-400" />}
              disabled={isLoading}
              required
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-ash dark:text-zinc-400 hover:text-foreground cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Clear input"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            loadingText="Searching…"
            disabled={!query.trim()}
            className="font-bold normal-case shrink-0 min-h-[44px] px-6"
          >
            Look up
          </Button>
        </form>

        {error && (
          <Alert
            variant="destructive"
            size="sm"
            description={error}
            icon={<AlertCircle className="size-4" />}
          />
        )}

        {result && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-4 animate-in fade-in duration-200">
            {/* Card Main Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-zinc-700/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center font-mono font-bold text-sm">
                  {result.serial}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground font-mono">
                    {result.serial}
                  </h4>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">
                    {result.type} card
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    result.status === "active"
                      ? "brand"
                      : result.status === "void"
                      ? "destructive"
                      : "secondary"
                  }
                  className="font-bold text-[10px] uppercase"
                >
                  {result.status}
                </Badge>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Batch Info */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                <Layers className="size-4 text-ash dark:text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Batch
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {result.batchLabel || "Individual / Digital Pass"}
                  </span>
                </div>
              </div>

              {/* Linked Student */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800">
                <User className="size-4 text-ash dark:text-zinc-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Card Holder
                  </span>
                  {result.student ? (
                    <Link
                      href={`/admin/students/${result.student.userId}`}
                      className="font-bold text-brand dark:text-brand-soft hover:underline truncate inline-flex items-center gap-1"
                      title={result.student.email}
                    >
                      <span>
                        {result.student.name} ({result.student.universityId})
                      </span>
                      <ExternalLink className="size-3 shrink-0" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground font-medium block">
                      Unassigned (Ready to link)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
