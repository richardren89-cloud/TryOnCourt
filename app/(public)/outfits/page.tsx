import { OutfitCard } from "@/components/outfits/outfit-card";
import { CatalogRepository } from "@/lib/catalog/repository";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OutfitsPage() {
  const outfits = await getPublishedOutfits();

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">职业球员灵感</p>
        <h1>世界前列球员穿搭橱窗</h1>
        <p>首版上线前会发布 ATP 前 5 与 WTA 前 5 各一套已核验穿搭。</p>
      </section>
      {outfits.length ? (
        <section className="outfit-grid">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <h2>穿搭资料正在核验</h2>
          <p>当前没有公开穿搭。内容团队核验排名、品牌型号和授权素材后会开放。</p>
        </section>
      )}
    </main>
  );
}

async function getPublishedOutfits() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return new CatalogRepository(getDb()).listPublished();
}
