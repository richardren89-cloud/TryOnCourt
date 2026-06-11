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

  const { id } = await params;
  const job = await getDb().generationJob.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      status: true,
      failureCode: true,
      generatedAssets: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { storageKey: true, mimeType: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Generation not found." }, { status: 404 });
  }

  const asset = job.generatedAssets[0]
    ? {
        url: await getObjectStore().createDownload(job.generatedAssets[0].storageKey, 10 * 60),
        mimeType: job.generatedAssets[0].mimeType,
      }
    : null;

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      failureCode: job.failureCode,
      asset,
    },
  });
}
