"use client";

import React, { useState, useRef, useId, useMemo, useCallback } from "react";
import { cn } from "cn";

export interface AreaChartDataPoint {
  label: string;
  value: number;
  formattedLabel?: string;
  meta?: Record<string, unknown>;
}

export interface AreaChartProps {
  data: AreaChartDataPoint[];
  height?: number;
  accentColor?: string;
  valueLabel?: string;
  valueFormatter?: (val: number) => string;
  labelFormatter?: (label: string) => string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
  ariaLabel?: string;
}

export function AreaChart({
  data,
  height = 240,
  accentColor = "#018BCE",
  valueLabel = "Redemptions",
  valueFormatter = (val) => new Intl.NumberFormat("en-GB").format(val),
  labelFormatter = (label) => label,
  title,
  description,
  emptyMessage = "No data available for this time range.",
  className,
  ariaLabel = "Redemptions over time chart",
}: AreaChartProps) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Chart dimensions & margins
  const padding = { top: 20, right: 16, bottom: 32, left: 42 };
  const viewBoxWidth = 600;
  const viewBoxHeight = height;
  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = viewBoxHeight - padding.top - padding.bottom;

  // Min / Max computation
  const { points, yTicks, xTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxValue: 0, points: [], yTicks: [], xTicks: [] };
    }

    const rawMax = Math.max(...data.map((d) => d.value), 0);
    // Find clean round max
    let max = rawMax === 0 ? 10 : rawMax;
    if (max <= 5) max = 5;
    else if (max <= 10) max = 10;
    else if (max <= 25) max = 25;
    else if (max <= 50) max = 50;
    else if (max <= 100) max = 100;
    else {
      const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
      max = Math.ceil(max / magnitude) * magnitude;
    }

    // Y ticks (4-5 divisions)
    const tickCount = 4;
    const yTicksArr = Array.from({ length: tickCount + 1 }, (_, i) => {
      const val = Math.round((max / tickCount) * i);
      const y = padding.top + chartHeight - (val / max) * chartHeight;
      return { value: val, y };
    });

    // Compute coordinate points
    const pts = data.map((d, i) => {
      const x =
        data.length === 1
          ? padding.left + chartWidth / 2
          : padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.value / max) * chartHeight;
      return { x, y, data: d, index: i };
    });

    // X ticks: thin out labels so they don't crowd
    const maxXTicks = Math.min(data.length, chartWidth > 400 ? 7 : 5);
    const step = Math.max(1, Math.floor(data.length / maxXTicks));
    const xTicksArr = pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % step === 0);

    return { maxValue: max, points: pts, yTicks: yTicksArr, xTicks: xTicksArr };
  }, [data, chartWidth, chartHeight, padding.left, padding.top]);

  // Generate SVG curve path using Monotone / Smooth Bezier
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };
    if (points.length === 1) {
      const p = points[0];
      const lp = `M ${padding.left},${p.y} L ${padding.left + chartWidth},${p.y}`;
      const ap = `M ${padding.left},${p.y} L ${padding.left + chartWidth},${p.y} L ${padding.left + chartWidth},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;
      return { linePath: lp, areaPath: ap };
    }

    // Build smooth cubic bezier curve
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const area = `${d} L ${last.x},${padding.top + chartHeight} L ${first.x},${padding.top + chartHeight} Z`;

    return { linePath: d, areaPath: area };
  }, [points, chartWidth, chartHeight, padding.left, padding.top]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!points.length || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;

      // Find closest point
      let closestIdx = 0;
      let minDistance = Infinity;
      points.forEach((p, idx) => {
        const dist = Math.abs(p.x - relativeX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      const pt = points[closestIdx];
      setHoverIndex(closestIdx);
      setTooltipPos({
        x: (pt.x / viewBoxWidth) * rect.width,
        y: (pt.y / viewBoxHeight) * rect.height,
      });
    },
    [points, viewBoxWidth, viewBoxHeight]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null);
    setTooltipPos(null);
  }, []);

  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  return (
    <div className={cn("w-full relative select-none", className)}>
      {title && (
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ash dark:text-zinc-400">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Accessible Table Fallback for Screen Readers */}
      <table className="sr-only">
        <caption>{title || ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Date / Period</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!hasData && (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground"
          style={{ height }}
        >
          <p className="font-semibold">{emptyMessage}</p>
        </div>
      )}

      {hasData && (
        <div ref={containerRef} className="relative w-full">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full overflow-visible touch-none"
            style={{ height: "auto", maxHeight: height }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            role="img"
            aria-label={ariaLabel}
          >
            <defs>
              <linearGradient id={`area-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
                <stop offset="90%" stopColor={accentColor} stopOpacity="0.0" />
              </linearGradient>
              <filter id={`shadow-${gradientId}`} x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={accentColor} floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((tick, i) => (
              <g key={i} className="text-slate-400 dark:text-zinc-600">
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={padding.left + chartWidth}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  className="fill-ash dark:fill-zinc-400 font-mono text-[10px] font-semibold select-none"
                >
                  {valueFormatter(tick.value)}
                </text>
              </g>
            ))}

            {/* Gradient Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#area-grad-${gradientId})`}
                className="transition-all duration-300 motion-reduce:transition-none"
              />
            )}

            {/* Trend Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300 motion-reduce:transition-none"
              />
            )}

            {/* X-Axis Labels */}
            {xTicks.map((tick, i) => (
              <text
                key={i}
                x={tick.x}
                y={viewBoxHeight - 8}
                textAnchor="middle"
                className="fill-ash dark:fill-zinc-400 font-mono text-[10px] font-semibold select-none"
              >
                {labelFormatter(tick.data.label)}
              </text>
            ))}

            {/* Active Hover Marker */}
            {hoverIndex !== null && points[hoverIndex] && (
              <g className="transition-transform duration-100 ease-out">
                {/* Vertical guide line */}
                <line
                  x1={points[hoverIndex].x}
                  y1={padding.top}
                  x2={points[hoverIndex].x}
                  y2={padding.top + chartHeight}
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.8"
                />
                {/* Outer halo */}
                <circle
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r="7"
                  fill={accentColor}
                  fillOpacity="0.2"
                  className="animate-pulse"
                />
                {/* Center dot */}
                <circle
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r="4"
                  fill="#ffffff"
                  stroke={accentColor}
                  strokeWidth="2.5"
                />
              </g>
            )}
          </svg>

          {/* Floating Tooltip HTML Overlay */}
          {hoverIndex !== null && tooltipPos && points[hoverIndex] && (
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full pb-2 transition-transform duration-75 ease-out"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
              }}
            >
              <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur-md text-xs">
                <p className="font-mono text-[11px] font-bold text-ash dark:text-zinc-400">
                  {labelFormatter(points[hoverIndex].data.label)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: accentColor }} />
                  <span className="font-bold text-foreground">
                    {valueFormatter(points[hoverIndex].data.value)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{valueLabel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
