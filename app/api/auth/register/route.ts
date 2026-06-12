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
      { error: registrationErrorMessage(error) },
      { status: 400 },
    );
  }
}

function registrationErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint failed")) {
      return "用户名已存在，请换一个用户名。";
    }
    if (error.message.includes("Guardian consent is required")) {
      return "未满 18 岁用户需要确认已获得监护人同意。";
    }
    if (error.message.includes("Password must be at least 10 characters")) {
      return "密码至少需要 10 位字符。";
    }
  }

  return "注册失败，请检查用户名、密码和年龄确认。";
}
