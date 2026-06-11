import { notFound } from "next/navigation";

import { OutfitDetail } from "@/components/outfits/outfit-detail";
import { CatalogRepository } from "@/lib/catalog/repository";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) {
    notFound();
  }

  const outfits = await new CatalogRepository(getDb()).listPublished();
  const outfit = outfits.find((item) => item.slug === slug);

  if (!outfit) {
    notFound();
  }

  return (
    <main className="page-shell">
      <OutfitDetail outfit={outfit} />
    </main>
  );
}
