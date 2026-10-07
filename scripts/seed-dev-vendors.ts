import { config } from "dotenv";
config({
  path: ".env.local",
  quiet: true
});
config({
  path: ".env",
  quiet: true
});
if (process.env.NODE_ENV === "production") throw new Error("Dev vendor seed refuses to run in production");
async function main() {
  const {
    db,
    pool
  } = await import("../lib/db");
  const {
    vendors,
    offers,
    offerRevisions,
    user
  } = await import("../lib/db/schema");
  const {
    auth
  } = await import("../lib/auth/server");
  const {
    eq,
    and
  } = await import("drizzle-orm");
  try {
    async function vendor(name: string, category: "coffee" | "books", status: "active" | "paused") {
      const [found] = await db.select().from(vendors).where(eq(vendors.name, name));
      if (found) return found;
      const [created] = await db.insert(vendors).values({
        name,
        category,
        status
      }).returning();
      return created;
    }
    async function offer(vendorId: string, title: string, values: Partial<typeof offers.$inferInsert>) {
      const [found] = await db.select().from(offers).where(and(eq(offers.vendorId, vendorId), eq(offers.title, title)));
      const row = found ?? (await db.insert(offers).values({
        vendorId,
        title,
        discountType: "percent",
        ...values
      }).returning())[0];
      const [revision] = await db.select({
        id: offerRevisions.id
      }).from(offerRevisions).where(eq(offerRevisions.offerId, row.id));
      if (!revision) await db.insert(offerRevisions).values({
        offerId: row.id,
        version: 1,
        snapshot: {
          ...row,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString()
        }
      });
    }
    const coffee = await vendor("Campus Coffee", "coffee", "active");
    await offer(coffee.id, "15% off any drink", {
      discountType: "percent",
      discountValue: "15",
      limitCount: 1,
      limitPeriod: "day"
    });
    await offer(coffee.id, "Free cookie with any coffee", {
      discountType: "free_item",
      discountText: "Free cookie with any coffee",
      limitCount: 2,
      limitPeriod: "week",
      activeFrom: "08:00",
      activeTo: "12:00"
    });
    const books = await vendor("Book Corner", "books", "paused");
    await offer(books.id, "10% off", {
      discountType: "percent",
      discountValue: "10",
      limitPeriod: "unlimited"
    });
    const ctx = await auth.$context;
    for (const input of [{
      email: "cashier.coffee@sucard.local",
      name: "Coffee Cashier",
      role: "cashier"
    }, {
      email: "cashier.coffee2@sucard.local",
      name: "Coffee Cashier 2",
      role: "cashier"
    }, {
      email: "manager.coffee@sucard.local",
      name: "Coffee Manager",
      role: "vendor_manager"
    }] as const) {
      if (await ctx.internalAdapter.findUserByEmail(input.email)) continue;
      const hash = await ctx.password.hash("cashierpass123");
      const created = await ctx.internalAdapter.createUser({
        email: input.email,
        name: input.name,
        role: input.role,
        emailVerified: true
      }, {
        method: "email-password"
      });
      await ctx.internalAdapter.linkAccount({
        userId: created.id,
        accountId: created.id,
        providerId: "credential",
        password: hash
      });
      await db.update(user).set({
        vendorId: coffee.id
      }).where(eq(user.id, created.id));
    }
    console.log("Dev vendors seeded");
  } finally {
    await pool.end();
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
