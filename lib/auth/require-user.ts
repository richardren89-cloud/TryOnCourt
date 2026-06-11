import { cookies } from "next/headers";

import { digestSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await getDb().session.findFirst({
    where: {
      tokenHash: digestSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { deletedAt: null },
    },
    select: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  return session?.user ?? null;
}
