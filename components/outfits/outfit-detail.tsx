import Link from "next/link";

import { itemCategoryLabel, outfitContextLabel } from "@/components/outfits/outfit-labels";
import type { OutfitSummary } from "@/lib/catalog/types";

export function OutfitDetail({ outfit }: { outfit: OutfitSummary }) {
  return (
    <article className="detail-card">
      <p className="eyebrow">
        {outfitContextLabel(outfit)} · {outfit.season}
      </p>
      <h1>{outfit.title}</h1>
      {outfit.player ? <p className="detail-card__player">{outfit.player.displayName}</p> : null}
      <p>{outfit.description ?? "这套穿搭仍在资料核验中。"}</p>
      {outfit.coverImageUrl ? (
        <figure className="detail-card__figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={outfit.coverImageUrl} alt={`${outfit.title} 穿搭平铺图`} />
          <figcaption>原创平铺示意图，后续可替换为自有组合图或授权素材。</figcaption>
        </figure>
      ) : null}
      <section>
        <h2>完整穿搭清单</h2>
        <ul className="detail-list" aria-label="完整穿搭清单">
          {outfit.items.map((item) => (
            <li key={item.id}>
              <strong>{itemCategoryLabel(item.category)}</strong>
              <span>{item.displayName}</span>
              <small>{[item.brand, item.productName, item.colorDescription].filter(Boolean).join(" · ")}</small>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>来源</h2>
        <ul className="source-list">
          {outfit.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} rel="noreferrer" target="_blank">
                {source.label}
              </a>
              <span>{source.verificationStatus}</span>
            </li>
          ))}
        </ul>
      </section>
      <Link className="button" href={`/try-on/${outfit.id}`}>
        用这套穿搭试衣
      </Link>
    </article>
  );
}
