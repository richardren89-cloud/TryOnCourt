import type { OutfitItemSummary, OutfitSummary } from "@/lib/catalog/types";

const itemCategoryLabels: Record<string, string> = {
  TOP: "上装",
  BOTTOM: "下装",
  SHOES: "鞋子",
  SOCKS: "袜子",
  WRISTBAND: "护腕",
  HEADWEAR: "帽子/头巾",
};

export function outfitTypeLabel(type: OutfitSummary["type"]): string {
  return type === "PLAYER_INSPIRED" ? "职业球员灵感" : "自有品牌";
}

export function outfitContextLabel(outfit: OutfitSummary): string {
  const legacyRank = legacyTourRank(outfit.title);
  const typeLabel = outfit.type === "PLAYER_INSPIRED" || legacyRank ? "职业球员灵感" : outfitTypeLabel(outfit.type);
  const tourRank = outfit.player
    ? `${outfit.player.tour}${outfit.player.rank ? ` #${outfit.player.rank}` : ""}`
    : legacyRank;

  return [typeLabel, tourRank].filter(Boolean).join(" · ");
}

export function itemCategoryLabel(category: OutfitItemSummary["category"]): string {
  return itemCategoryLabels[category] ?? category;
}

export function itemPreview(items: OutfitItemSummary[], limit = 3): string {
  return items
    .slice(0, limit)
    .map((item) => `${itemCategoryLabel(item.category)}: ${item.displayName}`)
    .join(" / ");
}

function legacyTourRank(title: string): string | null {
  const match = /^(ATP|WTA)\s+#(\d+)/i.exec(title.trim());
  if (!match) {
    return null;
  }

  return `${match[1].toUpperCase()} #${match[2]}`;
}
