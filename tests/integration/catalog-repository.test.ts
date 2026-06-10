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
        await db.player.create({
          data: {
            slug: `${fixturePrefix}-player-${index + 1}`,
            displayName: `Fixture Player ${index + 1}`,
            tour: index < 5 ? "ATP" : "WTA",
            outfits: {
              create: {
                slug: `${fixturePrefix}-outfit-${index + 1}`,
                title: `Fixture Outfit ${index + 1}`,
                type: "PLAYER_INSPIRED",
                season: "TEST",
                displayOrder: 10 - index,
                published: true,
              },
            },
          },
        });
      }
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
      expect(fixtures.map((item) => item.displayOrder)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
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
