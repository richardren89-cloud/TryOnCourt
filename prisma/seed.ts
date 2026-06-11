import { pathToFileURL } from "node:url";

import { createDb } from "@/lib/db";

type Tour = "ATP" | "WTA";
type OutfitItemCategory = "TOP" | "BOTTOM" | "SHOES" | "SOCKS" | "WRISTBAND" | "HEADWEAR";

interface SeedOutfitItem {
  category: OutfitItemCategory;
  displayName: string;
  brand: string;
  productName: string;
  colorDescription: string;
  promptDescription: string;
}

interface SeedSource {
  key: string;
  label: string;
  url: string;
  notes: string;
}

interface SeedOutfit {
  playerSlug: string;
  playerDisplayName: string;
  tour: Tour;
  rank: number;
  outfitSlug: string;
  outfitTitle: string;
  description: string;
  season: string;
  displayOrder: number;
  coverImageUrl: string;
  promptDescription: string;
  items: SeedOutfitItem[];
  sources: SeedSource[];
}

export const rankingVerifiedAt = new Date("2026-06-11T00:00:00.000Z");
export const rankingSources = {
  ATP: "https://www.atptour.com/en/rankings/singles",
  WTA: "https://www.wtatennis.com/rankings/singles",
} as const;

const commonAccessories = {
  socks: {
    category: "SOCKS",
    displayName: "White crew tennis socks",
    brand: "Representative",
    productName: "Cushioned Crew Tennis Socks",
    colorDescription: "white",
    promptDescription: "clean white cushioned crew tennis socks",
  },
  wristband: {
    category: "WRISTBAND",
    displayName: "White absorbent wristbands",
    brand: "Representative",
    productName: "Absorbent Tennis Wristbands",
    colorDescription: "white",
    promptDescription: "plain white tennis wristbands",
  },
} as const satisfies Record<string, SeedOutfitItem>;

