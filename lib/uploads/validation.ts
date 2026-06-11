import { z } from "zod";

import { assertSafeImageUpload } from "@/lib/security/content-safety";

const extensionsByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type UploadPhotoKind = "FULL_BODY" | "HEADSHOT";
export type SupportedImageType = keyof typeof extensionsByContentType;

export const uploadRequestSchema = z.object({
  kind: z.enum(["FULL_BODY", "HEADSHOT"]),
  fileName: z.string().min(1).optional(),
  contentType: z.string().min(1),
  byteSize: z.number().int().positive(),
});

export function validateUploadRequest(raw: unknown): {
  kind: UploadPhotoKind;
  contentType: SupportedImageType;
  byteSize: number;
  extension: "jpg" | "png" | "webp";
} {
  const input = uploadRequestSchema.parse(raw);
  if (!isSupportedImageType(input.contentType)) {
    throw new Error("Unsupported image type.");
  }
  assertSafeImageUpload({ contentType: input.contentType, byteSize: input.byteSize });

  return {
    kind: input.kind,
    contentType: input.contentType,
    byteSize: input.byteSize,
    extension: extensionsByContentType[input.contentType],
  };
}

function isSupportedImageType(value: string): value is SupportedImageType {
  return value in extensionsByContentType;
}
