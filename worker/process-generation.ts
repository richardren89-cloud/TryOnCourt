import { ImageProviderError, type ProviderFailure } from "@/lib/image-provider/types";
import { buildTryOnPrompt } from "@/lib/generations/prompt";
import { cleanupSourcePhotos } from "@/lib/uploads/cleanup";
import type { ImageProvider } from "@/lib/image-provider/types";
import type { PrivateObjectStore } from "@/lib/storage/types";

export const MAX_GENERATION_ATTEMPTS = 3;
const DEFAULT_LEASE_MS = 5 * 60 * 1000;

export class ImageGenerationFailure extends Error {
  constructor(readonly failure: ProviderFailure) {
    super(failure.code);
    this.name = "ImageGenerationFailure";
  }
}

export type ProcessGenerationResult =
  | { status: "SUCCEEDED"; jobId: string }
  | { status: "RETRYING"; jobId: string; failureCode: string }
  | { status: "FAILED_REFUNDED"; jobId: string; failureCode: string }
  | { status: "SKIPPED"; reason: "NOT_LEASED" };

interface WorkerPhoto {
  id: string;
  storageKey: string;
}

interface WorkerOutfitItem {
  category: string;
  displayName: string;
  brand: string | null;
  productName: string | null;
  colorDescription: string | null;
  promptDescription: string | null;
}

interface WorkerJob {
  id: string;
  userId: string;
  attemptCount: number;
  saveSource: boolean;
  outfit: {
    title: string;
    promptDescription: string | null;
    items: WorkerOutfitItem[];
  };
  fullBodyPhoto: WorkerPhoto;
  headshotPhoto: WorkerPhoto;
}

interface WorkerTx {
  user: {
    update(input: { where: { id: string }; data: { updatedAt: Date } }): Promise<unknown>;
  };
  generationJob: {
    updateMany(input: {
      where: {
        id: string;
        OR: Array<
          | { status: "PENDING" }
          | { status: "PROCESSING"; leaseExpiresAt: { lt: Date } }
        >;
      };
      data: {
        status: "PROCESSING";
        attemptCount: { increment: 1 };
        leaseExpiresAt: Date;
      };
    }): Promise<{ count: number }>;
    findUnique(input: {
      where: { id: string };
      include: {
        outfit: { include: { items: { orderBy: { displayOrder: "asc" } } } };
        fullBodyPhoto: true;
        headshotPhoto: true;
      };
    }): Promise<WorkerJob | null>;
    update(input: {
      where: { id: string };
      data: {
        status: "PENDING" | "SUCCEEDED" | "FAILED_REFUNDED";
        failureCode?: string | null;
        leaseExpiresAt: null;
      };
    }): Promise<unknown>;
  };
  generatedAsset: {
    findFirst(input: { where: { jobId: string; deletedAt: null } }): Promise<unknown | null>;
    create(input: {
      data: {
        jobId: string;
        storageKey: string;
        mimeType: "image/png" | "image/jpeg";
        byteSize: number;
      };
    }): Promise<unknown>;
  };
  creditLedgerEntry: {
    findUnique(input: {
      where: { userId_businessKey: { userId: string; businessKey: string } };
    }): Promise<unknown | null>;
    create(input: {
      data: {
        userId: string;
        type: "GENERATION_REFUND";
        amount: 1;
        businessKey: string;
        note: string;
      };
    }): Promise<unknown>;
  };
  uploadedPhoto: {
    updateMany(input: {
      where: { userId: string; id: { in: string[] }; deletedAt: null };
      data: { deletedAt: Date };
    }): Promise<unknown>;
  };
}

interface WorkerDb {
  $transaction<T>(callback: (client: WorkerTx) => Promise<T>): Promise<T>;
  uploadedPhoto: WorkerTx["uploadedPhoto"];
}

