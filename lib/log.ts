const loggedRoutes = new Set(["/api/health", "/api/admin/qr-styles", "/api/admin/staff", "/api/vendors", "/api/student"]);
const errorNames = new Set(["Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "PostgresError"]);

export function logError(route: string, error: unknown) {
  // TODO: Send this sanitized event to Sentry when the SU owns a Sentry account.
  console.error(JSON.stringify({ level: "error", msg: "Request failed", route: loggedRoutes.has(route) ? route : "unknown",
    error: { name: error instanceof Error && errorNames.has(error.name) ? error.name : "Error" } }));
}
