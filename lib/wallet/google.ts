import { createPrivateKey, createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { CardSummary, StudentHomeResponse } from "@/lib/student/types";

const apiBase = "https://walletobjects.googleapis.com/walletobjects/v1";
const scope = "https://www.googleapis.com/auth/wallet_object.issuer";
const googleTimeoutMs = 8_000;
const configSchema = z.object({
  issuerId: z.string().regex(/^\d+$/),
  email: z.email(),
  // The service-account key: a JSON file on disk (VPS), or its JSON base64-encoded in an env var (Vercel and other hosts without files).
  keyFile: z.string().min(1).optional(),
  keyJson: z.string().min(1).optional(),
  // Only used for the pass images, which Google must be able to fetch; on http (local dev) they are left out.
  baseUrl: z.url(),
});
const keySchema = z.object({ private_key: z.string().min(1), client_email: z.email() });
type Config = z.infer<typeof configSchema> & { privateKey: string };
let accessToken: { value: string; expiresAt: number } | null = null;
let tokenRequest: Promise<string> | null = null;

export class GoogleWalletError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function getGoogleWalletConfig(): Promise<Config | null> {
  const parsed = configSchema.safeParse({
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
    email: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    keyFile: process.env.GOOGLE_WALLET_KEY_FILE || undefined,
    keyJson: process.env.GOOGLE_WALLET_KEY_JSON || undefined,
    baseUrl: process.env.PUBLIC_BASE_URL || process.env.BETTER_AUTH_URL,
  });
  if (!parsed.success || (!parsed.data.keyJson && !parsed.data.keyFile)) return null;
  try {
    const raw = parsed.data.keyJson
      ? Buffer.from(parsed.data.keyJson, "base64").toString("utf8")
      : await readFile(path.resolve(/* turbopackIgnore: true */ process.cwd(), parsed.data.keyFile!), "utf8");
    const key = keySchema.safeParse(JSON.parse(raw));
    if (!key.success || key.data.client_email !== parsed.data.email) return null;
    createPrivateKey(key.data.private_key);
    return { ...parsed.data, privateKey: key.data.private_key };
  } catch { return null; }
}

export function objectId(issuerId: string, userId: string) {
  const suffix = /^[A-Za-z0-9._-]+$/.test(userId) ? userId : `b64_${Buffer.from(userId).toString("base64url")}`;
  return `${issuerId}.student_${suffix}`;
}

const localized = (value: string) => ({ defaultValue: { language: "en-US", value } });
export function buildGenericClass(issuerId: string) {
  return {
    id: `${issuerId}.su_card_v1`,
    reviewStatus: "UNDER_REVIEW",
    multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
    // Show the university ID on the front of the pass, under the student's name.
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [{ oneItem: { item: { firstValue: { fields: [{ fieldPath: "object.textModulesData['university_id']" }] } } } }],
      },
    },
  };
}
export function buildGenericObject(config: Pick<Config, "issuerId" | "baseUrl">, student: Pick<StudentHomeResponse, "profile" | "name">, card: Pick<CardSummary, "qr"> | null) {
  return {
    id: objectId(config.issuerId, student.profile.userId),
    classId: `${config.issuerId}.su_card_v1`,
    hexBackgroundColor: "#0F3056",
    ...(config.baseUrl.startsWith("https://")
      ? {
          logo: { sourceUri: { uri: `${config.baseUrl.replace(/\/$/, "")}/brand/wallet-logo.png` }, contentDescription: localized("NUSU") },
          heroImage: { sourceUri: { uri: `${config.baseUrl.replace(/\/$/, "")}/brand/wallet-hero.png` }, contentDescription: localized("Nile University Student Union") },
        }
      : {}),
    cardTitle: localized("SU CARD"),
    header: localized(student.name),
    subheader: localized("Student member"),
    textModulesData: [
      { id: "university_id", header: "University ID", body: student.profile.universityId },
      { id: "how_to_use", header: "How to use", body: "Show this QR code at participating vendors. A suspended or void card cannot be redeemed." },
    ],
    barcode: card ? { type: "QR_CODE", value: card.qr, alternateText: `ID ${student.profile.universityId}` } : null,
    state: student.profile.status === "suspended" || !card ? "INACTIVE" : "ACTIVE",
  };
}

