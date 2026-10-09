"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-5 shrink-0 text-emerald-500" />,
        info: <InfoIcon className="size-5 shrink-0 text-sky-500" />,
        warning: <TriangleAlertIcon className="size-5 shrink-0 text-amber-500" />,
        error: <OctagonXIcon className="size-5 shrink-0 text-rose-500" />,
        loading: (
          <Loader2Icon className="size-5 shrink-0 animate-spin text-brand dark:text-brand-soft" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group font-sans rounded-2xl border-2 border-border bg-card text-card-foreground shadow-2xl p-4 text-sm font-semibold max-w-[calc(100vw-32px)] sm:max-w-md w-full",
          description:
            "text-xs text-muted-foreground font-medium mt-0.5 [overflow-wrap:anywhere]",
          actionButton:
            "min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white dark:text-midnight bg-brand hover:brightness-110 active:scale-[0.97] transition-[transform,background-color,color] duration-140 cursor-pointer",
          cancelButton:
            "min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-muted text-foreground hover:bg-muted/80 active:scale-[0.97] transition-[transform,background-color,color] duration-140 cursor-pointer",
          closeButton:
            "!min-h-[44px] !min-w-[44px] !w-11 !h-11 !rounded-xl !bg-card !border-2 !border-border !text-foreground hover:!bg-muted hover:!border-border active:!scale-[0.97] transition-[transform,background-color,color] duration-140 !cursor-pointer",
        },
      }}
      {...props}
    />
  );
};

