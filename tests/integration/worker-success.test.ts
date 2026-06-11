import { describe, expect, it, vi } from "vitest";

import type { PrivateObjectStore } from "@/lib/storage/types";
import { processGenerationJob } from "@/worker/process-generation";

type WorkerDb = Parameters<typeof processGenerationJob>[0]["db"];
type WorkerProvider = Parameters<typeof processGenerationJob>[0]["provider"];

describe("processGenerationJob success", () => {
  it("stores one generated asset, marks the job succeeded, and cleans source photos", async () => {
    const tx = createTx({ attemptCount: 1, saveSource: false });
    const db: WorkerDb = {
      uploadedPhoto: tx.uploadedPhoto,
      async $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
        return callback(tx);
      },
    };
    const provider: WorkerProvider = {
      generate: vi.fn().mockResolvedValue({
        image: Uint8Array.from([1, 2, 3]),
        mimeType: "image/png",
      }),
    };
    const storage = createStorage();

    const result = await processGenerationJob({
      db,
      provider,
      storage,
      jobId: "job_1",
      now: new Date("2026-06-11T00:00:00.000Z"),
    });

    expect(result).toEqual({ status: "SUCCEEDED", jobId: "job_1" });
    expect(provider.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Paris Match Outfit"),
        fullBodyImage: Uint8Array.from([9]),
        headshotImage: Uint8Array.from([8]),
      }),
    );
    expect(storage.write).toHaveBeenCalledWith({
      key: "generated/user_1/job_1/try-on.png",
      body: Uint8Array.from([1, 2, 3]),
      contentType: "image/png",
    });
    expect(tx.generatedAsset.create).toHaveBeenCalledWith({
      data: {
        jobId: "job_1",
        storageKey: "generated/user_1/job_1/try-on.png",
        mimeType: "image/png",
        byteSize: 3,
      },
    });
    expect(tx.generationJob.update).toHaveBeenCalledWith({
      where: { id: "job_1" },
      data: { status: "SUCCEEDED", failureCode: null, leaseExpiresAt: null },
    });
    expect(storage.delete).toHaveBeenCalledWith("uploads/full.jpg");
    expect(storage.delete).toHaveBeenCalledWith("uploads/head.jpg");
    expect(tx.uploadedPhoto.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        id: { in: ["full_1", "head_1"] },
        deletedAt: null,
      },
      data: { deletedAt: new Date("2026-06-11T00:00:00.000Z") },
    });
  });
});

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
