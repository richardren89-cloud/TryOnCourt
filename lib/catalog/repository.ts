import { Prisma, type PrismaClient } from "@prisma/client";

import type { OutfitSummary } from "@/lib/catalog/types";

const publishedOutfitSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  type: true,
  season: true,
  displayOrder: true,
  coverImageUrl: true,
  rankingVerifiedAt: true,
  player: {
    select: {
      displayName: true,
      tour: true,
      rankingSnapshots: {
        orderBy: { verifiedAt: "desc" },
        take: 1,
        select: { rank: true },
      },
    },
  },
  items: {
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      category: true,
      displayName: true,
      brand: true,
      productName: true,
      colorDescription: true,
      displayOrder: true,
    },
  },
  sourceReferences: {
    orderBy: { createdAt: "asc" },
    select: {
      label: true,
      url: true,
      verificationStatus: true,
      verifiedAt: true,
    },
  },
} satisfies Prisma.OutfitSelect;

type PublishedOutfitRecord = Prisma.OutfitGetPayload<{
  select: typeof publishedOutfitSelect;
}>;

export class CatalogRepository {
  constructor(private readonly db: Pick<PrismaClient, "outfit">) {}

  async listPublished(): Promise<OutfitSummary[]> {
    const outfits = await this.db.outfit.findMany({
      where: { published: true },
      orderBy: [{ displayOrder: "asc" }, { slug: "asc" }],
      select: publishedOutfitSelect,
    });

    return outfits.map(mapOutfitSummary);
  }
}

function mapOutfitSummary(outfit: PublishedOutfitRecord): OutfitSummary {
  return {
    id: outfit.id,
    slug: outfit.slug,
    title: outfit.title,
    description: outfit.description,
    type: outfit.type,
    season: outfit.season,
    displayOrder: outfit.displayOrder,
    coverImageUrl: outfit.coverImageUrl,
    rankingVerifiedAt: outfit.rankingVerifiedAt?.toISOString() ?? null,
    player: outfit.player
      ? {
          displayName: outfit.player.displayName,
          tour: outfit.player.tour,
          rank: outfit.player.rankingSnapshots[0]?.rank ?? null,
        }
      : null,
    items: outfit.items,
    sources: outfit.sourceReferences.map((source) => ({
      ...source,
      verifiedAt: source.verifiedAt?.toISOString() ?? null,
    })),
  };
}