export async function processGenerationJob(input: {
  db: WorkerDb;
  provider: ImageProvider;
  storage: PrivateObjectStore;
  jobId: string;
  now?: Date;
  leaseMs?: number;
}): Promise<ProcessGenerationResult> {
  const now = input.now ?? new Date();
  const job = await leaseGenerationJob(input.db, input.jobId, now, input.leaseMs ?? DEFAULT_LEASE_MS);
  if (!job) {
    return { status: "SKIPPED", reason: "NOT_LEASED" };
  }

  try {
    const [fullBodyImage, headshotImage] = await Promise.all([
      input.storage.read(job.fullBodyPhoto.storageKey),
      input.storage.read(job.headshotPhoto.storageKey),
    ]);
    const prompt = buildPrompt(job);
    const generated = await input.provider.generate({ prompt, fullBodyImage, headshotImage });
    const storageKey = generatedObjectKey(job, generated.mimeType);

    await input.storage.write({
      key: storageKey,
      body: generated.image,
      contentType: generated.mimeType,
    });
    await finalizeSuccess(input.db, job, storageKey, generated.mimeType, generated.image.byteLength);

    if (!job.saveSource) {
      await cleanupSourcePhotos({
        db: input.db,
        storage: input.storage,
        userId: job.userId,
        photos: [job.fullBodyPhoto, job.headshotPhoto],
        now,
      });
    }

    return { status: "SUCCEEDED", jobId: job.id };
  } catch (error) {
    const failure = classifyError(error);
    if (failure.kind === "TRANSIENT" && job.attemptCount < MAX_GENERATION_ATTEMPTS) {
      await markRetrying(input.db, job.id, failure.code);
      return { status: "RETRYING", jobId: job.id, failureCode: failure.code };
    }

    await finalizeFailureWithRefund(input.db, job, failure.code);
    if (!job.saveSource) {
      await cleanupSourcePhotos({
        db: input.db,
        storage: input.storage,
        userId: job.userId,
        photos: [job.fullBodyPhoto, job.headshotPhoto],
        now,
      });
    }

    return { status: "FAILED_REFUNDED", jobId: job.id, failureCode: failure.code };
  }
}

async function leaseGenerationJob(
  db: WorkerDb,
  jobId: string,
  now: Date,
  leaseMs: number,
): Promise<WorkerJob | null> {
  return db.$transaction(async (tx) => {
    const leased = await tx.generationJob.updateMany({
      where: {
        id: jobId,
        OR: [
          { status: "PENDING" },
          { status: "PROCESSING", leaseExpiresAt: { lt: now } },
        ],
      },
      data: {
        status: "PROCESSING",
        attemptCount: { increment: 1 },
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
      },
    });
    if (leased.count !== 1) {
      return null;
    }

    return tx.generationJob.findUnique({
      where: { id: jobId },
      include: {
        outfit: { include: { items: { orderBy: { displayOrder: "asc" } } } },
        fullBodyPhoto: true,
        headshotPhoto: true,
      },
    });
  });
}

async function finalizeSuccess(
  db: WorkerDb,
  job: WorkerJob,
  storageKey: string,
  mimeType: "image/png" | "image/jpeg",
  byteSize: number,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const existingAsset = await tx.generatedAsset.findFirst({
      where: { jobId: job.id, deletedAt: null },
    });
    if (!existingAsset) {
      await tx.generatedAsset.create({
        data: { jobId: job.id, storageKey, mimeType, byteSize },
      });
    }
    await tx.generationJob.update({
      where: { id: job.id },
      data: { status: "SUCCEEDED", failureCode: null, leaseExpiresAt: null },
    });
  });
}

async function markRetrying(db: WorkerDb, jobId: string, failureCode: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.generationJob.update({
      where: { id: jobId },
      data: { status: "PENDING", failureCode, leaseExpiresAt: null },
    });
  });
}

async function finalizeFailureWithRefund(
  db: WorkerDb,
  job: WorkerJob,
  failureCode: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: job.userId },
      data: { updatedAt: new Date() },
    });
    const businessKey = `refund:${job.id}`;
    const existingRefund = await tx.creditLedgerEntry.findUnique({
      where: { userId_businessKey: { userId: job.userId, businessKey } },
    });
    if (!existingRefund) {
      await tx.creditLedgerEntry.create({
        data: {
          userId: job.userId,
          type: "GENERATION_REFUND",
          amount: 1,
          businessKey,
          note: "Generation refund",
        },
      });
    }
    await tx.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED_REFUNDED", failureCode, leaseExpiresAt: null },
    });
  });
}

function buildPrompt(job: WorkerJob): string {
  const outfitItems = job.outfit.items.map((item) =>
    [
      item.category,
      item.brand,
      item.productName ?? item.displayName,
      item.colorDescription,
      item.promptDescription,
    ]
      .filter(Boolean)
      .join(" - "),
  );

  return buildTryOnPrompt({
    outfitTitle: job.outfit.title,
    outfitItems,
    identityNotes: "Use the uploaded full-body and headshot photos only as identity and body references.",
  });
}

function generatedObjectKey(job: WorkerJob, mimeType: "image/png" | "image/jpeg"): string {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return `generated/${job.userId}/${job.id}/try-on.${extension}`;
}

function classifyError(error: unknown): ProviderFailure {
  if (error instanceof ImageGenerationFailure) {
    return error.failure;
  }
  if (error instanceof ImageProviderError) {
    return error.failure;
  }

  return { kind: "TRANSIENT", code: "PROVIDER_UNAVAILABLE" };
}
