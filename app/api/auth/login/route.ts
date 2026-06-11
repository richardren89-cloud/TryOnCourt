import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  canAttemptLogin,
  clearLoginAttempts,
  loginAttemptKey,
  recordFailedLogin,
} from "@/lib/auth/login-attempts";
import { authenticateUser } from "@/lib/auth/login";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const key = loginAttemptKey(
    String(body.username ?? ""),
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  );

  if (!canAttemptLogin(key)) {
    return NextResponse.json(
      { error: "Too many failed login attempts. Try again later." },
      { status: 429 },
    );
  }

  const user = await authenticateUser(getDb(), body);
  if (!user) {
    recordFailedLogin(key);
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  clearLoginAttempts(key);
  const session = await createSession(getDb(), user.id);
  (await cookies()).set(
    SESSION_COOKIE,
    session.token,
    sessionCookieOptions(session.expiresAt),
  );

  return NextResponse.json({ user });
}
