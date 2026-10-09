interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface DatePickerPlacementParams {
  anchor: Bounds;
  panel: { width: number; height: number };
  bounds: Bounds;
  align: "left" | "right" | "center";
  placement: "bottom" | "top" | "auto";
}

/** Physical coordinates work identically in LTR and RTL layouts. */
export function datePickerPlacement({
  anchor,
  panel,
  bounds,
  align,
  placement,
}: DatePickerPlacementParams) {
  const gap = 8;
  const width = Math.min(panel.width, Math.max(0, bounds.right - bounds.left));
  const height = Math.min(panel.height, Math.max(0, bounds.bottom - bounds.top));
  const desiredLeft =
    align === "right"
      ? anchor.right - width
      : align === "center"
        ? (anchor.left + anchor.right - width) / 2
        : anchor.left;
  const below = bounds.bottom - anchor.bottom - gap;
  const above = anchor.top - bounds.top - gap;
  const preferTop = placement === "top";
  const top = preferTop
    ? above >= height || above > below
    : below < height && above > below;
  const desiredTop = top ? anchor.top - height - gap : anchor.bottom + gap;
  return {
    left: Math.max(bounds.left, Math.min(desiredLeft, bounds.right - width)),
    top: Math.max(bounds.top, Math.min(desiredTop, bounds.bottom - height)),
    width,
    maxHeight: Math.max(0, bounds.bottom - bounds.top),
  };
}
