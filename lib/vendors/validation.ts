import { z } from "zod";
import { STAFF_PASSWORD_MAX, STAFF_PASSWORD_MIN } from "@/lib/staff/types";
const optionalText = z.string().trim().max(2000).nullable();
const short = z.string().trim().min(1).max(160);
const day = z.iso.date().nullable();
export const idSchema = z.uuid();
export const vendorBody = z.strictObject({
  name: short,
  category: z.enum(["food", "coffee", "fitness", "books", "services", "other"]),
  contactName: optionalText,
  contactPhone: optionalText,
  contactEmail: z.email().nullable(),
  location: optionalText,
  contractStart: day,
  contractEnd: day,
  status: z.enum(["active", "paused", "ended"]),
  notes: optionalText
}).refine(v => !v.contractStart || !v.contractEnd || v.contractStart <= v.contractEnd, "Contract end precedes start");
export const vendorPatch = z.strictObject(vendorBody.shape).partial().refine(v => Object.keys(v).length > 0, "No changes supplied");
export const offerBody = z.strictObject({
  title: short,
  description: optionalText,
  discountType: z.enum(["percent", "fixed", "free_item", "custom"]),
  discountValue: z.union([z.string(), z.number()]).nullable(),
  discountText: optionalText,
  terms: optionalText,
  startsAt: day,
  endsAt: day,
  activeDays: z.array(z.number().int().min(0).max(6)).max(7),
  activeFrom: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/).nullable(),
  activeTo: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/).nullable(),
  visible: z.boolean(),
  limitCount: z.number().int().positive().nullable(),
  limitPeriod: z.enum(["day", "week", "month", "semester", "total", "unlimited"]),
  status: z.enum(["active", "paused"])
}).superRefine((v, c) => {
  if (v.startsAt && v.endsAt && v.startsAt > v.endsAt) c.addIssue({
    code: "custom",
    message: "Offer end precedes start"
  });
  if (v.limitPeriod === "unlimited" && v.limitCount !== null || v.limitPeriod !== "unlimited" && v.limitCount === null) c.addIssue({
    code: "custom",
    message: "Limit count and period disagree"
  });
  if (v.discountValue !== null && (!Number.isFinite(Number(v.discountValue)) || Number(v.discountValue) <= 0 || Number(v.discountValue) > 100000 || v.discountType === "percent" && Number(v.discountValue) > 100)) c.addIssue({
    code: "custom",
    message: "Invalid discount value"
  });
});
export const offerPatch = z.strictObject(offerBody.shape).partial().refine(v => Object.keys(v).length > 0, "No changes supplied");
export const accountBody = z.strictObject({
  email: z.email().transform(v => v.toLowerCase()),
  name: short,
  password: z.string().min(STAFF_PASSWORD_MIN).max(STAFF_PASSWORD_MAX).optional(),
  role: z.enum(["cashier", "vendor_manager"])
});
export const accountPatch = z.strictObject({
  name: short.optional(),
  status: z.enum(["active", "disabled"]).optional()
}).refine(v => Object.keys(v).length > 0);
export const passwordBody = z.strictObject({
  password: z.string().min(STAFF_PASSWORD_MIN).max(STAFF_PASSWORD_MAX)
});
export const validateBody = z.strictObject({
  qr: z.string().trim().min(1).max(1000)
});
export const confirmBody = z.strictObject({
  scanId: z.uuid(),
  offerId: z.uuid(),
  billAmount: z.number().positive().max(100000).multipleOf(0.01).optional()
});
export const voidBody = z.strictObject({
  reason: z.string().trim().min(1).max(500)
});
export const redemptionQuery = z.strictObject({
  vendorId: z.uuid().optional(),
  result: z.string().max(50).optional(),
  confirmed: z.enum(["true", "false"]).optional(),
  cursor: z.string().max(512).optional()
});
