import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/require-user";
import { createGenerationJob } from "@/lib/generations/service";
import { getDb } from "@/lib/db";

const createGenerationSchema = z.object({
  outfitId: z.string().min(1),
  fullBodyPhotoId: z.string().min(1),
  headshotPhotoId: z.string().min(1),
  saveSource: z.boolean().default(false),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key is required." }, { status: 400 });
  }

  try {
    const input = createGenerationSchema.parse(await request.json());
    const job = await createGenerationJob(getDb(), {
      userId: user.id,
      clientKey: idempotencyKey,
      ...input,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed." },
      { status: 400 },
    );
  }
}
