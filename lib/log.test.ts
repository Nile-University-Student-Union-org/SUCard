import { describe, expect, it, vi } from "vitest";
import { logError } from "./log";

describe("request error logging", () => {
  it("omits exception text, stack, input, and secrets", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const error = new Error("email=student@nu.edu.eg token=top-secret");
      error.name = "TopSecretError";
      logError("/api/student", error);
      const event = JSON.parse(String(output.mock.calls[0][0]));
      expect(event).toEqual({ level: "error", msg: "Request failed", route: "/api/student", error: { name: "Error" } });
      expect(JSON.stringify(event)).not.toContain("student@nu.edu.eg");
      expect(JSON.stringify(event)).not.toContain("top-secret");
      logError("/api/student?token=top-secret", error);
      expect(JSON.parse(String(output.mock.calls[1][0])).route).toBe("unknown");
    } finally {
      output.mockRestore();
    }
  });
});
