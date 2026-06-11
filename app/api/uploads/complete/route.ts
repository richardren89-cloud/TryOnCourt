import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";
import { validateUploadRequest } from "@/lib/uploads/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const upload = validateUploadRequest(body);
  const photo = await getDb().uploadedPhoto.create({
    data: {
      userId: user.id,
      kind: upload.kind,
      storageKey: String(body.key),
      mimeType: upload.contentType,
      byteSize: upload.byteSize,
      checksumSha256: typeof body.checksumSha256 === "string" ? body.checksumSha256 : null,
    },
    select: { id: true, kind: true },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
