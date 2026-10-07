import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "./server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
 * For server components/pages: returns the signed-in admin; anyone else gets a 404
 * (we don't reveal that the admin panel exists).
 */
export async function requireAdminPage(): Promise<StaffUser> {
  const admin = await readAdmin(await headers());
  if (!admin) notFound();
  return admin;
}

/**
 * For API route handlers: returns the signed-in admin, or null (caller responds 401).
 */
export async function getAdminFromRequest(request: Request): Promise<StaffUser | null> {
  return readAdmin(request.headers);
}

/**
 * For super-admin-only pages: returns the signed-in super admin; anyone else gets a 404.
 */
export async function requireSuperAdminPage(): Promise<StaffUser> {
  const admin = await requireAdminPage();
  if (admin.role !== "super_admin") notFound();
  return admin;
}

// Super-admin-only API routes: call getAdminFromRequest(); respond 401 if null and
// 403 { error } if role !== "super_admin".

async function readAdmin(requestHeaders: Headers): Promise<StaffUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session || (session.user.role !== "super_admin" && session.user.role !== "admin")) return null;
  const [current] = await db.select({ role: user.role, disabledAt: user.disabledAt, email: user.email, name: user.name }).from(user).where(eq(user.id, session.user.id));
  if (!current || current.disabledAt || (current.role !== "super_admin" && current.role !== "admin")) return null;
  return { id: session.user.id, email: current.email, name: current.name, role: current.role };
}
