import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Shield, Mail, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackdrop } from "@/components/ui/ambient-backdrop";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Notice — SU Card",
  description:
    "Learn how Nile University Student Union (NUSU) collects, uses, and protects student and member data on SU Card.",
};

// Safe helper to parse inline markdown (links [text](url), bold **text**, email addresses)
function renderInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for markdown link [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [fullMatch, label, href] = linkMatch;
      parts.push(
        <a
          key={key++}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-brand dark:text-brand-soft underline font-bold hover:text-brand-dark transition-colors inline-flex items-center gap-0.5"
        >
          <span>{label}</span>
          {href.startsWith("http") && <ArrowUpRight className="size-3 inline shrink-0" />}
        </a>
      );
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Check for bold **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const [fullMatch, content] = boldMatch;
      parts.push(
        <strong key={key++} className="font-bold text-foreground">
          {content}
        </strong>
      );
      remaining = remaining.slice(fullMatch.length);
      continue;
    }

    // Check for email address
    const emailMatch = remaining.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      const [email] = emailMatch;
      parts.push(
        <a
          key={key++}
          href={`mailto:${email}`}
          className="text-brand dark:text-brand-soft font-bold underline hover:text-brand-dark transition-colors"
        >
          {email}
        </a>
      );
      remaining = remaining.slice(email.length);
      continue;
    }

    // Plain text chunk until next special syntax
    const nextSpecial = remaining.search(/(\[|\*\*|[a-zA-Z0-9._%+-]+@)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Special char didn't match full pattern; advance by 1
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export default async function PrivacyPage() {
  const markdown = await readFile(path.join(process.cwd(), "docs/PRIVACY-NOTICE.md"), "utf8");

  // Parse markdown into blocks
  const lines = markdown.split("\n");
  const blocks: { type: "h1" | "h2" | "h3" | "p" | "li"; content: string }[] = [];

  let currentParagraph = "";

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      blocks.push({ type: "p", content: currentParagraph.trim() });
      currentParagraph = "";
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "h1", content: line.replace(/^#\s+/, "") });
    } else if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", content: line.replace(/^##\s+/, "") });
    } else if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "h3", content: line.replace(/^###\s+/, "") });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      blocks.push({ type: "li", content: line.replace(/^[-*]\s+/, "") });
    } else {
      currentParagraph += (currentParagraph ? " " : "") + line;
    }
  }
  flushParagraph();

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-foreground flex flex-col justify-between relative isolate overflow-hidden selection:bg-brand selection:text-white">
      <AmbientBackdrop />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
          aria-label="SU Card Home"
        >
          <Image
            src="/brand/su-logo-color.png"
            alt="Nile University Student Union"
            width={160}
            height={48}
            className="h-9 w-auto object-contain dark:hidden"
            priority
          />
          <Image
            src="/brand/su-logo-white@hd.png"
            alt="Nile University Student Union"
            width={160}
            height={48}
            className="h-9 w-auto object-contain hidden dark:block"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ButtonLink
            href="/login"
            variant="surface"
            size="sm"
            className="normal-case font-bold text-xs"
          >
            Sign in
          </ButtonLink>
        </div>
      </header>

      {/* Document Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ash dark:text-zinc-400 hover:text-foreground transition-colors min-h-[44px] group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to home</span>
          </Link>
        </div>

        <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-10 space-y-6">
          {/* Header Banner */}
          <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-zinc-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/20 text-brand dark:text-brand-soft text-[11px] font-bold uppercase tracking-wider">
              <Shield className="size-3.5" />
              <span>Legal &amp; Privacy</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl uppercase tracking-wider text-charcoal dark:text-white font-normal leading-tight">
              {blocks.find((b) => b.type === "h1")?.content || "SU CARD PRIVACY NOTICE"}
            </h1>

            <p className="text-xs text-ash dark:text-zinc-400 font-medium">
              Official data protection notice of Nile University Student Union (NUSU).
            </p>
          </div>

          {/* Body Content */}
          <div className="space-y-5 text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
            {blocks
              .filter((b) => b.type !== "h1")
              .map((block, index) => {
                if (block.type === "h2") {
                  return (
                    <h2
                      key={index}
                      className="font-heading text-xl sm:text-2xl uppercase tracking-wide text-foreground pt-4 font-normal"
                    >
                      {block.content}
                    </h2>
                  );
                }
                if (block.type === "h3") {
                  return (
                    <h3
                      key={index}
                      className="font-heading text-lg sm:text-xl uppercase tracking-wide text-foreground pt-2 font-normal"
                    >
                      {block.content}
                    </h3>
                  );
                }
                if (block.type === "li") {
                  return (
                    <li key={index} className="ml-5 list-disc pl-1">
                      {renderInlineMarkdown(block.content)}
                    </li>
                  );
                }
                return (
                  <p key={index} className="leading-relaxed">
                    {renderInlineMarkdown(block.content)}
                  </p>
                );
              })}
          </div>

          {/* Contact Footer Box */}
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-ash dark:text-zinc-400">
              <span className="font-bold text-foreground block">Questions or data requests?</span>
              <span>Contact the Student Union data officers at su@nu.edu.eg</span>
            </div>

            <a
              href="mailto:su@nu.edu.eg"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-foreground text-xs font-bold hover:bg-brand hover:text-white dark:hover:bg-brand transition-colors min-h-[44px]"
            >
              <Mail className="size-4" />
              <span>Email NUSU</span>
            </a>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-ash dark:text-zinc-500 relative z-10">
        <p>SU Card &bull; Nile University Student Union (NUSU)</p>
      </footer>
    </div>
  );
}
