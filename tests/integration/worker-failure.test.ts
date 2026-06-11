import { describe, expect, it, vi } from "vitest";

import type { PrivateObjectStore } from "@/lib/storage/types";
import { ImageGenerationFailure, processGenerationJob } from "@/worker/process-generation";

type WorkerDb = Parameters<typeof processGenerationJob>[0]["db"];
type WorkerProvider = Parameters<typeof processGenerationJob>[0]["provider"];

describe("processGenerationJob failure handling", () => {
  it("refunds and cleans source photos after a permanent failure", async () => {
    const tx = createTx({ attemptCount: 1, saveSource: false });
    const db = createDb(tx);
    const provider: WorkerProvider = {
      generate: vi
        .fn()
        .mockRejectedValue(
          new ImageGenerationFailure({ kind: "PERMANENT", code: "INVALID_INPUT" }),
        ),
    };
    const storage = createStorage();

    const result = await processGenerationJob({
      db,
      provider,
      storage,
      jobId: "job_1",
      now: new Date("2026-06-11T00:00:00.000Z"),
    });

    expect(result).toEqual({
      status: "FAILED_REFUNDED",
      jobId: "job_1",
      failureCode: "INVALID_INPUT",
    });
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        type: "GENERATION_REFUND",
        amount: 1,
        businessKey: "refund:job_1",
        note: "Generation refund",
      },
    });
    expect(tx.generationJob.update).toHaveBeenCalledWith({
      where: { id: "job_1" },
      data: { status: "FAILED_REFUNDED", failureCode: "INVALID_INPUT", leaseExpiresAt: null },
    });
    expect(storage.delete).toHaveBeenCalledWith("uploads/full.jpg");
    expect(storage.delete).toHaveBeenCalledWith("uploads/head.jpg");
  });

  it("returns transient failures below the attempt limit to pending without refund", async () => {
    const tx = createTx({ attemptCount: 2, saveSource: false });
    const db = createDb(tx);
    const provider: WorkerProvider = {
      generate: vi
        .fn()
        .mockRejectedValue(
          new ImageGenerationFailure({ kind: "TRANSIENT", code: "PROVIDER_TIMEOUT" }),
        ),
    };
    const storage = createStorage();

    const result = await processGenerationJob({
      db,
      provider,
      storage,
      jobId: "job_1",
      now: new Date("2026-06-11T00:00:00.000Z"),
    });

    expect(result).toEqual({
      status: "RETRYING",
      jobId: "job_1",
      failureCode: "PROVIDER_TIMEOUT",
    });
    expect(tx.generationJob.update).toHaveBeenCalledWith({
      where: { id: "job_1" },
      data: { status: "PENDING", failureCode: "PROVIDER_TIMEOUT", leaseExpiresAt: null },
    });
    expect(tx.creditLedgerEntry.create).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
});

function createDb(tx: ReturnType<typeof createTx>): WorkerDb {
  return {
    uploadedPhoto: tx.uploadedPhoto,
    async $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
      return callback(tx);
    },
  };
}

function createTx(input: { attemptCount: number; saveSource: boolean }) {
  const job = {
    id: "job_1",
    userId: "user_1",
    attemptCount: input.attemptCount,
    saveSource: input.saveSource,
    outfit: {
      title: "Paris Match Outfit",
      promptDescription: null,
      items: [
        {
          category: "top",
          displayName: "Clay Polo",
          brand: "CourtFit",
          productName: "Clay Polo",
          colorDescription: "green",
          promptDescription: null,
        },
      ],
    },
    fullBodyPhoto: { id: "full_1", storageKey: "uploads/full.jpg" },
    headshotPhoto: { id: "head_1", storageKey: "uploads/head.jpg" },
  };

  return {
    user: { update: vi.fn().mockResolvedValue({}) },
    generationJob: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(job),
      update: vi.fn().mockResolvedValue({}),
    },
    generatedAsset: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    creditLedgerEntry: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    uploadedPhoto: {
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };
}

function createStorage(): PrivateObjectStore {
  return {
    createUpload: vi.fn(),
    createDownload: vi.fn(),
    read: vi
      .fn()
      .mockResolvedValueOnce(Uint8Array.from([9]))
      .mockResolvedValueOnce(Uint8Array.from([8])),
    write: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}
