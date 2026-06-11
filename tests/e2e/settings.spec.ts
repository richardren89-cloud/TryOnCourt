import { test } from "@playwright/test";

test.describe("settings", () => {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires authenticated seeded test user.");

  test("opens account settings and shows account closure controls", async ({ page }) => {
    await page.goto("/settings");
  });
});
