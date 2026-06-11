import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
const dbMock = vi.hoisted(() => ({
  generatedAsset: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));
const storageMock = vi.hoisted(() => ({
  createDownload: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => authMock);
vi.mock("@/lib/db", () => ({ getDb: () => dbMock }));
vi.mock("@/lib/storage", () => ({ getObjectStore: () => storageMock }));

import { DELETE, GET } from "@/app/api/assets/[id]/route";

describe("asset deletion API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getCurrentUser.mockResolvedValue({ id: "user_1", username: "player" });
    storageMock.createDownload.mockResolvedValue("https://signed.example.test/result.png");
    storageMock.delete.mockResolvedValue(undefined);
    dbMock.generatedAsset.update.mockResolvedValue({});
  });

  it("redirects only owned assets to a short-lived signed URL", async () => {
    dbMock.generatedAsset.findFirst.mockResolvedValue({
      id: "asset_1",
      storageKey: "generated/user_1/job_1/result.png",
    });

    const response = await GET(new Request("http://app.test/api/assets/asset_1"), {
      params: Promise.resolve({ id: "asset_1" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://signed.example.test/result.png");
    expect(dbMock.generatedAsset.findFirst).toHaveBeenCalledWith({
      where: { id: "asset_1", deletedAt: null, job: { userId: "user_1" } },
      select: { id: true, storageKey: true },
    });
  });

  it("does not delete another user's asset", async () => {
    dbMock.generatedAsset.findFirst.mockResolvedValue(null);

    const response = await DELETE(new Request("http://app.test/api/assets/asset_2"), {
      params: Promise.resolve({ id: "asset_2" }),
    });

    expect(response.status).toBe(404);
    expect(storageMock.delete).not.toHaveBeenCalled();
    expect(dbMock.generatedAsset.update).not.toHaveBeenCalled();
  });

  it("deletes owned object storage and marks metadata deleted", async () => {
    dbMock.generatedAsset.findFirst.mockResolvedValue({
      id: "asset_1",
      storageKey: "generated/user_1/job_1/result.png",
    });

    const response = await DELETE(new Request("http://app.test/api/assets/asset_1"), {
      params: Promise.resolve({ id: "asset_1" }),
    });

    expect(response.status).toBe(200);
    expect(storageMock.delete).toHaveBeenCalledWith("generated/user_1/job_1/result.png");
    expect(dbMock.generatedAsset.update).toHaveBeenCalledWith({
      where: { id: "asset_1" },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
