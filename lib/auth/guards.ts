import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./server";

import type { StaffRole } from "@/lib/staff/types";

// CONTRACT used by admin pages and API routes; keep the signatures unchanged.

export type { StaffRole };

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
  const admin = await readAdmin(await headers());
  if (!admin) redirect("/login");
  return admin;
}

/**
 * For API route handlers: returns the signed-in admin, or null (caller responds 401).
 */
export async function getAdminFromRequest(request: Request): Promise<StaffUser | null> {
  return readAdmin(request.headers);
}

/**
 * For super-admin-only pages: returns the signed-in super admin; a signed-in admin is
 * redirected to /admin, anyone else to /login.
 */
export async function requireSuperAdminPage(): Promise<StaffUser> {
  const admin = await requireAdminPage();
  if (admin.role !== "super_admin") redirect("/admin");
  return admin;
}

// Super-admin-only API routes: call getAdminFromRequest(); respond 401 if null and
// 403 { error } if role !== "super_admin".

async function readAdmin(requestHeaders: Headers): Promise<StaffUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || (session.user.role !== "super_admin" && session.user.role !== "admin")) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role };
}
