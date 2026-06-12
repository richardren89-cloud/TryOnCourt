import { describe, expect, it, vi } from "vitest";

import { findNextGenerationJob, runGenerationWorkerOnce } from "@/worker/polling";
import type { ImageProvider } from "@/lib/image-provider/types";
import type { PrivateObjectStore } from "@/lib/storage/types";

describe("generation worker polling", () => {
  it("finds the oldest pending or expired processing job", async () => {
    const db = {
      generationJob: {
        findFirst: vi.fn().mockResolvedValue({ id: "job_1" }),
      },
    };
    const now = new Date("2026-06-12T00:00:00.000Z");

    await expect(findNextGenerationJob(db, now)).resolves.toEqual({ id: "job_1" });

    expect(db.generationJob.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "PROCESSING", leaseExpiresAt: { lt: now } },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
  });

  it("processes one queued job when a job is available", async () => {
    const db = createDb({ id: "job_1" });
    const processJob = vi.fn().mockResolvedValue({ status: "SUCCEEDED", jobId: "job_1" });
    const provider = createProvider();
    const storage = createStorage();

    await expect(
      runGenerationWorkerOnce({
        db,
        provider,
        storage,
        processJob,
        now: new Date("2026-06-12T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ status: "SUCCEEDED", jobId: "job_1" });

    expect(processJob).toHaveBeenCalledWith({
      db,
      provider,
      storage,
      jobId: "job_1",
      now: new Date("2026-06-12T00:00:00.000Z"),
    });
  });

  it("returns idle when no queued job is available", async () => {
    await expect(
      runGenerationWorkerOnce({
        db: createDb(null),
        provider: createProvider(),
        storage: createStorage(),
        processJob: vi.fn(),
        now: new Date("2026-06-12T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ status: "IDLE" });
  });
});

function createDb(nextJob: { id: string } | null) {
  return {
    generationJob: {
      findFirst: vi.fn().mockResolvedValue(nextJob),
    },
    uploadedPhoto: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

function createProvider(): ImageProvider {
  return { generate: vi.fn() };
}

function createStorage(): PrivateObjectStore {
  return {
    createUpload: vi.fn(),
    createDownload: vi.fn(),
    read: vi.fn(),
    write: vi.fn(),
    delete: vi.fn(),
  };
}
