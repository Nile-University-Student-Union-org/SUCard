import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || "SU Admin";

if (!email || !password || password.length < 8) {
  console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 8 chars) are required.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

try {
  const existing = await pool.query('SELECT id FROM "user" WHERE LOWER(email) = $1', [email]);
  if (existing.rows.length > 0) {
    console.log("Admin already exists; skipped.");
  } else {
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const hash = await hashPassword(password);
    const now = new Date();

    await pool.query("BEGIN");
    await pool.query(
      'INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, name, email, true, "super_admin", now, now]
    );
    await pool.query(
      'INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [accountId, userId, "credential", userId, hash, now, now]
    );
    await pool.query("COMMIT");
    console.log("Super admin created successfully.");
  }
} catch (error) {
  await pool.query("ROLLBACK").catch(() => {});
  console.error("Failed to seed admin:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
