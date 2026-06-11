import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

interface CheckResult {
  ok: boolean;
  error?: string;
}

export async function GET() {
  const [database, rabbitmq] = await Promise.all([checkDatabase(), checkRabbitMq()]);
  const ready = database.ok && rabbitmq.ok;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: { database, rabbitmq },
      checkedAt: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}

async function checkDatabase(): Promise<CheckResult> {
  try {
    await getDb().$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safeError(error) };
  }
}

async function checkRabbitMq(): Promise<CheckResult> {
  if (!process.env.RABBITMQ_URL) {
    return { ok: false, error: "RABBITMQ_URL is not configured." };
  }

  try {
    const { connect } = await import("amqplib");
    const connection = await connect(process.env.RABBITMQ_URL);
    await connection.close();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safeError(error) };
  }
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown health check failure.";
}
