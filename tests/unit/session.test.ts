import { afterEach, describe, expect, it, vi } from "vitest";

import { sessionCookieOptions } from "@/lib/auth/session";

describe("sessionCookieOptions", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });

  it("allows insecure cookies when explicitly disabled for HTTP testing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_COOKIE_SECURE", "false");

    const options = sessionCookieOptions(new Date("2026-06-12T00:00:00Z"));

    expect(options.secure).toBe(false);
  });

  it("uses secure cookies when explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SESSION_COOKIE_SECURE", "true");

    const options = sessionCookieOptions(new Date("2026-06-12T00:00:00Z"));

    expect(options.secure).toBe(true);
  });

  it("defaults to secure cookies in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_COOKIE_SECURE", undefined);

    const options = sessionCookieOptions(new Date("2026-06-12T00:00:00Z"));

    expect(options.secure).toBe(true);
  });
});
