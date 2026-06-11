import { access } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { rankingSources, rankingVerifiedAt, topTenSeedOutfits } from "@/prisma/seed";

describe("catalog seed content", () => {
  it("publishes exactly ten sourced top-five player outfits", async () => {
    expect(topTenSeedOutfits).toHaveLength(10);
    expect(topTenSeedOutfits.filter((outfit) => outfit.tour === "ATP").map((outfit) => outfit.rank)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(topTenSeedOutfits.filter((outfit) => outfit.tour === "WTA").map((outfit) => outfit.rank)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(rankingVerifiedAt.toISOString()).toBe("2026-06-11T00:00:00.000Z");
    expect(rankingSources).toEqual({
      ATP: "https://www.atptour.com/en/rankings/singles",
      WTA: "https://www.wtatennis.com/rankings/singles",
    });

    for (const outfit of topTenSeedOutfits) {
      expect(outfit.outfitSlug).toMatch(/^[a-z0-9-]+$/);
      expect(outfit.coverImageUrl).toBe(`/demo-outfits/${outfit.outfitSlug}/flatlay.svg`);
      expect(outfit.sources).toHaveLength(3);
      expect(outfit.sources.every((source) => source.url.length > 0)).toBe(true);
      expect(outfit.items).toHaveLength(6);
      expect(outfit.items.every((item) => item.brand && item.productName)).toBe(true);

      await access(join(process.cwd(), "public", outfit.coverImageUrl.replace(/^\//, "")));
    }
  });
});
