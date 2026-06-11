import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/require-user";
import { verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { getObjectStore } from "@/lib/storage";

const closeAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  password: z.string().min(1),
});

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = closeAccountSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Type DELETE and enter your password." }, { status: 400 });
  }

  const db = getDb();
  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });
  if (!account || !(await verifyPassword(account.passwordHash, parsed.data.password))) {
    return NextResponse.json({ error: "Password verification failed." }, { status: 403 });
  }

  const [photos, assets] = await Promise.all([
    db.uploadedPhoto.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, storageKey: true },
    }),
    db.generatedAsset.findMany({
      where: { deletedAt: null, job: { userId: user.id } },
      select: { id: true, storageKey: true },
    }),
  ]);

  const storage = getObjectStore();
  await Promise.all([...photos, ...assets].map((object) => storage.delete(object.storageKey)));
  const deletedAt = new Date();

  await db.$transaction(async (tx) => {
    await tx.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: deletedAt },
    });
    await tx.uploadedPhoto.updateMany({
      where: { userId: user.id, deletedAt: null },
      data: { deletedAt },
    });
    await tx.generatedAsset.updateMany({
      where: { deletedAt: null, job: { userId: user.id } },
      data: { deletedAt },
    });
    await tx.user.update({
      where: { id: user.id },
      data: {
        username: `deleted-${user.id}`,
        deletedAt,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
