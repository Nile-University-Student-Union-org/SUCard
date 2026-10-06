import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
export default defineConfig({
  schema: "./lib/db/schema.ts", out: "./drizzle", dialect: "postgresql",
  dbCredentials: { url: z.url().parse(process.env.DATABASE_URL) },
});
