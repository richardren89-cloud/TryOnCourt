import { notFound, redirect } from "next/navigation";

import { GenerationForm } from "@/components/try-on/generation-form";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getCreditBalance } from "@/lib/credits/service";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TryOnPage({
  params,
}: {
  params: Promise<{ outfitId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { outfitId } = await params;
  const db = getDb();
  const [outfit, balance] = await Promise.all([
    db.outfit.findFirst({
      where: { id: outfitId, published: true },
      select: {
        id: true,
        title: true,
        items: {
          orderBy: { displayOrder: "asc" },
          select: { id: true, category: true, displayName: true },
        },
      },
    }),
    getCreditBalance(db, user.id),
  ]);

  if (!outfit) {
    notFound();
  }

  return (
    <main className="page-shell">
      <GenerationForm outfit={outfit} balance={balance} />
    </main>
  );
}
