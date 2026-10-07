"use client";

import React, { useMemo } from "react";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { renderQrSvgFromConfig } from "@/lib/qr-style/render-core";
import { useNusuLogo } from "./use-nusu-logo";
import { cn } from "cn";

export const DEFAULT_SAMPLE_PAYLOAD = "NUSU1:0123456789ABCDEFGHJK";

export interface QrSvgPreviewProps {
  config: QrStyleConfig;
  payload?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  logoDataUriOverride?: string;
}

export const QrSvgPreview: React.FC<QrSvgPreviewProps> = React.memo(
  function QrSvgPreview({
    config,
    payload = DEFAULT_SAMPLE_PAYLOAD,
    className,
    style,
    title,
    logoDataUriOverride,
  }) {
    const { logoDataUri: defaultLogoUri } = useNusuLogo();
    const activeLogoUri = logoDataUriOverride ?? defaultLogoUri;

    const svgContent = useMemo(() => {
      try {
        return renderQrSvgFromConfig(payload, config, {
          logoDataUri: config.logo.type === "nusu" ? activeLogoUri : undefined,
        });
      } catch (err) {
        console.warn("Failed to render QR SVG preview:", err);
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle" fill="#EF4444" font-size="10">Render error</text></svg>`;
      }
    }, [payload, config, activeLogoUri]);

    return (
      <div
        className={cn(
          "relative flex items-center justify-center select-none overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full",
          className
        )}
        style={style}
        title={title}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }
);
