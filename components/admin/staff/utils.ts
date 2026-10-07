export function generateSecurePassword(length = 16): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // omitted easily confused I, O
  const lowers = "abcdefghijkmnopqrstuvwxyz"; // omitted easily confused l
  const digits = "23456789"; // omitted easily confused 0, 1
  const symbols = "!@#$%^&*()-_=+[]{}";
  const all = uppers + lowers + digits + symbols;

  const getRandomChar = (charset: string): string => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return charset[array[0] % charset.length];
  };

  // Guarantee one from each category
  const chars: string[] = [
    getRandomChar(uppers),
    getRandomChar(lowers),
    getRandomChar(digits),
    getRandomChar(symbols),
  ];

  // Fill remainder
  for (let i = chars.length; i < length; i++) {
    chars.push(getRandomChar(all));
  }

  // Shuffle array using Fisher-Yates with crypto
  for (let i = chars.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join("");
}

export function formatCairoDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "Never";

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;

    return formatCairoDate(isoString);
  } catch {
    return isoString;
  }
}
