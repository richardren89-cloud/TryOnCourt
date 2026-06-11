import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
const passwordMock = vi.hoisted(() => ({ verifyPassword: vi.fn() }));
const txMock = vi.hoisted(() => ({
  session: { updateMany: vi.fn() },
  uploadedPhoto: { updateMany: vi.fn() },
  generatedAsset: { updateMany: vi.fn() },
  user: { update: vi.fn() },
}));
const dbMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  uploadedPhoto: { findMany: vi.fn() },
  generatedAsset: { findMany: vi.fn() },
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
}));
const storageMock = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock("@/lib/auth/require-user", () => authMock);
vi.mock("@/lib/auth/password", () => passwordMock);
vi.mock("@/lib/db", () => ({ getDb: () => dbMock }));
vi.mock("@/lib/storage", () => ({ getObjectStore: () => storageMock }));

import { DELETE } from "@/app/api/account/route";

describe("account closure API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getCurrentUser.mockResolvedValue({ id: "user_1", username: "player" });
    passwordMock.verifyPassword.mockResolvedValue(true);
    storageMock.delete.mockResolvedValue(undefined);
    dbMock.user.findUnique.mockResolvedValue({ id: "user_1", passwordHash: "hash" });
    dbMock.uploadedPhoto.findMany.mockResolvedValue([
      { id: "photo_1", storageKey: "uploads/full.jpg" },
    ]);
    dbMock.generatedAsset.findMany.mockResolvedValue([
      { id: "asset_1", storageKey: "generated/result.png" },
    ]);
    txMock.session.updateMany.mockResolvedValue({ count: 1 });
    txMock.uploadedPhoto.updateMany.mockResolvedValue({ count: 1 });
    txMock.generatedAsset.updateMany.mockResolvedValue({ count: 1 });
    txMock.user.update.mockResolvedValue({});
  });

  it("requires the DELETE confirmation phrase", async () => {
    const response = await DELETE(
      new Request("http://app.test/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "delete", password: "password" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(storageMock.delete).not.toHaveBeenCalled();
  });

  it("revokes sessions, deletes images, and anonymizes the user", async () => {
    const response = await DELETE(
      new Request("http://app.test/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE", password: "password" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(storageMock.delete).toHaveBeenCalledWith("uploads/full.jpg");
    expect(storageMock.delete).toHaveBeenCalledWith("generated/result.png");
    expect(txMock.session.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(txMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        username: "deleted-user_1",
        deletedAt: expect.any(Date),
      },
    });
  });
});
