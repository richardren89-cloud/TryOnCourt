import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { registerUser } from "@/lib/auth/registration";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await registerUser(getDb(), await request.json());
    const session = await createSession(getDb(), user.id);
    (await cookies()).set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session.expiresAt),
    );

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed." },
      { status: 400 },
    );
  }
}
