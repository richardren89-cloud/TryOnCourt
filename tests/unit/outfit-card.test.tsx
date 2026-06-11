import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OutfitCard } from "@/components/outfits/outfit-card";
import type { OutfitSummary } from "@/lib/catalog/types";

const fixture: OutfitSummary = {
  id: "outfit_1",
  slug: "atp-player-1-outfit",
  title: "ATP Player 1 Outfit",
  description: "Green and white court look",
  type: "PLAYER_INSPIRED",
  season: "2026",
  displayOrder: 1,
  coverImageUrl: null,
  rankingVerifiedAt: "2026-06-01T00:00:00.000Z",
  player: {
    displayName: "ATP Player 1",
    tour: "ATP",
    rank: 1,
  },
  items: [
    {
      id: "item_1",
      category: "TOP",
      displayName: "Green performance top",
      brand: "Brand",
      productName: "Top Model",
      colorDescription: "Green",
      displayOrder: 1,
    },
  ],
  sources: [
    {
      label: "Brand source",
      url: "https://example.test/source",
      verificationStatus: "VERIFIED",
      verifiedAt: "2026-06-01T00:00:00.000Z",
    },
  ],
};

describe("OutfitCard", () => {
  it("labels player outfits and links to details", () => {
    render(<OutfitCard outfit={fixture} />);

    expect(screen.getByText("ATP TOP 5")).toBeInTheDocument();
    expect(screen.getByText("ATP Player 1 Outfit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看穿搭" })).toHaveAttribute(
      "href",
      "/outfits/atp-player-1-outfit",
    );
  });
});
