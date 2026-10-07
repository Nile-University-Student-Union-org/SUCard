import { z } from "zod";
import { AUDIT_PAGE_SIZE_DEFAULT, AUDIT_PAGE_SIZE_MAX, STAFF_NAME_MAX, STAFF_PASSWORD_MIN, STAFF_PASSWORD_MAX } from "./types";

const role = z.enum(["super_admin", "admin"]);
const status = z.enum(["active", "disabled"]);
const name = z.string().trim().min(1).max(STAFF_NAME_MAX);
const password = z.string().min(STAFF_PASSWORD_MIN).max(STAFF_PASSWORD_MAX);

export const createStaffSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email(), name, role, password: password.optional(),
});
export const updateStaffSchema = z.strictObject({ name: name.optional(), role: role.optional(), status: status.optional() })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field");
export const resetStaffPasswordSchema = z.strictObject({ password });
export const staffIdSchema = z.string().min(1);
export const auditQuerySchema = z.strictObject({
  action: z.string().regex(/^[a-z_]+\.[a-z_]+$/).optional(),
  actorId: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(AUDIT_PAGE_SIZE_MAX).default(AUDIT_PAGE_SIZE_DEFAULT),
});
