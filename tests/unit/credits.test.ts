import { describe, expect, it, vi } from "vitest";

import {
  getCreditBalance,
  refundCredit,
  spendCredit,
} from "@/lib/credits/service";

function createFakeCreditDb(entries: { amount: number; businessKey: string }[]) {
  const tx = {
    user: { update: vi.fn().mockResolvedValue({ id: "user_1" }) },
    creditLedgerEntry: {
      aggregate: vi.fn(async () => ({
        _sum: { amount: entries.reduce((sum, entry) => sum + entry.amount, 0) },
      })),
      findUnique: vi.fn(async ({ where }) =>
        entries.find(
          (entry) =>
            entry.businessKey === where.userId_businessKey.businessKey,
        ) ?? null,
      ),
      create: vi.fn(async ({ data }) => {
        entries.push({ amount: data.amount, businessKey: data.businessKey });
        return data;
      }),
    },
  };

  return {
    tx,
    db: {
      creditLedgerEntry: tx.creditLedgerEntry,
      async $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
        return callback(tx);
      },
    },
  };
}

describe("credit ledger service", () => {
  it("calculates balance from ledger entries", async () => {
    const { db } = createFakeCreditDb([
      { amount: 5, businessKey: "signup:user_1" },
      { amount: -1, businessKey: "generation:job_1" },
    ]);

    await expect(getCreditBalance(db, "user_1")).resolves.toBe(4);
  });

  it("spends one credit only when balance is sufficient", async () => {
    const { db } = createFakeCreditDb([{ amount: 1, businessKey: "bonus" }]);

    await expect(spendCredit(db, "user_1", "generation:job_1")).resolves.toBe(0);
    await expect(spendCredit(db, "user_1", "generation:job_2")).rejects.toThrow(
      "Insufficient credits",
    );
  });

  it("refunds a business key once", async () => {
    const { db } = createFakeCreditDb([]);

    await expect(refundCredit(db, "user_1", "refund:job_1")).resolves.toBe(1);
    await expect(refundCredit(db, "user_1", "refund:job_1")).resolves.toBe(1);
  });
});
