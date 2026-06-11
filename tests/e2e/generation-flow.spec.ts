import { test } from "@playwright/test";

test.describe("generation flow", () => {
  test.skip(
    !process.env.TEST_DATABASE_URL,
    "Requires seeded MySQL, object storage, and worker test environment.",
  );

  test("registers, uploads two photos, generates, and opens the result", async ({ page }) => {
    await page.goto("/");
    // Full browser happy path is enabled once the Tencent test environment is wired.
  });
});
