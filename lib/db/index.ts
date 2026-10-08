import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import * as schema from "./schema";

const connectionString = z.url().parse(process.env.DATABASE_URL);
const databaseHost = new URL(connectionString).hostname;
if (process.env.NODE_ENV === "production" && databaseHost.endsWith(".neon.tech") && !databaseHost.includes("-pooler.")) {
  throw new Error("Production Neon DATABASE_URL must use the pooled host");
}
const globalDb = globalThis as typeof globalThis & { suCardPool?: Pool };
export const pool = globalDb.suCardPool ?? new Pool({ connectionString, max: 2,
  connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
  query_timeout: 15000, statement_timeout: 15000 });
if (process.env.NODE_ENV !== "production") globalDb.suCardPool = pool;
export const db = drizzle(pool, { schema });
