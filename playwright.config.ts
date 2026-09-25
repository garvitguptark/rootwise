import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. They start the mock LLM and the app with an
 * OpenAI-compatible provider pointed at it, so the whole AI pipeline is
 * exercised deterministically without an API key.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: [
    { command: "node scripts/mock-llm.mjs", port: 4010, reuseExistingServer: !process.env.CI },
    {
      command: process.env.CI ? `npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { OPENAI_API_KEY: "mock", OPENAI_BASE_URL: "http://localhost:4010/v1", OPENAI_MODEL: "mock", AI_PROVIDER: "openai" },
    },
  ],
});
