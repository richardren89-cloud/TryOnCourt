import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    role: process.env.PROCESS_ROLE ?? "web",
    checkedAt: new Date().toISOString(),
  });
}