export function signJwt(payload: object, privateKey: string) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = `${header}.${body}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  return `${input}.${signer.sign(privateKey).toString("base64url")}`;
}

function assertion(config: Config) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({ iss: config.email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }, config.privateKey);
}
async function getAccessToken(config: Config) {
  if (accessToken && Date.now() < accessToken.expiresAt - 60_000) return accessToken.value;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async () => {
    let response: Response;
    try {
      response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: assertion(config) }),
        cache: "no-store",
        signal: AbortSignal.timeout(googleTimeoutMs),
      });
    } catch { throw new GoogleWalletError(0, "OAuth network request failed"); }
    let body: unknown;
    try { body = await response.json(); } catch { throw new GoogleWalletError(response.status, "Invalid OAuth response"); }
    if (!response.ok) throw new GoogleWalletError(response.status, googleMessage(body));
    const token = z.object({ access_token: z.string(), expires_in: z.number() }).safeParse(body);
    if (!token.success) throw new GoogleWalletError(response.status, "Invalid OAuth token response");
    accessToken = { value: token.data.access_token, expiresAt: Date.now() + token.data.expires_in * 1000 };
    return token.data.access_token;
  })();
  try { return await tokenRequest; } finally { tokenRequest = null; }
}

function googleMessage(body: unknown) {
  const parsed = z.object({ error: z.union([z.string(), z.object({ message: z.string().optional() }).passthrough()]).optional(), error_description: z.string().optional() }).safeParse(body);
  if (!parsed.success) return "Unknown Google API error";
  return parsed.data.error_description ?? (typeof parsed.data.error === "string" ? parsed.data.error : parsed.data.error?.message) ?? "Unknown Google API error";
}
async function request(config: Config, method: string, resource: string, data?: object) {
  const token = await getAccessToken(config);
  let response: Response;
  try {
    response = await fetch(`${apiBase}/${resource}`, {
      method, headers: { Authorization: `Bearer ${token}`, ...(data ? { "Content-Type": "application/json" } : {}) },
      ...(data ? { body: JSON.stringify(data) } : {}), cache: "no-store",
      signal: AbortSignal.timeout(googleTimeoutMs),
    });
  } catch { throw new GoogleWalletError(0, "Google Wallet network request failed"); }
  if (!response.ok && !(response.status === 404 && (method === "GET" || method === "PATCH"))) {
    let body: unknown;
    try { body = await response.json(); } catch { body = null; }
    throw new GoogleWalletError(response.status, googleMessage(body));
  }
  return response.status;
}

export async function ensureClass(config: Config) {
  const value = buildGenericClass(config.issuerId);
  const status = await request(config, "GET", `genericClass/${encodeURIComponent(value.id)}`);
  if (status === 404) return { get: status, insert: await request(config, "POST", "genericClass", value) };
  return { get: status, patch: await request(config, "PATCH", `genericClass/${encodeURIComponent(value.id)}`, value) };
}

export async function upsertObject(config: Config, student: Pick<StudentHomeResponse, "profile" | "name">, card: Pick<CardSummary, "qr">) {
  const value = buildGenericObject(config, student, card);
  const resource = `genericObject/${encodeURIComponent(value.id)}`;
  const status = await request(config, "GET", resource);
  if (status === 404) return { get: status, insert: await request(config, "POST", "genericObject", value) };
  return { get: status, patch: await request(config, "PATCH", resource, value) };
}

export function buildSaveUrl(config: Config, id: string) {
  const jwt = signJwt({ iss: config.email, aud: "google", typ: "savetowallet", origins: [], payload: { genericObjects: [{ id }] } }, config.privateKey);
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

type RedemptionNotification = {
  redemptionId: string;
  userId: string;
  vendorName: string;
  discountLabel: string;
  offerTitle: string;
  at: Date;
};

function shorten(value: string, limit: number) {
  const characters = Array.from(value.trim());
  return characters.length <= limit ? characters.join("") : `${characters.slice(0, limit - 1).join("")}…`;
}

export function buildRedemptionMessage({ redemptionId, vendorName, discountLabel, offerTitle, at }: Omit<RedemptionNotification, "userId">) {
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "numeric", minute: "2-digit", hour12: true }).format(at);
  const prefix = `${shorten(discountLabel, 35)}: `;
  const suffix = ` · ${time} Cairo`;
  return {
    message: {
      id: `redemption_${redemptionId}`,
      header: `Used at ${shorten(vendorName, 32)}`,
      body: `${prefix}${shorten(offerTitle, 120 - Array.from(prefix + suffix).length)}${suffix}`,
      messageType: "TEXT_AND_NOTIFY",
      displayInterval: {
        start: { date: at.toISOString() },
        end: { date: new Date(at.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      },
    },
  };
}

export async function notifyRedemption({ userId, ...redemption }: RedemptionNotification): Promise<void> {
  try {
    const config = await getGoogleWalletConfig();
    if (!config) return;
    const { db } = await import("@/lib/db");
    const { walletPasses } = await import("@/lib/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const [pass] = await db.select({ objectId: walletPasses.objectId }).from(walletPasses)
      .where(and(eq(walletPasses.studentId, userId), eq(walletPasses.platform, "google")));
    if (!pass) return;
    await request(config, "POST", `genericObject/${encodeURIComponent(pass.objectId)}/addMessage`, buildRedemptionMessage(redemption));
  } catch (error) {
    console.error("Google Wallet redemption notification failed", {
      redemptionId: redemption.redemptionId,
      userId,
      status: error instanceof GoogleWalletError ? error.status : undefined,
    });
  }
}

export async function syncGoogleWalletForStudent(userId: string): Promise<boolean> {
  try {
    const config = await getGoogleWalletConfig();
    if (!config) return false;
    const { db } = await import("@/lib/db");
    const { user, walletPasses } = await import("@/lib/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const passFilter = and(eq(walletPasses.studentId, userId), eq(walletPasses.platform, "google"));
    const [pass] = await db.select({ objectId: walletPasses.objectId }).from(walletPasses)
      .where(passFilter);
    if (!pass) return true;
    await db.update(walletPasses).set({ lastAttemptedAt: new Date() })
      .where(passFilter);
    const resource = `genericObject/${encodeURIComponent(pass.objectId)}`;
    if (!(await db.select({ id: user.id }).from(user).where(eq(user.id, userId))).length) {
      const status = await request(config, "PATCH", resource, { state: "INACTIVE" });
      // An already removed object has no active pass to reconcile.
      if (status === 404) console.info("Issued Google Wallet object no longer exists");
      await db.delete(walletPasses).where(passFilter);
      return true;
    } else {
      const { getStudentHome } = await import("@/lib/student/service");
      const student = await getStudentHome(userId);
      const value = buildGenericObject(config, student, student.card);
      const status = await request(config, "PATCH", resource, value);
      if (status === 404) {
        await ensureClass(config);
        await request(config, "POST", "genericObject", value);
      }
    }
    await db.update(walletPasses).set({ lastSyncedAt: new Date() }).where(passFilter);
    return true;
  } catch (error) {
    console.error("Google Wallet sync failed", { status: error instanceof GoogleWalletError ? error.status : undefined });
    return false;
  }
}
