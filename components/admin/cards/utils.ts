/**
 * Format a number using standard English notation.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a batch number to zero-padded string (e.g. 3 -> "Batch 003").
 */
export function formatBatchNumber(num: number): string {
  return `Batch ${String(num).padStart(3, "0")}`;
}

/**
 * Format an ISO date string in the Africa/Cairo timezone.
 */
export function formatCairoDate(isoString: string): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}