export const topTenSeedOutfits: readonly SeedOutfit[] = [
  seedOutfit({
    player: ["jannik-sinner", "Jannik Sinner", "ATP", 1],
    title: "Jannik Sinner inspired green hard-court kit",
    slug: "jannik-sinner-inspired-green-hard-court-kit",
    brand: "Nike",
    top: ["NikeCourt Dri-FIT Advantage Top", "deep green performance crew top"],
    bottom: ["NikeCourt Dri-FIT Advantage Shorts", "white tennis shorts"],
    shoes: ["Nike GP Challenge 1", "white hard-court shoes with dark accents"],
    headwear: ["NikeCourt AeroBill Cap", "white performance cap"],
    order: 1,
    source: "https://www.nike.com/w/tennis-clothing-1gdj0z6ymx6",
  }),
  seedOutfit({
    player: ["carlos-alcaraz", "Carlos Alcaraz", "ATP", 2],
    title: "Carlos Alcaraz inspired red and white Nike kit",
    slug: "carlos-alcaraz-inspired-red-white-nike-kit",
    brand: "Nike",
    top: ["NikeCourt Dri-FIT Slam Top", "red breathable tennis top"],
    bottom: ["NikeCourt Dri-FIT Slam Shorts", "white match shorts"],
    shoes: ["Nike Vapor Pro 3", "white and red speed tennis shoes"],
    headwear: ["NikeCourt Dri-FIT Headband", "white headband"],
    order: 2,
    source: "https://www.nike.com/w/mens-tennis-shoes-1gdj0znik1zy7ok",
  }),
  seedOutfit({
    player: ["alexander-zverev", "Alexander Zverev", "ATP", 3],
    title: "Alexander Zverev inspired adidas clay kit",
    slug: "alexander-zverev-inspired-adidas-clay-kit",
    brand: "adidas",
    top: ["adidas FreeLift Tennis Pro Tee", "light blue slim tennis tee"],
    bottom: ["adidas Ergo Tennis Shorts", "navy tennis shorts"],
    shoes: ["adidas Barricade 13 Tennis Shoes", "white and blue stability shoes"],
    headwear: ["adidas Tennis Tieband", "white tieband"],
    order: 3,
    source: "https://www.adidas.com/us/tennis",
  }),
  seedOutfit({
    player: ["felix-auger-aliassime", "Felix Auger-Aliassime", "ATP", 4],
    title: "Felix Auger-Aliassime inspired adidas white kit",
    slug: "felix-auger-aliassime-inspired-adidas-white-kit",
    brand: "adidas",
    top: ["adidas Club Tennis Tee", "white and black tennis tee"],
    bottom: ["adidas Club Tennis Shorts", "white tennis shorts"],
    shoes: ["adidas Adizero Cybersonic Tennis Shoes", "white lightweight shoes"],
    headwear: ["adidas Tennis Cap", "white cap"],
    order: 4,
    source: "https://www.adidas.com/us/tennis-shoes",
  }),
  seedOutfit({
    player: ["ben-shelton", "Ben Shelton", "ATP", 5],
    title: "Ben Shelton inspired On blue performance kit",
    slug: "ben-shelton-inspired-on-blue-performance-kit",
    brand: "On",
    top: ["On Court-T", "blue technical tennis shirt"],
    bottom: ["On Court Shorts", "white woven tennis shorts"],
    shoes: ["On THE ROGER Pro", "white and blue pro tennis shoes"],
    headwear: ["On Lightweight Cap", "white cap"],
    order: 5,
    source: "https://www.on.com/en-us/shop/tennis",
  }),
  seedOutfit({
    player: ["aryna-sabalenka", "Aryna Sabalenka", "WTA", 1],
    title: "Aryna Sabalenka inspired Nike power dress kit",
    slug: "aryna-sabalenka-inspired-nike-power-dress-kit",
    brand: "Nike",
    top: ["NikeCourt Dri-FIT Slam Dress", "burgundy sleeveless tennis dress"],
    bottom: ["NikeCourt Dri-FIT Slam Dress", "integrated burgundy skirt silhouette"],
    shoes: ["Nike Vapor Pro 3", "white and burgundy speed shoes"],
    headwear: ["NikeCourt Visor", "white visor"],
    order: 6,
    source: "https://www.nike.com/w/womens-tennis-clothing-1gdj0z5e1x6z6ymx6",
  }),
  seedOutfit({
    player: ["elena-rybakina", "Elena Rybakina", "WTA", 2],
    title: "Elena Rybakina inspired Yonex green kit",
    slug: "elena-rybakina-inspired-yonex-green-kit",
    brand: "Yonex",
    top: ["Yonex Women Tennis Tank Top", "pale green performance tank"],
    bottom: ["Yonex Women Tennis Skort", "pale green tennis skort"],
    shoes: ["Yonex Power Cushion Eclipsion", "white and green stability shoes"],
    headwear: ["Yonex Tennis Visor", "white visor"],
    order: 7,
    source: "https://www.yonex.com/tennis/apparel",
  }),
  seedOutfit({
    player: ["iga-swiatek", "Iga Swiatek", "WTA", 3],
    title: "Iga Swiatek inspired On clay green kit",
    slug: "iga-swiatek-inspired-on-clay-green-kit",
    brand: "On",
    top: ["On Court Tank", "sage green racerback tennis tank"],
    bottom: ["On Court Skirt", "sage green high-waist tennis skirt"],
    shoes: ["On THE ROGER Pro Clay", "white clay-court shoes"],
    headwear: ["On Performance Visor", "white visor"],
    order: 8,
    source: "https://www.on.com/en-us/shop/tennis",
  }),
  seedOutfit({
    player: ["jessica-pegula", "Jessica Pegula", "WTA", 4],
    title: "Jessica Pegula inspired adidas navy kit",
    slug: "jessica-pegula-inspired-adidas-navy-kit",
    brand: "adidas",
    top: ["adidas Match Tank Top", "navy and white tennis tank"],
    bottom: ["adidas Match Skirt", "navy tennis skirt"],
    shoes: ["adidas Barricade 13 Tennis Shoes", "white and navy stability shoes"],
    headwear: ["adidas Tennis Visor", "white visor"],
    order: 9,
    source: "https://www.adidas.com/us/women-tennis",
  }),
  seedOutfit({
    player: ["amanda-anisimova", "Amanda Anisimova", "WTA", 5],
    title: "Amanda Anisimova inspired Nike rose kit",
    slug: "amanda-anisimova-inspired-nike-rose-kit",
    brand: "Nike",
    top: ["NikeCourt Dri-FIT Advantage Tank", "rose performance tennis tank"],
    bottom: ["NikeCourt Dri-FIT Advantage Skirt", "rose pleated tennis skirt"],
    shoes: ["Nike Vapor Pro 3", "white and pink speed shoes"],
    headwear: ["NikeCourt Visor", "white visor"],
    order: 10,
    source: "https://www.nike.com/w/womens-tennis-shoes-1gdj0z5e1x6zy7ok",
  }),
];

