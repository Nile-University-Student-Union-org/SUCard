import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

config({ path: ".env.local", quiet: true });
vi.mock("server-only", () => ({}));
vi.mock("@/lib/wallet/google", () => ({ syncGoogleWalletForStudent: vi.fn() }));

const url = process.env.DATABASE_URL;
const local = url && ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
const integration = local ? describe : describe.skip;

integration("claim and redemption database races", { timeout: 30_000 }, () => {
  const client = new Client({ connectionString: url });
  const suffix = randomUUID().replaceAll("-", "");
  const studentId = `test-student-${suffix}`;
  const cashierId = `test-cashier-${suffix}`;
  const vendorId = randomUUID();
  const offerId = randomUUID();
  const cardIds = [randomUUID(), randomUUID()];
  const token = [suffix.slice(0, 20).toUpperCase().replace(/[ILOU]/g, "A"), suffix.slice(10, 30).toUpperCase().replace(/[ILOU]/g, "A")];
  const serial = Math.floor(Math.random() * 100_000_000) + 100_000_000;
  let claimCard: typeof import("@/lib/student/service").claimCard;
  let validateScan: typeof import("./scan").validateScan;
  let confirmScan: typeof import("./scan").confirmScan;

  beforeAll(async () => {
    await client.connect();
    ({ claimCard } = await import("@/lib/student/service"));
    ({ validateScan, confirmScan } = await import("./scan"));
    await client.query(`insert into "user" (id, name, email, role, vendor_id) values ($1, 'Test Student', $2, 'student', null)`, [studentId, `${suffix}@test.invalid`]);
    await client.query(`insert into vendors (id, name, category) values ($1, 'Test Vendor', 'food')`, [vendorId]);
    await client.query(`insert into "user" (id, name, email, role, vendor_id) values ($1, 'Test Cashier', $2, 'cashier', $3)`, [cashierId, `cashier-${suffix}@test.invalid`, vendorId]);
    await client.query(`insert into student_profiles (user_id, university_id, card_flow) values ($1, $2, 'physical')`, [studentId, String(serial)]);
    await client.query(`insert into cards (id, serial_number, token) values ($1, $2, $3), ($4, $5, $6)`, [cardIds[0], serial, token[0], cardIds[1], serial + 1, token[1]]);
    await client.query(`insert into offers (id, vendor_id, title, discount_type, discount_value, limit_count, limit_period) values ($1, $2, 'One use', 'percent', '10', 1, 'total')`, [offerId, vendorId]);
  });

  afterAll(async () => {
    if (!local) return;
    await client.query(`delete from scan_events where cashier_id = $1`, [cashierId]);
    await client.query(`delete from card_claim_attempts where user_id = $1`, [studentId]);
    await client.query(`delete from audit_log where actor_id = $1`, [studentId]);
    await client.query(`delete from offers where id = $1`, [offerId]);
    await client.query(`delete from cards where id = any($1::uuid[])`, [cardIds]);
    await client.query(`delete from student_profiles where user_id = $1`, [studentId]);
    await client.query(`delete from "user" where id = any($1::text[])`, [[cashierId, studentId]]);
    await client.query(`delete from vendors where id = $1`, [vendorId]);
    await client.end();
  });

  it("links one card under concurrent claims and bounds repeated attempts without another Google call", async () => {
    const google = await import("@/lib/wallet/google");
    const claims = await Promise.allSettled(token.map(value => claimCard(studentId, `NUSU1:${value}`)));
    expect(claims.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const active = await client.query(`select id, token from cards where student_id = $1 and status = 'active'`, [studentId]);
    expect(active.rows).toHaveLength(1);
    expect(google.syncGoogleWalletForStudent).toHaveBeenCalledTimes(1);

    const ownQr = `NUSU1:${active.rows[0].token}`;
    for (let i = 0; i < 8; i++) await expect(claimCard(studentId, ownQr)).resolves.toHaveProperty("card.id", active.rows[0].id);
    for (let i = 0; i < 4; i++) await expect(claimCard(studentId, ownQr)).rejects.toMatchObject({ status: 429, code: "rate_limited" });
    const attempts = await client.query(`select count(*)::int as n from card_claim_attempts where user_id = $1`, [studentId]);
    expect(attempts.rows[0].n).toBe(10);
    expect(google.syncGoogleWalletForStudent).toHaveBeenCalledTimes(1);
    await expect(claimCard(studentId, ownQr)).rejects.toMatchObject({ status: 429, code: "rate_limited" });
  });

  it("allows only one concurrent confirmation for a one-use offer", async () => {
    const actor = { person: { id: cashierId }, vendor: { id: vendorId, name: "Test Vendor", status: "active", contractStart: null, contractEnd: null } } as Parameters<typeof validateScan>[0];
    const active = await client.query(`select token from cards where student_id = $1 and status = 'active'`, [studentId]);
    const qr = `NUSU1:${active.rows[0].token}`;
    const scans = await Promise.all([validateScan(actor, qr, null), validateScan(actor, qr, null)]);
    expect(scans.map(scan => scan.result)).toEqual(["valid", "valid"]);
    const confirmations = await Promise.allSettled(scans.map(scan => confirmScan(actor, scan.scanId, offerId)));
    expect(confirmations.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(confirmations.filter(result => result.status === "rejected")).toHaveLength(1);
    const confirmed = await client.query(`select count(*)::int as n from scan_events where student_id = $1 and offer_id = $2 and confirmed and not voided`, [studentId, offerId]);
    expect(confirmed.rows[0].n).toBe(1);
    const exhausted = await validateScan(actor, qr, null);
    expect(exhausted.result).toBe("limit_reached");
    expect(exhausted.offers[0].remainingUses).toBe(0);
  });
});
