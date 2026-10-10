import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/vendors/http", () => ({
  admin: vi.fn(async () => Response.json({ error: "Unauthorized" }, { status: 401 })),
  errorResponse: vi.fn(), json: vi.fn(),
}));
vi.mock("@/lib/vendors/offer-image-service", () => ({ changeOfferImage: vi.fn() }));
vi.mock("@/lib/vendors/service", () => ({ VendorError: class extends Error {} }));

import { DELETE, PUT } from "./route";

const context = { params: Promise.resolve({ id: "e60c32ec-4b38-4d65-b9a9-54f91f7fcb0d" }) } as never;

describe("offer image mutations", () => {
  it.each([["PUT", PUT], ["DELETE", DELETE]])("rejects an unauthenticated %s before reading the upload or database", async (_method, handler) => {
    const response = await handler(new Request("http://localhost/api/admin/offers/id/image"), context);
    expect(response.status).toBe(401);
  });
});
