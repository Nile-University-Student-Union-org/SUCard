import { Pool } from "pg";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const defaultEye = { frameShape: "rounded", frameRadius: 2.2, frameColor: "#0F3056", pupilShape: "rounded", pupilColor: "#0F3056", rotation: 0 };
const solid = (hex) => ({ type: "solid", color: hex });

const NUSU_SIGNATURE_CONFIG = {
  schemaVersion: 1,
  encoding: { ecLevel: "H", version: null, mask: null, quietZone: 2 },
  modules: { shape: "circle", scale: 0.84, radius: 0.2, paint: solid("#0F3056") },
  eyes: { topLeft: defaultEye, topRight: defaultEye, bottomLeft: defaultEye },
  background: { type: "solid", color: "#FFFFFF" },
  logo: { type: "nusu", sizePercent: 0, padding: 0, plate: "none", plateColor: "#FFFFFF", clear: "square", legacySignature: true },
  frame: { shape: "none", color: "#0F3056", width: 0, label: "", font: "anton", labelColor: "#0F3056", position: "bottom", badgeColor: null },
  output: { printSizeMm: 25, dpi: 600 },
};

const clone = () => structuredClone(NUSU_SIGNATURE_CONFIG);
const classic = clone();
classic.encoding.ecLevel = "M";
classic.modules = { ...classic.modules, shape: "square", scale: 1, paint: solid("#000000") };
classic.logo.type = "none";
classic.logo.legacySignature = false;
classic.eyes = {
  topLeft: { ...defaultEye, frameShape: "square", pupilShape: "square", frameColor: "#000000", pupilColor: "#000000" },
  topRight: { ...defaultEye, frameShape: "square", pupilShape: "square", frameColor: "#000000", pupilColor: "#000000" },
  bottomLeft: { ...defaultEye, frameShape: "square", pupilShape: "square", frameColor: "#000000", pupilColor: "#000000" },
};

const minimal = structuredClone(classic);
minimal.modules.scale = 0.9;
minimal.modules.shape = "rounded";

const bold = structuredClone(classic);
bold.modules.scale = 1;
bold.eyes = {
  topLeft: { ...defaultEye, frameShape: "circle", pupilShape: "circle", frameColor: "#000000", pupilColor: "#000000" },
  topRight: { ...defaultEye, frameShape: "circle", pupilShape: "circle", frameColor: "#000000", pupilColor: "#000000" },
  bottomLeft: { ...defaultEye, frameShape: "circle", pupilShape: "circle", frameColor: "#000000", pupilColor: "#000000" },
};

const gradient = structuredClone(classic);
gradient.modules.paint = { type: "linear", angle: 45, stops: [{ offset: 0, color: "#0F3056" }, { offset: 1, color: "#018BCE" }] };

const QR_PRESETS = {
  "Classic": classic,
  "NUSU Signature": NUSU_SIGNATURE_CONFIG,
  "Minimal": minimal,
  "Bold": bold,
  "Gradient": gradient,
};

function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

function contrastRatio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

function checkStyle(config, { printSizeMm = config.output.printSizeMm, sampleVersion = config.encoding.version ?? 3 } = {}) {
  const bg = config.background.type === "solid" ? config.background.color : "#FFFFFF";
  const colors = config.modules.paint.type === "solid" ? [config.modules.paint.color] : config.modules.paint.stops.map(s => s.color);
  colors.push(...Object.values(config.eyes).flatMap(e => [e.frameColor, e.pupilColor]));
  const contrast = [...new Set(colors)].map(color => {
    const ratio = contrastRatio(color, bg);
    return { color, ratio, level: ratio < 3 ? "block" : ratio < 4.5 || luminance(color) > luminance(bg) ? "warn" : "ok" };
  });
  const n = 17 + sampleVersion * 4, q = config.encoding.quietZone;
  const width = config.logo.type === "none" ? 0 : config.logo.legacySignature ? 9 : n * config.logo.sizePercent / 100 + config.logo.padding * 2;
  const percent = width * width / (n * n) * 100;
  const recoverable = { L: 7, M: 15, Q: 25, H: 30 }[config.encoding.ecLevel];
  const safeLimit = recoverable * .6;
  const logoCoverage = { percent, safeLimit, level: percent > safeLimit ? "block" : percent > 15 ? "warn" : "ok" };
  const moduleSize = printSizeMm / (n + q * 2);
  const moduleSizeMm = { value: moduleSize, level: moduleSize < .5 ? "warn" : "ok" };
  const quietZone = { value: q, level: q === 0 ? "block" : q < 2 ? "warn" : "ok" };
  const eyesClear = width <= n - 14;
  const eyesIntact = { value: eyesClear, level: eyesClear ? "ok" : "block" };
  const rank = { ok: 0, warn: 1, block: 2 };
  const levels = [...contrast.map(c => c.level), logoCoverage.level, moduleSizeMm.level, quietZone.level, eyesIntact.level];
  return { contrast, logoCoverage, moduleSizeMm, quietZone, eyesIntact, overall: levels.reduce((a, b) => rank[b] > rank[a] ? b : a, "ok") };
}

const pool = new Pool({ connectionString });

try {
  await pool.query("BEGIN");
  for (const [name, config] of Object.entries(QR_PRESETS)) {
    const isDefault = name === "NUSU Signature";
    const existing = await pool.query("SELECT id FROM qr_styles WHERE name = $1", [name]);
    let styleId;
    if (existing.rows.length === 0) {
      styleId = crypto.randomUUID();
      const now = new Date();
      await pool.query(
        "INSERT INTO qr_styles (id, name, status, is_default_print, is_default_web, draft_config, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [styleId, name, "published", isDefault, isDefault, JSON.stringify(config), now, now]
      );
      const versionId = crypto.randomUUID();
      const checks = checkStyle(config);
      await pool.query(
        "INSERT INTO qr_style_versions (id, style_id, version, config, checks, accepted_warnings_reason, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [versionId, styleId, 1, JSON.stringify(config), JSON.stringify(checks), "Built-in preset reviewed", now]
      );
    }
  }
  await pool.query("COMMIT");
  console.log("QR presets seeded successfully.");
} catch (error) {
  await pool.query("ROLLBACK").catch(() => {});
  console.error("Failed to seed QR presets:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
