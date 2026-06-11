import Link from "next/link";

import type { OutfitSummary } from "@/lib/catalog/types";

export function OutfitCard({ outfit }: { outfit: OutfitSummary }) {
  const tourLabel = outfit.player?.tour ? `${outfit.player.tour} TOP 5` : "OWN BRAND";
  const itemSummary = outfit.items
    .slice(0, 3)
    .map((item) => item.displayName)
    .join(" / ");
  const description = outfit.description ?? (itemSummary || "完整网球穿搭组合");

  return (
    <article className="outfit-card">
      <div className="outfit-card__image" aria-hidden="true">
        {outfit.coverImageUrl ? "LOOK" : "单品组合"}
      </div>
      <div className="outfit-card__body">
        <p className="eyebrow">{tourLabel}</p>
        <h3>{outfit.title}</h3>
        <p>{description}</p>
        {outfit.player ? (
          <p className="outfit-card__meta">
            {outfit.player.displayName}
            {outfit.player.rank ? ` · 世界排名 ${outfit.player.rank}` : ""}
          </p>
        ) : null}
        <Link className="button button--ghost" href={`/outfits/${outfit.slug}`}>
          查看穿搭
        </Link>
      </div>
    </article>
  );
}
