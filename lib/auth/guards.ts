import "server-only";

// CONTRACT used by admin pages and API routes. The backend task replaces the body
// with a real Better Auth session check; keep the signatures unchanged.

export type StaffRole = "super_admin" | "admin";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
}

/**
 * For server components/pages: returns the signed-in admin, or redirects to /login.
 */
export async function requireAdminPage(): Promise<StaffUser> {
  throw new Error("requireAdminPage: not implemented yet (backend task)");
}

/**
 * For API route handlers: returns the signed-in admin, or null (caller responds 401).
 */
export async function getAdminFromRequest(_request: Request): Promise<StaffUser | null> {
  throw new Error("getAdminFromRequest: not implemented yet (backend task)");
}
