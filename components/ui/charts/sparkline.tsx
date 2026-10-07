"use client";

import React, { useMemo } from "react";
import { cn } from "cn";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  fill?: boolean;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#018BCE",
  className,
  fill = true,
  ariaLabel = "Trend sparkline",
}: SparklineProps) {
  const { pathD, fillD } = useMemo(() => {
    if (!data || data.length < 2) return { pathD: "", fillD: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    let line = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      line += ` L ${points[i].x},${points[i].y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const area = `${line} L ${last.x},${height} L ${first.x},${height} Z`;

    return { pathD: line, fillD: area };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return <div className={cn("inline-block", className)} style={{ width, height }} />;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible inline-block shrink-0", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {fill && (
        <path
          d={fillD}
          fill={color}
          fillOpacity="0.15"
          className="transition-opacity duration-300"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
