import Link from "next/link";

import type { OutfitSummary } from "@/lib/catalog/types";
import { itemPreview, outfitContextLabel } from "@/components/outfits/outfit-labels";

export function OutfitCard({ outfit }: { outfit: OutfitSummary }) {
  const itemSummary = itemPreview(outfit.items);
  const description = outfit.description ?? (itemSummary || "完整网球穿搭组合");
  const playerMeta = outfit.player
    ? `${outfit.player.displayName} · ${outfit.season}`
    : `CourtFit AI · ${outfit.season}`;

  return (
    <article className="outfit-card">
      <div className="outfit-card__image">
        {outfit.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={outfit.coverImageUrl} alt={`${outfit.title} 穿搭平铺图`} />
        ) : (
          <span>单品组合</span>
        )}
      </div>
      <div className="outfit-card__body">
        <p className="eyebrow">{outfitContextLabel(outfit)}</p>
        <h3>{outfit.title}</h3>
        <p>{description}</p>
        <p className="outfit-card__meta">{playerMeta}</p>
        {itemSummary ? <p className="outfit-card__items">{itemSummary}</p> : null}
        <Link className="button button--ghost" href={`/outfits/${outfit.slug}`}>
          查看穿搭
        </Link>
      </div>
    </article>
  );
}