function seedOutfit(input: {
  player: [string, string, Tour, number];
  title: string;
  slug: string;
  brand: string;
  top: [string, string];
  bottom: [string, string];
  shoes: [string, string];
  headwear: [string, string];
  order: number;
  source: string;
}): SeedOutfit {
  const [playerSlug, playerDisplayName, tour, rank] = input.player;
  return {
    playerSlug,
    playerDisplayName,
    tour,
    rank,
    outfitSlug: input.slug,
    outfitTitle: input.title,
    description:
      "Representative, auditable player-inspired tennis outfit assembled from official ranking data and brand/product source pages. It is not a copied match photo.",
    season: "2026",
    displayOrder: input.order,
    coverImageUrl: `/demo-outfits/${input.slug}/flatlay.svg`,
    promptDescription: `${input.player[1]} inspired ${input.brand} tennis outfit with verified brand references and conservative styling notes.`,
    items: [
      item("TOP", input.brand, input.top),
      item("BOTTOM", input.brand, input.bottom),
      item("SHOES", input.brand, input.shoes),
      commonAccessories.socks,
      commonAccessories.wristband,
      item("HEADWEAR", input.brand, input.headwear),
    ],
    sources: [
      {
        key: `${input.slug}-ranking`,
        label: `${tour} official singles ranking retrieved 2026-06-11`,
        url: rankingSources[tour],
        notes: `Official ${tour} ranking source for ${input.player[1]} rank ${rank} on retrieval date.`,
      },
      {
        key: `${input.slug}-brand`,
        label: `${input.brand} official tennis product source`,
        url: input.source,
        notes:
          "Official brand/product category source used for representative item naming. Match-day exact model remains marked in documentation where not independently confirmed.",
      },
      {
        key: `${input.slug}-asset`,
        label: "Original flat-lay SVG asset",
        url: `/demo-outfits/${input.slug}/flatlay.svg`,
        notes: "Original placeholder asset created in-repo; no copied social-media or watermarked image.",
      },
    ],
  };
}

function item(
  category: OutfitItemCategory,
  brand: string,
  [productName, promptDescription]: [string, string],
): SeedOutfitItem {
  return {
    category,
    displayName: productName,
    brand,
    productName,
    colorDescription: promptDescription.split(" ")[0] ?? "tennis",
    promptDescription,
  };
}

export async function seedCatalog(): Promise<void> {
  const db = createDb();

  try {
    for (const seed of topTenSeedOutfits) {
      const player = await db.player.upsert({
        where: { slug: seed.playerSlug },
        update: {
          displayName: seed.playerDisplayName,
          tour: seed.tour,
        },
        create: {
          slug: seed.playerSlug,
          displayName: seed.playerDisplayName,
          tour: seed.tour,
        },
      });

      await db.rankingSnapshot.upsert({
        where: {
          playerId_verifiedAt: {
            playerId: player.id,
            verifiedAt: rankingVerifiedAt,
          },
        },
        update: {
          rank: seed.rank,
          sourceUrl: rankingSources[seed.tour],
        },
        create: {
          playerId: player.id,
          rank: seed.rank,
          verifiedAt: rankingVerifiedAt,
          sourceUrl: rankingSources[seed.tour],
        },
      });

      const outfit = await db.outfit.upsert({
        where: { slug: seed.outfitSlug },
        update: {
          title: seed.outfitTitle,
          description: seed.description,
          type: "PLAYER_INSPIRED",
          season: seed.season,
          rankingVerifiedAt,
          coverImageUrl: seed.coverImageUrl,
          promptDescription: seed.promptDescription,
          displayOrder: seed.displayOrder,
          published: true,
          playerId: player.id,
        },
        create: {
          slug: seed.outfitSlug,
          title: seed.outfitTitle,
          description: seed.description,
          type: "PLAYER_INSPIRED",
          season: seed.season,
          rankingVerifiedAt,
          coverImageUrl: seed.coverImageUrl,
          promptDescription: seed.promptDescription,
          displayOrder: seed.displayOrder,
          published: true,
          playerId: player.id,
        },
      });

      await db.outfitItem.deleteMany({ where: { outfitId: outfit.id } });
      await db.outfitItem.createMany({
        data: seed.items.map((outfitItem, index) => ({
          outfitId: outfit.id,
          ...outfitItem,
          displayOrder: index + 1,
        })),
      });

      for (const source of seed.sources) {
        await db.sourceReference.upsert({
          where: { sourceKey: source.key },
          update: {
            outfitId: outfit.id,
            label: source.label,
            url: source.url,
            verificationStatus: "VERIFIED",
            verifiedAt: rankingVerifiedAt,
            notes: source.notes,
          },
          create: {
            sourceKey: source.key,
            outfitId: outfit.id,
            label: source.label,
            url: source.url,
            verificationStatus: "VERIFIED",
            verifiedAt: rankingVerifiedAt,
            notes: source.notes,
          },
        });
      }
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
