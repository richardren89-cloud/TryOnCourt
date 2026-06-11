import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "@/lib/db";
import { CatalogRepository } from "@/lib/catalog/repository";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) {
  describe("CatalogRepository", () => {
    const db = createDb(testDatabaseUrl);
    const repository = new CatalogRepository(db);
    const fixturePrefix = "catalog-repository-test";

    beforeAll(async () => {
      await db.outfit.deleteMany({
        where: { slug: { startsWith: fixturePrefix } },
      });
      await db.player.deleteMany({
        where: { slug: { startsWith: fixturePrefix } },
      });

      for (let index = 0; index < 10; index += 1) {
        const displayOrder = 10 - index;
        const verifiedAt = new Date(Date.UTC(2026, 0, index + 1));
        await db.player.create({
          data: {
            slug: `${fixturePrefix}-player-${index + 1}`,
            displayName: `Fixture Player ${index + 1}`,
            tour: index < 5 ? "ATP" : "WTA",
            rankingSnapshots: {
              create: [
                {
                  rank: 100 + index,
                  verifiedAt: new Date(Date.UTC(2025, 0, index + 1)),
                  sourceUrl: `https://example.test/rank/old/${index + 1}`,
                },
                {
                  rank: index + 1,
                  verifiedAt,
                  sourceUrl: `https://example.test/rank/current/${index + 1}`,
                },
              ],
            },
            outfits: {
              create: {
                slug: `${fixturePrefix}-outfit-${index + 1}`,
                title: `Fixture Outfit ${index + 1}`,
                type: "PLAYER_INSPIRED",
                season: "TEST",
                rankingVerifiedAt: verifiedAt,
                displayOrder,
                published: true,
                items: {
                  create: [
                    {
                      category: "SHOES",
                      displayName: `Fixture Shoes ${index + 1}`,
                      displayOrder: 2,
                    },
                    {
                      category: "TOP",
                      displayName: `Fixture Top ${index + 1}`,
                      displayOrder: 1,
                    },
                  ],
                },
                sourceReferences: {
                  create: [
                    {
                      sourceKey: `${fixturePrefix}-source-later-${index + 1}`,
                      label: "Later source",
                      url: `https://example.test/source/later/${index + 1}`,
                      verificationStatus: "VERIFIED",
                      verifiedAt,
                      createdAt: new Date(Date.UTC(2026, 1, 2)),
                    },
                    {
                      sourceKey: `${fixturePrefix}-source-earlier-${index + 1}`,
                      label: "Earlier source",
                      url: `https://example.test/source/earlier/${index + 1}`,
                      verificationStatus: "VERIFIED",
                      verifiedAt,
                      createdAt: new Date(Date.UTC(2026, 1, 1)),
                    },
                  ],
                },
              },
            },
          },
        });
      }

      await db.outfit.create({
        data: {
          slug: `${fixturePrefix}-unpublished`,
          title: "Unpublished Fixture Outfit",
          type: "PLAYER_INSPIRED",
          season: "TEST",
          displayOrder: 0,
          published: false,
        },
      });
    });

    afterAll(async () => {
      await db.outfit.deleteMany({
        where: { slug: { startsWith: fixturePrefix } },
      });
      await db.player.deleteMany({
        where: { slug: { startsWith: fixturePrefix } },
      });
      await db.$disconnect();
    });

    it("returns published player-inspired outfits in display order", async () => {
      const outfits = await repository.listPublished();
      const fixtures = outfits.filter((outfit) =>
        outfit.slug.startsWith(fixturePrefix),
      );

      expect(fixtures).toHaveLength(10);
      expect(fixtures.every((item) => item.type === "PLAYER_INSPIRED")).toBe(true);
      expect(fixtures.some((item) => item.slug.endsWith("-unpublished"))).toBe(
        false,
      );
      expect(fixtures.map((item) => item.displayOrder)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
      expect(fixtures[0]).toMatchObject({
        rankingVerifiedAt: "2026-01-10T00:00:00.000Z",
        player: {
          displayName: "Fixture Player 10",
          tour: "WTA",
          rank: 10,
        },
      });
      expect(fixtures[0]?.items.map((item) => item.category)).toEqual([
        "TOP",
        "SHOES",
      ]);
      expect(fixtures[0]?.sources.map((source) => source.label)).toEqual([
        "Earlier source",
        "Later source",
      ]);
    });
  });
} else {
  console.warn(
    "Skipping catalog repository MySQL integration test: TEST_DATABASE_URL is not set.",
  );
  describe.skip("CatalogRepository", () => {
    it("requires TEST_DATABASE_URL to run the MySQL integration fixture", () => {});
  });
}
