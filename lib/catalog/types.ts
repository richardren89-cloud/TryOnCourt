export type CatalogOutfitType = "PLAYER_INSPIRED" | "OWN_BRAND";
export type CatalogTour = "ATP" | "WTA";

export interface OutfitItemSummary {
  id: string;
  category: string;
  displayName: string;
  brand: string | null;
  productName: string | null;
  colorDescription: string | null;
  displayOrder: number;
}

export interface OutfitSourceSummary {
  label: string;
  url: string;
  verificationStatus: string;
  verifiedAt: string | null;
}

export interface OutfitSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: CatalogOutfitType;
  season: string;
  displayOrder: number;
  coverImageUrl: string | null;
  rankingVerifiedAt: string | null;
  player: {
    displayName: string;
    tour: CatalogTour;
    rank: number | null;
  } | null;
  items: OutfitItemSummary[];
  sources: OutfitSourceSummary[];
}
