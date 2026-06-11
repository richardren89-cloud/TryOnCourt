import { describe, expect, it, vi } from "vitest";

import { registerUser } from "@/lib/auth/registration";

describe("registerUser", () => {
  it("creates a user, consent record, and one signup credit event", async () => {
    const tx = {
      user: {
        create: vi.fn().mockResolvedValue({ id: "user_1", username: "player1" }),
      },
      consentRecord: { create: vi.fn().mockResolvedValue({ id: "consent_1" }) },
      creditLedgerEntry: {
        create: vi.fn().mockResolvedValue({ id: "ledger_1" }),
      },
    };
    const db = {
      async $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
        return callback(tx);
      },
    };

    const result = await registerUser(db, {
      username: "player1",
      password: "Correct-Horse-123",
      birthYear: 2010,
      guardianConsent: true,
      termsVersion: "terms-2026-06",
      privacyVersion: "privacy-2026-06",
      ageConfirmed: true,
    });

    expect(result).toEqual({ id: "user_1", username: "player1" });
    expect(tx.user.create).toHaveBeenCalledOnce();
    expect(tx.consentRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        ageConfirmed: true,
        guardianConsent: true,
      }),
    });
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        type: "SIGNUP_BONUS",
        amount: 5,
        businessKey: "signup:user_1",
        note: "New user signup bonus",
      },
    });
  });

  it("requires guardian consent for users under 18", async () => {
    const db = { $transaction: vi.fn() };

    await expect(
      registerUser(db, {
        username: "junior",
        password: "Correct-Horse-123",
        birthYear: 2010,
        guardianConsent: false,
        termsVersion: "terms-2026-06",
        privacyVersion: "privacy-2026-06",
        ageConfirmed: true,
      }),
    ).rejects.toThrow("Guardian consent is required");
  });
});
