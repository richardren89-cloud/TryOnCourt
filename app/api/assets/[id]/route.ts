import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { getObjectStore } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const asset = await findOwnedAsset((await params).id, user.id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const url = await getObjectStore().createDownload(asset.storageKey, 5 * 60);
  return NextResponse.redirect(url);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const asset = await findOwnedAsset((await params).id, user.id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  await getObjectStore().delete(asset.storageKey);
  await getDb().generatedAsset.update({
    where: { id: asset.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

async function findOwnedAsset(assetId: string, userId: string) {
  return getDb().generatedAsset.findFirst({
    where: {
      id: assetId,
      deletedAt: null,
      job: { userId },
    },
    select: {
      id: true,
      storageKey: true,
    },
  });
}
