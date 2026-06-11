import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

export const SESSION_COOKIE = "courtfit_session";
export const SESSION_TTL_DAYS = 30;

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  expires: Date;
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function digestSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function sessionCookieOptions(expires: Date): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

export async function createSession(
  db: Pick<PrismaClient, "session">,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken();
  const expiresAt = sessionExpiresAt();

  await db.session.create({
    data: {
      userId,
      tokenHash: digestSessionToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function revokeSession(
  db: Pick<PrismaClient, "session">,
  token: string | undefined,
): Promise<void> {
  if (!token) {
    return;
  }

  await db.session.updateMany({
    where: { tokenHash: digestSessionToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
