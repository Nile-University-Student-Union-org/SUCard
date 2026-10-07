export function logError(route: string, error: unknown) {
  const e = error instanceof Error ? error : new Error("Unknown error");
  // TODO: Send this sanitized event to Sentry when the SU owns a Sentry account.
  console.error(JSON.stringify({ level: "error", msg: "Request failed", route, error: { name: e.name, message: e.message, stack: e.stack } }));
}
