import { describe, expect, it } from "vitest";

import { validateUploadRequest } from "@/lib/uploads/validation";

describe("validateUploadRequest", () => {
  it("accepts supported photo uploads", () => {
    expect(
      validateUploadRequest({
        kind: "FULL_BODY",
        fileName: "full-body.jpg",
        contentType: "image/jpeg",
        byteSize: 2_000_000,
      }),
    ).toEqual({
      kind: "FULL_BODY",
      contentType: "image/jpeg",
      byteSize: 2_000_000,
      extension: "jpg",
    });
  });

  it("rejects unsupported content types and oversized files", () => {
    expect(() =>
      validateUploadRequest({
        kind: "HEADSHOT",
        fileName: "headshot.gif",
        contentType: "image/gif",
        byteSize: 1000,
      }),
    ).toThrow("Unsupported image type");

    expect(() =>
      validateUploadRequest({
        kind: "HEADSHOT",
        fileName: "headshot.png",
        contentType: "image/png",
        byteSize: 12_000_000,
      }),
    ).toThrow("Image is too large");
  });
});
