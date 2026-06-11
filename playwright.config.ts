import { defineConfig, devices } from "@playwright/test";

const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "npm run dev";
const shouldStartWebServer =
  Boolean(process.env.TEST_DATABASE_URL) || Boolean(process.env.PLAYWRIGHT_WEB_SERVER_COMMAND);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: shouldStartWebServer
    ? {
        command: webServerCommand,
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});
