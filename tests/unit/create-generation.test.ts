import { describe, expect, it, vi } from "vitest";

import { createGenerationJob } from "@/lib/generations/service";

describe("createGenerationJob", () => {
  it("pre-spends a credit, creates a job, and writes one outbox row", async () => {
    const tx = {
      user: { update: vi.fn().mockResolvedValue({ id: "user_1" }) },
      creditLedgerEntry: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 5 } }),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "ledger_1" }),
      },
      outfit: {
        findFirst: vi.fn().mockResolvedValue({ id: "outfit_1" }),
      },
      uploadedPhoto: {
        count: vi.fn().mockResolvedValue(2),
      },
      generationJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "job_1", status: "PENDING" }),
      },
      queueOutbox: {
        create: vi.fn().mockResolvedValue({ id: "outbox_1" }),
      },
    };
    const db = {
      async $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
        return callback(tx);
      },
    };

    const result = await createGenerationJob(db, {
      userId: "user_1",
      outfitId: "outfit_1",
      fullBodyPhotoId: "photo_full",
      headshotPhotoId: "photo_head",
      saveSource: false,
      clientKey: "request_1",
    });

    expect(result).toEqual({ id: "job_1", status: "PENDING" });
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        amount: -1,
        businessKey: "generation:request_1",
      }),
    });
    expect(tx.generationJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        outfitId: "outfit_1",
        clientKey: "request_1",
      }),
      select: { id: true, status: true },
    });
    expect(tx.queueOutbox.create).toHaveBeenCalledWith({
      data: {
        generationJobId: "job_1",
        topic: "generation.requested",
        payload: { jobId: "job_1" },
      },
    });
  });
});
