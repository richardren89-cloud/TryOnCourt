import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OutfitDetail } from "@/components/outfits/outfit-detail";
import type { OutfitSummary } from "@/lib/catalog/types";

const fixture: OutfitSummary = {
  id: "outfit_1",
  slug: "jannik-sinner-inspired-green-hard-court-kit",
  title: "Jannik Sinner inspired green hard-court kit",
  description: "Representative player-inspired tennis outfit.",
  type: "PLAYER_INSPIRED",
  season: "2026",
  displayOrder: 1,
  coverImageUrl: "/demo-outfits/jannik-sinner-inspired-green-hard-court-kit/flatlay.svg",
  rankingVerifiedAt: "2026-06-11T00:00:00.000Z",
  player: {
    displayName: "Jannik Sinner",
    tour: "ATP",
    rank: 1,
  },
  items: [
    {
      id: "item_top",
      category: "TOP",
      displayName: "NikeCourt Dri-FIT Advantage Top",
      brand: "Nike",
      productName: "NikeCourt Dri-FIT Advantage Top",
      colorDescription: "deep green performance crew top",
      displayOrder: 1,
    },
    {
      id: "item_shoes",
      category: "SHOES",
      displayName: "Nike GP Challenge 1",
      brand: "Nike",
      productName: "Nike GP Challenge 1",
      colorDescription: "white hard-court shoes with dark accents",
      displayOrder: 3,
    },
  ],
  sources: [
    {
      label: "ATP official singles ranking retrieved 2026-06-11",
      url: "https://www.atptour.com/en/rankings/singles",
      verificationStatus: "VERIFIED",
      verifiedAt: "2026-06-11T00:00:00.000Z",
    },
  ],
};

describe("OutfitDetail", () => {
  it("shows player context, flat-lay artwork, item list, and sources", () => {
    render(<OutfitDetail outfit={fixture} />);

    expect(screen.getByText("职业球员灵感 · ATP #1 · 2026")).toBeInTheDocument();
    expect(screen.getByText("Jannik Sinner")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Jannik Sinner inspired green hard-court kit 穿搭平铺图" })).toHaveAttribute(
      "src",
      "/demo-outfits/jannik-sinner-inspired-green-hard-court-kit/flatlay.svg",
    );

    const itemList = screen.getByRole("list", { name: "完整穿搭清单" });
    expect(within(itemList).getByText("上装")).toBeInTheDocument();
    expect(within(itemList).getByText("NikeCourt Dri-FIT Advantage Top")).toBeInTheDocument();
    expect(within(itemList).getByText("鞋子")).toBeInTheDocument();
    expect(within(itemList).getByText(/white hard-court shoes with dark accents/)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "ATP official singles ranking retrieved 2026-06-11" })).toHaveAttribute(
      "href",
      "https://www.atptour.com/en/rankings/singles",
    );
  });
});
