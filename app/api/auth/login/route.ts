import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authenticateUser } from "@/lib/auth/login";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const user = await authenticateUser(getDb(), await request.json());
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const session = await createSession(getDb(), user.id);
  (await cookies()).set(
    SESSION_COOKIE,
    session.token,
    sessionCookieOptions(session.expiresAt),
  );

  return NextResponse.json({ user });
}
