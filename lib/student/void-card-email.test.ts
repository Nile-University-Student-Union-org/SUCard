import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

config({ path: ".env.local", quiet: true });
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/wallet/google", () => ({ syncGoogleWalletForStudent: vi.fn() }));

const url = process.env.DATABASE_URL;
const local = url && ["localhost", "127.0.0.1"].includes(new URL(url).hostname);

(local ? describe : describe.skip)("void card email persistence", { timeout: 30_000 }, () => {
  const client = new Client({ connectionString: url });
  const suffix = randomUUID().replaceAll("-", "");
  const studentId = `test-void-${suffix}`;
  const email = `${suffix}@test.invalid`;
  const linkedId = randomUUID();
  const unassignedId = randomUUID();
  const serial = Math.floor(Math.random() * 100_000_000) + 500_000_000;
  let voidCard: typeof import("./admin").voidCard;

  beforeAll(async () => {
    await client.connect();
    ({ voidCard } = await import("./admin"));
    await client.query(`insert into "user" (id, name, email, role) values ($1, 'Void Test Student', $2, 'student')`, [studentId, email]);
    await client.query(`insert into cards (id, type, serial_number, token, status, student_id) values ($1, 'physical', $2, $3, 'active', $4)`,
      [linkedId, serial, `VOID${suffix}A`, studentId]);
    await client.query(`insert into cards (id, type, serial_number, token, status) values ($1, 'physical', $2, $3, 'unassigned')`,
      [unassignedId, serial + 1, `VOID${suffix}B`]);
  });

  afterAll(async () => {
    if (!local) return;
    await client.query(`delete from email_outbox where "to" = $1`, [email]);
    await client.query(`delete from audit_log where actor_id = $1`, [studentId]);
    await client.query(`delete from cards where id = any($1::uuid[])`, [[linkedId, unassignedId]]);
    await client.query(`delete from "user" where id = $1`, [studentId]);
    await client.end();
  });

  it("queues exactly one notice for a linked active card", async () => {
    await voidCard(linkedId, "Card damaged", studentId);
    const rows = await client.query(`select kind, text from email_outbox where "to" = $1`, [email]);
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({ kind: "card_voided" });
    expect(rows.rows[0].text).toContain("Card damaged");
  });

  it("queues no notice for an unassigned card", async () => {
    await voidCard(unassignedId, "Stock damaged", studentId);
    const rows = await client.query(`select id from email_outbox where "to" = $1`, [email]);
    expect(rows.rows).toHaveLength(1);
  });
});
