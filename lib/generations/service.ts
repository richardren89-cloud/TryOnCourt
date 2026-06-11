import type { GenerationStatus } from "@prisma/client";

import { InsufficientCreditsError, getCreditBalance } from "@/lib/credits/service";

export interface CreateGenerationInput {
  userId: string;
  outfitId: string;
  fullBodyPhotoId: string;
  headshotPhotoId: string;
  saveSource: boolean;
  clientKey: string;
}

interface GenerationTx {
  user: {
    update(input: { where: { id: string }; data: { updatedAt: Date } }): Promise<unknown>;
  };
  creditLedgerEntry: {
    aggregate(input: {
      where: { userId: string };
      _sum: { amount: true };
    }): Promise<{ _sum: { amount: number | null } }>;
    findUnique(input: {
      where: { userId_businessKey: { userId: string; businessKey: string } };
    }): Promise<unknown | null>;
    create(input: { data: unknown }): Promise<unknown>;
  };
  outfit: {
    findFirst(input: {
      where: { id: string; published: true };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
  uploadedPhoto: {
    count(input: {
      where: {
        userId: string;
        deletedAt: null;
        OR: Array<{ id: string; kind: "FULL_BODY" | "HEADSHOT" }>;
      };
    }): Promise<number>;
  };
  generationJob: {
    findUnique(input: {
      where: { userId_clientKey: { userId: string; clientKey: string } };
      select: { id: true; status: true };
    }): Promise<{ id: string; status: GenerationStatus } | null>;
    create(input: {
      data: {
        userId: string;
        outfitId: string;
        fullBodyPhotoId: string;
        headshotPhotoId: string;
        saveSource: boolean;
        clientKey: string;
      };
      select: { id: true; status: true };
    }): Promise<{ id: string; status: GenerationStatus }>;
  };
  queueOutbox: {
    create(input: {
      data: {
        generationJobId: string;
        topic: "generation.requested";
        payload: { jobId: string };
      };
    }): Promise<unknown>;
  };
}

interface GenerationDb {
  $transaction<T>(callback: (client: GenerationTx) => Promise<T>): Promise<T>;
}

export async function createGenerationJob(
  db: GenerationDb,
  input: CreateGenerationInput,
): Promise<{ id: string; status: GenerationStatus }> {
  return db.$transaction(async (tx) => {
    const existing = await tx.generationJob.findUnique({
      where: {
        userId_clientKey: {
          userId: input.userId,
          clientKey: input.clientKey,
        },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      return existing;
    }

    const outfit = await tx.outfit.findFirst({
      where: { id: input.outfitId, published: true },
      select: { id: true },
    });
    if (!outfit) {
      throw new Error("Outfit is not available.");
    }

    const matchingPhotos = await tx.uploadedPhoto.count({
      where: {
        userId: input.userId,
        deletedAt: null,
        OR: [
          { id: input.fullBodyPhotoId, kind: "FULL_BODY" },
          { id: input.headshotPhotoId, kind: "HEADSHOT" },
        ],
      },
    });
    if (matchingPhotos !== 2) {
      throw new Error("Both required photos must belong to the user.");
    }

    await spendCreditInTransaction(tx, input.userId, `generation:${input.clientKey}`);
    const job = await tx.generationJob.create({
      data: {
        userId: input.userId,
        outfitId: input.outfitId,
        fullBodyPhotoId: input.fullBodyPhotoId,
        headshotPhotoId: input.headshotPhotoId,
        saveSource: input.saveSource,
        clientKey: input.clientKey,
      },
      select: { id: true, status: true },
    });

    await tx.queueOutbox.create({
      data: {
        generationJobId: job.id,
        topic: "generation.requested",
        payload: { jobId: job.id },
      },
    });

    return job;
  });
}

async function spendCreditInTransaction(
  tx: GenerationTx,
  userId: string,
  businessKey: string,
): Promise<void> {
  await tx.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  });
  const existingSpend = await tx.creditLedgerEntry.findUnique({
    where: { userId_businessKey: { userId, businessKey } },
  });
  if (existingSpend) {
    return;
  }

  const balance = await getCreditBalance(tx, userId);
  if (balance < 1) {
    throw new InsufficientCreditsError();
  }

  await tx.creditLedgerEntry.create({
    data: {
      userId,
      type: "GENERATION_SPEND",
      amount: -1,
      businessKey,
      note: "Generation spend",
    },
  });
}
