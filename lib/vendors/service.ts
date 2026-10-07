import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, lt, max, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { account, auditLog, branches, offerRevisions, offers, scanEvents, session, user, vendorLogos, vendors } from "@/lib/db/schema";
import type { z } from "zod";
import { offerBody, vendorBody, type accountBody, type accountPatch, type branchBody, type branchPatch, type offerPatch, type vendorPatch } from "./validation";
export class VendorError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}
const missing = (thing: string): never => {
  throw new VendorError(404, `${thing} not found`);
};
const mergedFields = (shape: Record<string, unknown>, before: object, patch: object) => Object.fromEntries(Object.keys(shape).map(key => [key, key in patch ? (patch as Record<string, unknown>)[key] : (before as Record<string, unknown>)[key]]));
const audit = (tx: Pick<typeof db, "insert">, actorId: string, action: string, entity: string, entityId: string, before: unknown, after: unknown) => tx.insert(auditLog).values({
  actorId,
  action,
  entity,
  entityId,
  data: {
    before,
    after
  }
});
export const vendorDto = (v: typeof vendors.$inferSelect) => ({
  ...v,
  logoUrl: v.logoId ? `/api/vendors/${v.id}/logo` : null,
  createdAt: v.createdAt.toISOString(),
  updatedAt: v.updatedAt.toISOString()
});
export const offerDto = (v: typeof offers.$inferSelect) => ({
  ...v,
  createdAt: v.createdAt.toISOString(),
  updatedAt: v.updatedAt.toISOString()
});
export async function listVendors() {
  return (await db.select().from(vendors).orderBy(asc(vendors.name))).map(vendorDto);
}
export async function getVendor(id: string) {
  const [v] = await db.select().from(vendors).where(eq(vendors.id, id));
  return v ? vendorDto(v) : missing("Vendor");
}
export async function createVendor(input: z.infer<typeof vendorBody>, actorId: string) {
  return db.transaction(async tx => {
    const [v] = await tx.insert(vendors).values(input).returning();
    await audit(tx, actorId, "vendors.created", "vendor", v.id, null, v);
    return vendorDto(v);
  });
}
export async function updateVendor(id: string, patch: z.infer<typeof vendorPatch>, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(vendors).where(eq(vendors.id, id)).for("update");
    if (!before) missing("Vendor");
    vendorBody.parse(mergedFields(vendorBody.shape, before, patch));
    const [after] = await tx.update(vendors).set({
      ...patch,
      updatedAt: new Date()
    }).where(eq(vendors.id, id)).returning();
    await audit(tx, actorId, "vendors.updated", "vendor", id, before, after);
    return vendorDto(after);
  });
}
export async function setLogo(id: string, bytes: Buffer, mime: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(vendors).where(eq(vendors.id, id)).for("update");
    if (!before) missing("Vendor");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const [logo] = await tx.insert(vendorLogos).values({
      data: bytes,
      mime,
      sha256
    }).returning();
    const [after] = await tx.update(vendors).set({
      logoId: logo.id,
      updatedAt: new Date()
    }).where(eq(vendors.id, id)).returning();
    await audit(tx, actorId, "vendors.logo_updated", "vendor", id, {
      logoId: before.logoId
    }, {
      logoId: logo.id,
      sha256
    });
    return vendorDto(after);
  });
}
export async function listBranches(vendorId: string) {
  await getVendor(vendorId);
  return db.select().from(branches).where(eq(branches.vendorId, vendorId)).orderBy(asc(branches.name));
}
export async function createBranch(vendorId: string, input: z.infer<typeof branchBody>, actorId: string) {
  return db.transaction(async tx => {
    const [v] = await tx.select({
      id: vendors.id
    }).from(vendors).where(eq(vendors.id, vendorId));
    if (!v) missing("Vendor");
    const [row] = await tx.insert(branches).values({
      ...input,
      vendorId
    }).returning();
    await audit(tx, actorId, "branches.created", "branch", row.id, null, row);
    return row;
  });
}
export async function updateBranch(id: string, patch: z.infer<typeof branchPatch>, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(branches).where(eq(branches.id, id)).for("update");
    if (!before) missing("Branch");
    const [after] = await tx.update(branches).set(patch).where(eq(branches.id, id)).returning();
    await audit(tx, actorId, "branches.updated", "branch", id, before, after);
    return after;
  });
}
export async function listOffers(vendorId: string) {
  await getVendor(vendorId);
  return (await db.select().from(offers).where(eq(offers.vendorId, vendorId)).orderBy(asc(offers.title))).map(offerDto);
}
export async function getOffer(id: string) {
  const [offer] = await db.select().from(offers).where(eq(offers.id, id));
  return offer ? offerDto(offer) : missing("Offer");
}
export async function createOffer(vendorId: string, input: z.infer<typeof offerBody>, actorId: string) {
  return db.transaction(async tx => {
    const [v] = await tx.select({
      id: vendors.id
    }).from(vendors).where(eq(vendors.id, vendorId));
    if (!v) missing("Vendor");
    const [row] = await tx.insert(offers).values({
      ...input,
      discountValue: input.discountValue === null ? null : String(input.discountValue),
      vendorId
    }).returning();
    const dto = offerDto(row);
    await tx.insert(offerRevisions).values({
      offerId: row.id,
      version: 1,
      snapshot: dto,
      changedBy: actorId
    });
    await audit(tx, actorId, "offers.created", "offer", row.id, null, dto);
    return dto;
  });
}
export async function updateOffer(id: string, patch: z.infer<typeof offerPatch>, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(offers).where(eq(offers.id, id)).for("update");
    if (!before) missing("Offer");
    offerBody.parse(mergedFields(offerBody.shape, before, patch));
    const [after] = await tx.update(offers).set({
      ...patch,
      discountValue: patch.discountValue === undefined ? before.discountValue : patch.discountValue === null ? null : String(patch.discountValue),
      updatedAt: new Date()
    }).where(eq(offers.id, id)).returning();
    const [last] = await tx.select({
      version: max(offerRevisions.version)
    }).from(offerRevisions).where(eq(offerRevisions.offerId, id));
    const dto = offerDto(after);
    await tx.insert(offerRevisions).values({
      offerId: id,
      version: (last.version ?? 0) + 1,
      snapshot: dto,
      changedBy: actorId
    });
    await audit(tx, actorId, "offers.updated", "offer", id, offerDto(before), dto);
    return dto;
  });
}
export async function listRevisions(id: string) {
  await getOffer(id);
  return db.select().from(offerRevisions).where(eq(offerRevisions.offerId, id)).orderBy(desc(offerRevisions.version));
}
const accountDto = (u: typeof user.$inferSelect) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  vendorId: u.vendorId,
  branchId: u.branchId,
  status: u.disabledAt ? "disabled" : "active"
});
export async function listAccounts(vendorId: string) {
  await getVendor(vendorId);
  return (await db.select().from(user).where(and(eq(user.vendorId, vendorId), or(eq(user.role, "cashier"), eq(user.role, "vendor_manager"))))).map(accountDto);
}
export async function createAccount(vendorId: string, input: z.infer<typeof accountBody>, actorId: string) {
  await getVendor(vendorId);
  if (input.role === "cashier") {
    if (!input.branchId) throw new VendorError(400, "Cashier requires a branch");
    const [branch] = await db.select().from(branches).where(and(eq(branches.id, input.branchId), eq(branches.vendorId, vendorId)));
    if (!branch) throw new VendorError(400, "Branch does not belong to vendor");
  } else if (input.branchId) throw new VendorError(400, "Vendor manager cannot have a branch");
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(input.email)) throw new VendorError(409, "Email already exists");
  const hash = await ctx.password.hash(input.password);
  let created: {
    id: string;
  };
  try {
    created = await ctx.internalAdapter.createUser({
      email: input.email,
      name: input.name,
      emailVerified: true,
      role: input.role
    }, {
      method: "email-password"
    });
  } catch (error) {
    if ((error as {
      code?: string;
    }).code === "23505") throw new VendorError(409, "Email already exists");
    throw error;
  }
  try {
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      accountId: created.id,
      providerId: "credential",
      password: hash
    });
    await db.transaction(async tx => {
      await tx.update(user).set({
        vendorId,
        branchId: input.role === "cashier" ? input.branchId : null
      }).where(eq(user.id, created.id));
      await audit(tx, actorId, "vendor_accounts.created", "user", created.id, null, {
        email: input.email,
        role: input.role,
        vendorId,
        branchId: input.branchId ?? null
      });
    });
  } catch (error) {
    await ctx.internalAdapter.deleteUser(created.id);
    throw error;
  }
  const [row] = await db.select().from(user).where(eq(user.id, created.id));
  return accountDto(row);
}
export async function updateAccount(id: string, patch: z.infer<typeof accountPatch>, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(user).where(eq(user.id, id)).for("update");
    if (!before || before.role !== "cashier" && before.role !== "vendor_manager" || !before.vendorId) missing("Vendor account");
    const vendorId = before.vendorId!;
    if (patch.branchId !== undefined) {
      if (before.role !== "cashier" || !patch.branchId) throw new VendorError(400, "Cashier requires a branch");
      const [branch] = await tx.select().from(branches).where(and(eq(branches.id, patch.branchId), eq(branches.vendorId, vendorId)));
      if (!branch) throw new VendorError(400, "Branch does not belong to vendor");
    }
    const [after] = await tx.update(user).set({
      name: patch.name ?? before.name,
      branchId: patch.branchId === undefined ? before.branchId : patch.branchId,
      disabledAt: patch.status === undefined ? before.disabledAt : patch.status === "disabled" ? new Date() : null,
      updatedAt: new Date()
    }).where(eq(user.id, id)).returning();
    if (after.disabledAt) await tx.delete(session).where(eq(session.userId, id));
    await audit(tx, actorId, "vendor_accounts.updated", "user", id, accountDto(before), accountDto(after));
    return accountDto(after);
  });
}
export async function resetAccountPassword(id: string, password: string, actorId: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await db.transaction(async tx => {
    const [u] = await tx.select().from(user).where(eq(user.id, id));
    if (!u || u.role !== "cashier" && u.role !== "vendor_manager") missing("Vendor account");
    const [a] = await tx.select().from(account).where(and(eq(account.userId, id), eq(account.providerId, "credential")));
    if (!a) missing("Credential");
    await tx.update(account).set({
      password: hash,
      updatedAt: new Date()
    }).where(eq(account.id, a.id));
    await tx.delete(session).where(eq(session.userId, id));
    await audit(tx, actorId, "vendor_accounts.password_reset", "user", id, null, {});
  });
}
export async function voidRedemption(id: string, reason: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(scanEvents).where(eq(scanEvents.id, id)).for("update");
    if (!before || !before.confirmed) missing("Redemption");
    if (before.voided) throw new VendorError(409, "Redemption already voided");
    const [after] = await tx.update(scanEvents).set({
      voided: true,
      voidedAt: new Date(),
      voidedBy: actorId,
      voidReason: reason
    }).where(eq(scanEvents.id, id)).returning();
    await audit(tx, actorId, "redemptions.voided", "scan_event", id, {
      voided: false
    }, {
      voided: true,
      reason
    });
    return after;
  });
}
export async function listRedemptions(query: {
  vendorId?: string;
  result?: string;
  confirmed?: string;
  cursor?: string;
}) {
  let cursor: {
    at: string;
    id: string;
  } | null = null;
  if (query.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8"));
      if (typeof decoded.at !== "string" || typeof decoded.id !== "string" || !/^[\da-f-]{36}$/.test(decoded.id) || !Number.isFinite(Date.parse(decoded.at))) throw Error();
      cursor = decoded;
    } catch {
      throw new VendorError(400, "Invalid cursor");
    }
  }
  const student = sql<string | null>`(select u.name from "user" u where u.id = ${scanEvents.studentId})`;
  const universityId = sql<string | null>`(select sp.university_id from student_profiles sp where sp.user_id = ${scanEvents.studentId})`;
  const rows = await db.select({
    scan: scanEvents,
    vendorName: vendors.name,
    branchName: branches.name,
    cashierName: user.name,
    offerTitle: offers.title,
    studentName: student,
    universityId,
    exactCreatedAt: sql<string>`to_char(${scanEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`
  }).from(scanEvents).innerJoin(vendors, eq(scanEvents.vendorId, vendors.id)).innerJoin(branches, eq(scanEvents.branchId, branches.id)).innerJoin(user, eq(scanEvents.cashierId, user.id)).leftJoin(offers, eq(scanEvents.offerId, offers.id)).where(and(query.vendorId ? eq(scanEvents.vendorId, query.vendorId) : undefined, query.result ? eq(scanEvents.result, query.result) : undefined, query.confirmed ? eq(scanEvents.confirmed, query.confirmed === "true") : undefined, cursor ? or(sql`${scanEvents.createdAt} < ${cursor.at}::timestamptz`, and(sql`${scanEvents.createdAt} = ${cursor.at}::timestamptz`, lt(scanEvents.id, cursor.id))) : undefined)).orderBy(desc(scanEvents.createdAt), desc(scanEvents.id)).limit(51);
  const page = rows.slice(0, 50);
  const last = page.at(-1);
  return {
    redemptions: page.map(({
      scan,
      vendorName,
      branchName,
      cashierName,
      offerTitle,
      studentName,
      universityId
    }) => ({
      id: scan.id,
      createdAt: scan.createdAt.toISOString(),
      result: scan.result,
      reason: scan.reason,
      confirmed: scan.confirmed,
      confirmedAt: scan.confirmedAt?.toISOString() ?? null,
      billAmount: scan.billAmount,
      voided: scan.voided,
      voidReason: scan.voidReason,
      studentName,
      universityId,
      vendorName,
      branchName,
      cashierName,
      offerTitle
    })),
    nextCursor: rows.length > 50 && last ? Buffer.from(JSON.stringify({
      at: last.exactCreatedAt,
      id: last.scan.id
    })).toString("base64url") : null
  };
}

