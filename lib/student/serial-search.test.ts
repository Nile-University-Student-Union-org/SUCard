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
const integration = local ? describe : describe.skip;

integration("SU serial search regression", { timeout: 30_000 }, () => {
  const client = new Client({ connectionString: url });
  const suffix = randomUUID().replaceAll("-", "");
  const studentId = `test-student-${suffix}`;
  const cardId = randomUUID();
  const digitalStudentId = `test-digital-${suffix}`;
  const digitalCardId = randomUUID();
  const serial = Math.floor(Math.random() * 100_000_000) + 100_000_000;
  let searchStudents: typeof import("./admin").searchStudents;
  let lookupCard: typeof import("./admin").lookupCard;
  let setStudentFlow: typeof import("./admin").setStudentFlow;

  beforeAll(async () => {
    await client.connect();
    ({ searchStudents, lookupCard, setStudentFlow } = await import("./admin"));
    await client.query(`insert into "user" (id, name, email, role) values ($1, 'Serial Search Student', $2, 'student')`,
      [studentId, `${suffix}@test.invalid`]);
    await client.query(`insert into student_profiles (user_id, university_id, card_flow) values ($1, $2, 'physical')`,
      [studentId, String(serial + 1)]);
    await client.query(`insert into cards (id, type, serial_number, token, status, student_id) values ($1, 'physical', $2, $3, 'active', $4)`,
      [cardId, serial, suffix.slice(0, 20).toUpperCase().replace(/[ILOU]/g, "A"), studentId]);
    await client.query(`insert into "user" (id, name, email, role) values ($1, 'Digital Student', $2, 'student')`,
      [digitalStudentId, `digital-${suffix}@test.invalid`]);
    await client.query(`insert into student_profiles (user_id, university_id, card_flow) values ($1, $2, 'digital')`,
      [digitalStudentId, String(serial + 2)]);
    await client.query(`insert into cards (id, type, serial_number, token, status, student_id) values ($1, 'digital', $2, $3, 'active', $4)`,
      [digitalCardId, serial + 2, suffix.slice(10, 30).toUpperCase().replace(/[ILOU]/g, "A"), digitalStudentId]);
  });

  afterAll(async () => {
    if (!local) return;
    await client.query(`delete from audit_log where actor_id = $1`, [digitalStudentId]);
    await client.query(`delete from cards where id = $1`, [digitalCardId]);
    await client.query(`delete from student_profiles where user_id = $1`, [digitalStudentId]);
    await client.query(`delete from "user" where id = $1`, [digitalStudentId]);
    await client.query(`delete from cards where id = $1`, [cardId]);
    await client.query(`delete from student_profiles where user_id = $1`, [studentId]);
    await client.query(`delete from "user" where id = $1`, [studentId]);
    await client.end();
  });

  it("finds the owner from prefixed or bare serial and looks up the same card", async () => {
    for (const query of [`SU-${serial}`, String(serial)]) {
      const students = await searchStudents(query);
      expect(students.students.map((student) => student.profile.userId)).toContain(studentId);
      const lookup = await lookupCard({ serial: query });
      expect(lookup.card.student?.userId).toBe(studentId);
    }
  });

  it("voids a digital card before showing physical pickup state", async () => {
    const response = await setStudentFlow(digitalStudentId, "physical", digitalStudentId);
    expect(response.student.profile.cardFlow).toBe("physical");
    expect(response.student.card).toBeNull();
    const card = await client.query(`select status, void_reason, voided_at, voided_by from cards where id = $1`, [digitalCardId]);
    expect(card.rows[0]).toMatchObject({ status: "void", void_reason: "switched_to_physical", voided_by: digitalStudentId });
    expect(card.rows[0].voided_at).not.toBeNull();
  });
});
