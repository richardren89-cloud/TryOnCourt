import { describe, expect, it, vi } from "vitest";

describe("database client lifecycle", () => {
  it("imports without DATABASE_URL and lazily reuses a closeable shared client", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.resetModules();

    const databaseModule = await import("@/lib/db");

    expect(databaseModule.DATABASE_CONNECTION_LIMIT).toBe(5);
    expect(databaseModule.createDb).toBeTypeOf("function");
    expect(databaseModule.getDb).toBeTypeOf("function");
    expect(databaseModule.closeDb).toBeTypeOf("function");

    vi.stubEnv(
      "DATABASE_URL",
      "mysql://courtfit:courtfit@localhost:3306/courtfit_test",
    );
    const firstClient = databaseModule.getDb();
    expect(databaseModule.getDb()).toBe(firstClient);

    await databaseModule.closeDb();
    const replacementClient = databaseModule.getDb();
    expect(replacementClient).not.toBe(firstClient);
    await databaseModule.closeDb();
    vi.unstubAllEnvs();
  });
});
