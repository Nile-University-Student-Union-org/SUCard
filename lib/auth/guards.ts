import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "./server";
import { db } from "@/lib/db";
import { account, studentProfiles, user, vendors } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings/service";
import { matchesStudentEmail } from "@/lib/student/rules";

import type { StaffRole } from "@/lib/staff/types";
import { adminDecision } from "./policy";

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
  const result = await readAdminDecision(await headers());
  if (result.decision === "setup") redirect("/admin-2fa/setup");
  if (!result.admin) notFound();
  return result.admin;
}
export async function requireTwoFactorSetupPage(): Promise<StaffUser> {
  const result = await readAdminDecision(await headers());
  if (result.decision !== "setup" || !result.admin) redirect("/go");
  return result.admin;
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
  const result = await readAdminDecision(requestHeaders);
  return result.decision === "allow" ? result.admin : null;
}
async function readAdminDecision(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { decision: "deny" as const, admin: null };
  const [current] = await db.select({ role: user.role, disabledAt: user.disabledAt, email: user.email, name: user.name,
    twoFactorEnabled: user.twoFactorEnabled }).from(user).where(eq(user.id, session.user.id));
  if (!current || current.disabledAt || (current.role !== "super_admin" && current.role !== "admin")) return { decision: "deny" as const, admin: null };
  return { decision: adminDecision(current.role, session.session.loginMethod, current.twoFactorEnabled),
    admin: { id: session.user.id, email: current.email, name: current.name, role: current.role } };
}

export async function getCurrentUser(requestHeaders: Headers) {
  const currentSession = await auth.api.getSession({ headers: requestHeaders });
  if (!currentSession) return null;
  const [person] = await db.select().from(user).where(eq(user.id, currentSession.user.id));
  return person ?? null;
}
export async function getStudentFromRequest(request: Request) {
  const person = await getCurrentUser(request.headers);
  if (!person || person.disabledAt) return null;
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, person.id));
  return profile ? { user: person, profile } : null;
}
export async function requireStudentPage() {
  const person = await getCurrentUser(await headers());
  if (!person) redirect("/login");
  if (person.disabledAt) redirect("/login?error=disabled");
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, person.id));
  if (profile) return { user: person, profile };
  const [microsoft] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, person.id), eq(account.providerId, "microsoft")));
  if (microsoft && matchesStudentEmail(person.email, (await getSettings()).studentEmailPattern)) redirect("/welcome");
  notFound();
}
export async function requireOnboardingPage() {
  const person = await getCurrentUser(await headers());
  if (!person) redirect("/login");
  if (person.disabledAt) redirect("/login?error=disabled");
  const [profile] = await db.select({ id: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.userId, person.id));
  const [microsoft] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, person.id), eq(account.providerId, "microsoft")));
  if (!profile && microsoft && matchesStudentEmail(person.email, (await getSettings()).studentEmailPattern)) return person;
  redirect("/go");
}

async function readVendorActor(requestHeaders: Headers, role: "cashier" | "vendor_manager") {
  const person = await getCurrentUser(requestHeaders);
  if (!person || person.disabledAt || person.role !== role || !person.vendorId) return null;
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, person.vendorId));
  if (!vendor) return null;
  return { person, vendor };
}
export async function getCashierFromRequest(request: Request) { return readVendorActor(request.headers, "cashier"); }
export async function requireCashierPage() {
  const person = await getCurrentUser(await headers());
  if (!person) redirect("/login");
  const actor = await readVendorActor(await headers(), "cashier");
  if (!actor) notFound();
  return actor;
}
export async function requireVendorManagerPage() {
  const person = await getCurrentUser(await headers());
  if (!person) redirect("/login");
  const actor = await readVendorActor(await headers(), "vendor_manager");
  if (!actor) notFound();
  return actor;
}
/** Enabled manager with a real vendor, scoped to that vendor for API handlers. */
export async function getVendorManagerFromRequest(request: Request) {
  return readVendorActor(request.headers, "vendor_manager");
}
