// CONTRACT for the staff & audit APIs (JSON shapes shared by server and admin UI).
// Keep names and shapes stable; both the backend and the UI build against this file.

export type StaffRole = "super_admin" | "admin";
export type StaffStatus = "active" | "disabled";

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  createdAt: string; // ISO
  lastLoginAt: string | null; // ISO, latest session start
  isSelf: boolean; // true for the signed-in super admin's own row
}

// GET /api/admin/staff  (super_admin only)
export interface ListStaffResponse {
  staff: StaffMember[];
}

// POST /api/admin/staff  (super_admin only) → 201
// No email service yet: the super admin sets the initial password and shares it.
export interface CreateStaffRequest {
  email: string;
  name: string;
  role: StaffRole;
  password: string;
}
export interface CreateStaffResponse {
  staff: StaffMember;
}

// PATCH /api/admin/staff/{id}  (super_admin only)
// Rules: you can't change your own role or status; there must always be at least
// one active super_admin. Disabling signs the person out everywhere.
export interface UpdateStaffRequest {
  name?: string;
  role?: StaffRole;
  status?: StaffStatus;
}
export interface UpdateStaffResponse {
  staff: StaffMember;
}

// POST /api/admin/staff/{id}/password  (super_admin only) → 204
// Sets a new password and signs that person out everywhere.
export interface ResetStaffPasswordRequest {
  password: string;
}

// GET /api/admin/audit?action=&actorId=&cursor=&limit=  (super_admin only)
// Newest first. `cursor` is the opaque nextCursor from the previous page.
export interface AuditEntry {
  id: string;
  createdAt: string; // ISO
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string; // e.g. "cards.batch_created", "staff.created"
  entity: string; // e.g. "card_batch", "staff"
  entityId: string;
  data: Record<string, unknown>;
}
export interface ListAuditResponse {
  entries: AuditEntry[];
  nextCursor: string | null;
}

// Known audit actions (UI uses this for the filter dropdown and labels).
export const AUDIT_ACTIONS = {
  "cards.batch_created": "Batch generated",
  "cards.batch_exported": "Batch exported",
  "staff.created": "Staff added",
  "staff.updated": "Staff updated",
  "staff.password_reset": "Password reset",
  "staff.promoted": "Student promoted",
  "staff.role_revoked": "Staff role revoked",
  "vendors.created": "Vendor created", "vendors.updated": "Vendor updated", "vendors.logo_updated": "Vendor logo updated",
  "branches.created": "Branch created", "branches.updated": "Branch updated",
  "offers.created": "Offer created", "offers.updated": "Offer updated",
  "vendor_accounts.created": "Vendor account created", "vendor_accounts.updated": "Vendor account updated", "vendor_accounts.password_reset": "Vendor password reset",
  "redemptions.voided": "Redemption voided",
} as const;

export const STAFF_NAME_MAX = 80;
export const STAFF_PASSWORD_MIN = 10;
export const STAFF_PASSWORD_MAX = 128;
export const AUDIT_PAGE_SIZE_DEFAULT = 50;
export const AUDIT_PAGE_SIZE_MAX = 100;
