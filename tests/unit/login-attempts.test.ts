import { beforeEach, describe, expect, it } from "vitest";

import {
  canAttemptLogin,
  clearLoginAttempts,
  loginAttemptKey,
  recordFailedLogin,
  resetLoginAttemptBucketsForTest,
} from "@/lib/auth/login-attempts";

describe("login attempt limiter", () => {
  beforeEach(() => resetLoginAttemptBucketsForTest());

  it("blocks after five failed attempts in the same window", () => {
    const key = loginAttemptKey("PlayerOne", "127.0.0.1");

    for (let index = 0; index < 5; index += 1) {
      expect(canAttemptLogin(key)).toBe(true);
      recordFailedLogin(key);
    }

    expect(canAttemptLogin(key)).toBe(false);
  });

  it("clears attempts after a successful login", () => {
    const key = loginAttemptKey("PlayerOne", "127.0.0.1");

    for (let index = 0; index < 5; index += 1) {
      recordFailedLogin(key);
    }
    clearLoginAttempts(key);

    expect(canAttemptLogin(key)).toBe(true);
  });
});
