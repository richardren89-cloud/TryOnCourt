import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { outfitPlaceholders } from "@/prisma/seed";

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
    expect(schema).toMatch(/businessKey\s+String\s+@unique/);
    expect(schema).toMatch(/clientKey\s+String\s+@unique/);
    expect(schema).toMatch(/payload\s+Json/);
    expect(schema).toMatch(/publishedAt\s+DateTime\?/);
    expect(schema).toMatch(/attemptCount\s+Int\s+@default\(0\)/);
  });
});
