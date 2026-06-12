import { getDb } from "@/lib/db";
import { processGenerationJob, type ProcessGenerationResult } from "@/worker/process-generation";
import { getImageProvider } from "@/lib/image-provider/selected-provider";
import { getObjectStore } from "@/lib/storage";

type QueuedJob = { id: string };

export type WorkerOnceResult = ProcessGenerationResult | { status: "IDLE" };

interface PollingDb {
  generationJob: {
    findFirst(input: {
      where: {
        OR: Array<
          | { status: "PENDING" }
          | { status: "PROCESSING"; leaseExpiresAt: { lt: Date } }
        >;
      };
      orderBy: { createdAt: "asc" };
      select: { id: true };
    }): Promise<QueuedJob | null>;
  };
}

export async function findNextGenerationJob(
  db: PollingDb,
  now = new Date(),
): Promise<QueuedJob | null> {
  return db.generationJob.findFirst({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "PROCESSING", leaseExpiresAt: { lt: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
}

export async function runGenerationWorkerOnce(input: {
  db: PollingDb & Parameters<typeof processGenerationJob>[0]["db"];
  provider: Parameters<typeof processGenerationJob>[0]["provider"];
  storage: Parameters<typeof processGenerationJob>[0]["storage"];
  processJob?: typeof processGenerationJob;
  now?: Date;
}): Promise<WorkerOnceResult> {
  const now = input.now ?? new Date();
  const job = await findNextGenerationJob(input.db, now);
  if (!job) {
    return { status: "IDLE" };
  }

  return (input.processJob ?? processGenerationJob)({
    db: input.db,
    provider: input.provider,
    storage: input.storage,
    jobId: job.id,
    now,
  });
}

export async function startGenerationWorker(input: {
  pollIntervalMs?: number;
  stopSignal?: AbortSignal;
} = {}): Promise<void> {
  const pollIntervalMs = input.pollIntervalMs ?? Number(process.env.WORKER_POLL_INTERVAL_MS ?? 3000);
  const db = getDb();
  const provider = getImageProvider();
  const storage = getObjectStore();

  while (!input.stopSignal?.aborted) {
    try {
      const result = await runGenerationWorkerOnce({ db, provider, storage });
      if (result.status !== "IDLE") {
        console.log(`CourtFit generation job ${result.status}`, result);
      }
    } catch (error) {
      console.error("CourtFit generation worker iteration failed", error);
    }

    await sleep(pollIntervalMs, input.stopSignal);
  }
}

function sleep(ms: number, stopSignal?: AbortSignal): Promise<void> {
  if (stopSignal?.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    stopSignal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
