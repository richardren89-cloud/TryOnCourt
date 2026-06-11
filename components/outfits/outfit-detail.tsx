import Link from "next/link";

import type { OutfitSummary } from "@/lib/catalog/types";

export function OutfitDetail({ outfit }: { outfit: OutfitSummary }) {
  return (
    <article className="detail-card">
      <p className="eyebrow">
        {outfit.player?.tour ?? "OWN BRAND"} · {outfit.season}
      </p>
      <h1>{outfit.title}</h1>
      <p>{outfit.description ?? "这套穿搭仍在资料核验中。"}</p>
      <section>
        <h2>单品</h2>
        <ul className="detail-list">
          {outfit.items.map((item) => (
            <li key={item.id}>
              <strong>{item.category}</strong>
              <span>{item.displayName}</span>
              <small>{[item.brand, item.productName].filter(Boolean).join(" · ")}</small>
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
