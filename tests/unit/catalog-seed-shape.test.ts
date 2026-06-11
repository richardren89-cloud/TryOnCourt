import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  outfitPlaceholders,
  placeholderUpsertUpdates,
} from "@/prisma/seed";

describe("catalog seed placeholders", () => {
  it("defines ten unpublished placeholders split evenly across ATP and WTA", () => {
    expect(outfitPlaceholders).toHaveLength(10);
    expect(outfitPlaceholders.every((item) => item.published === false)).toBe(true);
    expect(outfitPlaceholders.filter((item) => item.tour === "ATP")).toHaveLength(5);
    expect(outfitPlaceholders.filter((item) => item.tour === "WTA")).toHaveLength(5);
  });

  it("uses unique stable slugs and pending placeholder sources", () => {
    const playerSlugs = outfitPlaceholders.map((item) => item.playerSlug);
    const outfitSlugs = outfitPlaceholders.map((item) => item.outfitSlug);

    expect(new Set(playerSlugs).size).toBe(10);
    expect(new Set(outfitSlugs).size).toBe(10);
    expect(
      outfitPlaceholders.every(
        (item) =>
          item.rankingVerifiedAt === null &&
          item.source.verificationStatus === "PENDING" &&
          item.source.url.startsWith("https://example.invalid/"),
      ),
    ).toBe(true);
  });

  it("never downgrades existing verified or published records during upsert", () => {
    expect(placeholderUpsertUpdates).toEqual({
      player: {},
      outfit: {},
      source: {},
    });
  });
});

describe("Prisma schema shape", () => {
  it("contains the required enums, models, idempotency keys, and outbox fields", async () => {
    const schema = await readFile(
      resolve(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    const requiredEnums = [
      "OutfitType",
      "Tour",
      "PhotoKind",
      "GenerationStatus",
      "LedgerType",
    ];
    const requiredModels = [
      "User",
      "ConsentRecord",
      "Session",
      "Player",
      "RankingSnapshot",
      "Collection",
      "Outfit",
      "OutfitItem",
      "SourceReference",
      "CreditLedgerEntry",
      "UploadedPhoto",
      "GenerationJob",
      "GeneratedAsset",
      "QueueOutbox",
    ];

    for (const enumName of requiredEnums) {
      expect(schema).toContain(`enum ${enumName} {`);
    }
    for (const modelName of requiredModels) {
      expect(schema).toContain(`model ${modelName} {`);
    }
    expect(schema).toContain("@@unique([userId, businessKey])");
    expect(schema).toContain("@@unique([userId, clientKey])");
    expect(schema).toContain("@@unique([id, userId])");
    expect(schema).toMatch(
      /@relation\("GenerationFullBodyPhoto", fields: \[fullBodyPhotoId, userId\], references: \[id, userId\], onDelete: Restrict\)/,
    );
    expect(schema).toMatch(
      /@relation\("GenerationHeadshotPhoto", fields: \[headshotPhotoId, userId\], references: \[id, userId\], onDelete: Restrict\)/,
    );
    expect(schema).toMatch(/payload\s+Json/);
    expect(schema).toMatch(/publishedAt\s+DateTime\?/);
    expect(schema).toMatch(/attemptCount\s+Int\s+@default\(0\)/);
  });

  it("ships an initial MySQL migration with composite integrity constraints", async () => {
    const migration = await readFile(
      resolve(
        process.cwd(),
        "prisma/migrations/20260611160000_init/migration.sql",
      ),
      "utf8",
    );
    const lock = await readFile(
      resolve(process.cwd(), "prisma/migrations/migration_lock.toml"),
      "utf8",
    );

    expect(lock).toContain('provider = "mysql"');
    expect(migration).toContain("`CreditLedgerEntry_userId_businessKey_key`");
    expect(migration).toContain("`GenerationJob_userId_clientKey_key`");
    expect(migration).toContain("`UploadedPhoto_id_userId_key`");
    expect(migration).toMatch(
      /FOREIGN KEY \(`fullBodyPhotoId`, `userId`\) REFERENCES `UploadedPhoto`\(`id`, `userId`\)/,
    );
    expect(migration).toMatch(
      /FOREIGN KEY \(`headshotPhotoId`, `userId`\) REFERENCES `UploadedPhoto`\(`id`, `userId`\)/,
    );
  });

  it("generates Prisma Client in the image and copies it into the runtime", async () => {
    const dockerfile = await readFile(resolve(process.cwd(), "Dockerfile"), "utf8");

    expect(dockerfile).toMatch(
      /COPY prisma\.config\.ts \.\/\s+RUN DATABASE_URL=mysql:\/\/prisma:prisma@localhost:3306\/prisma npx prisma generate/,
    );
    expect(dockerfile).toContain(
      "COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma",
    );
    expect(dockerfile).toContain("RUN npm ci --omit=dev");
  });
});
