import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { revokeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function POST() {
  const cookieStore = await cookies();
  await revokeSession(getDb(), cookieStore.get(SESSION_COOKIE)?.value);
  cookieStore.delete(SESSION_COOKIE);

  return NextResponse.json({ ok: true });
}
