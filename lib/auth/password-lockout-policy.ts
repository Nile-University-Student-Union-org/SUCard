export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_FAILURE_LIMIT = 5;

export function passwordLocked(count: number, lastFailedAt: Date, now = new Date()): boolean {
  return count >= LOCKOUT_FAILURE_LIMIT && now.getTime() - lastFailedAt.getTime() < LOCKOUT_WINDOW_MS;
}
