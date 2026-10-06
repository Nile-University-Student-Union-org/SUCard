import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import * as schema from "./schema";

const connectionString = z.url().parse(process.env.DATABASE_URL);
const globalDb = globalThis as typeof globalThis & { suCardPool?: Pool };
export const pool = globalDb.suCardPool ?? new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") globalDb.suCardPool = pool;
export const db = drizzle(pool, { schema });
