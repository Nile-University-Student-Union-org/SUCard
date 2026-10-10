"use client";

import React, { useState } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { EncodingSection } from "../options/encoding-section";
import { DotsSection } from "../options/dots-section";
import { EyesSection } from "../options/eyes-section";
import { ColorSection } from "../options/color-section";
import { LogoSection } from "../options/logo-section";
import { FrameSection } from "../options/frame-section";
import { OutputSection } from "../options/output-section";
import {
  Binary,
  Shapes,
  Eye,
  Palette,
  Image as ImageIcon,
  Square,
  Printer,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "cn";

export interface OptionsSidebarProps {
  config: QrStyleConfig;
  onChange: (updater: (prev: QrStyleConfig) => QrStyleConfig) => void;
  onResetSection: (sectionKey: keyof QrStyleConfig | "color") => void;
}

type SectionKey =
  | "encoding"
  | "modules"
  | "eyes"
  | "color"
  | "logo"
  | "frame"
  | "output";

interface SectionDef {
  key: SectionKey;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const SECTIONS: SectionDef[] = [
  { key: "encoding", title: "Encoding & Quiet Zone", icon: Binary },
  { key: "modules", title: "Data Dots (Modules)", icon: Shapes },
  { key: "eyes", title: "Finder Eyes & Pupils", icon: Eye },
  { key: "color", title: "Colors & Background", icon: Palette },
  { key: "logo", title: "Logo & Brand Plate", icon: ImageIcon },
  { key: "frame", title: "Outer Frame & Label", icon: Square },
  { key: "output", title: "Output Scale & DPI", icon: Printer },
];

export const OptionsSidebar: React.FC<OptionsSidebarProps> = ({
  config,
  onChange,
  onResetSection,
}) => {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    encoding: false,
    modules: true,
    eyes: true,
    color: true,
    logo: false,
    frame: false,
    output: false,
  });

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3 pb-8">
      {SECTIONS.map((sec) => {
        const isOpen = openSections[sec.key];
        const Icon = sec.icon;

        return (
          <div
            key={sec.key}
            className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between gap-1 pl-3 pr-1 py-1 bg-slate-50/70 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => toggleSection(sec.key)}
                aria-expanded={isOpen}
                aria-controls={`qr-option-${sec.key}`}
                id={`qr-option-heading-${sec.key}`}
                className="flex items-center gap-2 min-w-0 min-h-11 flex-1 text-left cursor-pointer group select-none"
              >
                <div className="size-7 rounded-lg bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center shrink-0">
                  <Icon className="size-3.5" />
                </div>
                <span className="font-semibold text-xs text-foreground group-hover:text-brand break-words">
                  {sec.title}
                </span>
              </button>

              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => onResetSection(sec.key)}
                  className="size-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
                  title={`Reset ${sec.title} to default`}
                  aria-label={`Reset ${sec.title}`}
                >
                  <RotateCcw className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className="size-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${sec.title}`}
                  aria-expanded={isOpen}
                  aria-controls={`qr-option-${sec.key}`}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200 motion-reduce:transition-none",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div id={`qr-option-${sec.key}`} role="region" aria-labelledby={`qr-option-heading-${sec.key}`} hidden={!isOpen} className="p-4 bg-white dark:bg-zinc-900">
              {isOpen && (
                <>
                {sec.key === "encoding" && (
                  <EncodingSection config={config} onChange={onChange} />
                )}
                {sec.key === "modules" && (
                  <DotsSection config={config} onChange={onChange} />
                )}
                {sec.key === "eyes" && (
                  <EyesSection config={config} onChange={onChange} />
                )}
                {sec.key === "color" && (
                  <ColorSection config={config} onChange={onChange} />
                )}
                {sec.key === "logo" && (
                  <LogoSection config={config} onChange={onChange} />
                )}
                {sec.key === "frame" && (
                  <FrameSection config={config} onChange={onChange} />
                )}
                {sec.key === "output" && (
                  <OutputSection config={config} onChange={onChange} />
                )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
