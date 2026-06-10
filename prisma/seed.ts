import { pathToFileURL } from "node:url";

import { createDb } from "@/lib/db";

type PlaceholderTour = "ATP" | "WTA";

interface OutfitPlaceholder {
  playerSlug: string;
  playerDisplayName: string;
  tour: PlaceholderTour;
  outfitSlug: string;
  outfitTitle: string;
  season: string;
  rankingVerifiedAt: null;
  published: false;
  displayOrder: number;
  source: {
    key: string;
    label: string;
    url: string;
    verificationStatus: "PENDING";
  };
}

export const outfitPlaceholders: readonly OutfitPlaceholder[] = [
  ...createTourPlaceholders("ATP"),
  ...createTourPlaceholders("WTA"),
];

function createTourPlaceholders(tour: PlaceholderTour): OutfitPlaceholder[] {
  return Array.from({ length: 5 }, (_, index) => {
    const number = index + 1;
    const tourSlug = tour.toLowerCase();

    return {
      playerSlug: `${tourSlug}-player-${number}`,
      playerDisplayName: `${tour} Player ${number}`,
      tour,
      outfitSlug: `${tourSlug}-player-${number}-outfit-placeholder`,
      outfitTitle: `${tour} Player ${number} Outfit Placeholder`,
      season: "UNVERIFIED",
      rankingVerifiedAt: null,
      published: false,
      displayOrder: tour === "ATP" ? number : number + 5,
      source: {
        key: `${tourSlug}-player-${number}-source-placeholder`,
        label: "Source pending verification",
        url: `https://example.invalid/sources/${tourSlug}-player-${number}`,
        verificationStatus: "PENDING",
      },
    };
  });
}

export async function seedCatalog(): Promise<void> {
  const db = createDb();

  try {
    for (const placeholder of outfitPlaceholders) {
      const player = await db.player.upsert({
        where: { slug: placeholder.playerSlug },
        update: {
          displayName: placeholder.playerDisplayName,
          tour: placeholder.tour,
        },
        create: {
          slug: placeholder.playerSlug,
          displayName: placeholder.playerDisplayName,
          tour: placeholder.tour,
        },
      });

      const outfit = await db.outfit.upsert({
        where: { slug: placeholder.outfitSlug },
        update: {
          title: placeholder.outfitTitle,
          type: "PLAYER_INSPIRED",
          season: placeholder.season,
          rankingVerifiedAt: placeholder.rankingVerifiedAt,
          displayOrder: placeholder.displayOrder,
          published: placeholder.published,
          playerId: player.id,
        },
        create: {
          slug: placeholder.outfitSlug,
          title: placeholder.outfitTitle,
          type: "PLAYER_INSPIRED",
          season: placeholder.season,
          rankingVerifiedAt: placeholder.rankingVerifiedAt,
          displayOrder: placeholder.displayOrder,
          published: placeholder.published,
          playerId: player.id,
        },
      });

      await db.sourceReference.upsert({
        where: { sourceKey: placeholder.source.key },
        update: {
          outfitId: outfit.id,
          label: placeholder.source.label,
          url: placeholder.source.url,
          verificationStatus: placeholder.source.verificationStatus,
          verifiedAt: null,
        },
        create: {
          sourceKey: placeholder.source.key,
          outfitId: outfit.id,
          label: placeholder.source.label,
          url: placeholder.source.url,
          verificationStatus: placeholder.source.verificationStatus,
        },
      });
    }
  } finally {
    await db.$disconnect();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  seedCatalog().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
