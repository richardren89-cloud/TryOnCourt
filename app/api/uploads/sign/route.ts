import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/require-user";
import { getObjectStore } from "@/lib/storage";
import { validateUploadRequest } from "@/lib/uploads/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const upload = validateUploadRequest(await request.json());
    const key = `users/${user.id}/uploads/${randomUUID()}.${upload.extension}`;
    const signedUpload = await getObjectStore().createUpload({
      key,
      contentType: upload.contentType,
      maxBytes: upload.byteSize,
    });

    return NextResponse.json({ upload: signedUpload, kind: upload.kind });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload rejected." },
      { status: 400 },
    );
  }
}
