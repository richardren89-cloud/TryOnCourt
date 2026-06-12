import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CosObjectStore } from "@/lib/storage/cos";

const originalEnv = { ...process.env };

describe("CosObjectStore", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      COS_SECRET_ID: "test-secret-id",
      COS_SECRET_KEY: "test-secret-key",
      COS_BUCKET: "tryoncourt-prod-assets-1347869845",
      COS_REGION: "ap-shanghai",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("creates a browser PUT upload URL signed for Tencent COS", async () => {
    const upload = await new CosObjectStore().createUpload({
      key: "users/u1/uploads/photo.jpg",
      contentType: "image/jpeg",
      maxBytes: 1024,
    });

    expect(upload.key).toBe("users/u1/uploads/photo.jpg");
    expect(upload.method).toBe("PUT");
    expect(upload.url).toContain(
      "https://tryoncourt-prod-assets-1347869845.cos.ap-shanghai.myqcloud.com/users/u1/uploads/photo.jpg",
    );
    expect(upload.url).toContain("sign=");
    expect(upload.headers).toEqual({ "content-type": "image/jpeg" });
    expect(upload.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("reads, writes, and deletes objects with signed COS requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const store = new CosObjectStore();
    await store.write({
      key: "users/u1/generated/result.png",
      body: new Uint8Array([9, 8, 7]),
      contentType: "image/png",
    });
    const bytes = await store.read("users/u1/generated/result.png");
    await store.delete("users/u1/generated/result.png");

    expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/users/u1/generated/result.png"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("q-sign-algorithm=sha1"),
          "content-type": "image/png",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/users/u1/generated/result.png"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("q-sign-algorithm=sha1"),
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/users/u1/generated/result.png"),
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("q-sign-algorithm=sha1"),
        }),
      }),
    );
  });
});
