import { config } from "dotenv";
import { QR_PRESETS } from "../lib/qr-style/config";
import { checkStyle } from "../lib/qr-style/checks";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
async function main() {
  const { db, pool } = await import("../lib/db");
  const { qrStyles, qrStyleVersions } = await import("../lib/db/schema");
  try {
  await db.transaction(async tx => {
    for (const [name, config] of Object.entries(QR_PRESETS)) {
      const [inserted] = await tx.insert(qrStyles).values({ name, status: "published", isDefaultPrint: name === "NUSU Signature", isDefaultWeb: name === "NUSU Signature", draftConfig: config }).onConflictDoNothing({ target: qrStyles.name }).returning();
      if (inserted) await tx.insert(qrStyleVersions).values({ styleId: inserted.id, version: 1, config, checks: checkStyle(config), acceptedWarningsReason: "Built-in preset reviewed" });
    }
  });
  console.log("QR presets seeded");
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
