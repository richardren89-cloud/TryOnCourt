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

    expect(screen.getByText("职业球员灵感 · ATP #1")).toBeInTheDocument();
    expect(screen.getByText("ATP Player 1 Outfit")).toBeInTheDocument();
    expect(screen.getByText("ATP Player 1 · 2026")).toBeInTheDocument();
    expect(screen.getByText("上装: Green performance top")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看穿搭" })).toHaveAttribute(
      "href",
      "/outfits/atp-player-1-outfit",
    );
  });

  it("renders original flat-lay artwork when a cover image exists", () => {
    render(
      <OutfitCard
        outfit={{
          ...fixture,
          coverImageUrl: "/demo-outfits/atp-player-1-outfit/flatlay.svg",
        }}
      />,
    );

    expect(screen.getByRole("img", { name: "ATP Player 1 Outfit 穿搭平铺图" })).toHaveAttribute(
      "src",
      "/demo-outfits/atp-player-1-outfit/flatlay.svg",
    );
  });

  it("treats early ATP/WTA demo rows as player-inspired catalog cards", () => {
    render(
      <OutfitCard
        outfit={{
          ...fixture,
          title: "WTA #2 Green Clay Look",
          type: "OWN_BRAND",
          player: null,
        }}
      />,
    );

    expect(screen.getByText("职业球员灵感 · WTA #2")).toBeInTheDocument();
  });
});
