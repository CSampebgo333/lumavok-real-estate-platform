import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";
const localBrowser = process.env.PLAYWRIGHT_BROWSER_CONFIG
  ? JSON.parse(fs.readFileSync(process.env.PLAYWRIGHT_BROWSER_CONFIG, "utf8"))
  : undefined;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45000,
  expect: { timeout: 12000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name:
        process.env.E2E_MOBILE === "1" ? "chromium-mobile" : "chromium-desktop",
      use: {
        ...devices[
          process.env.E2E_MOBILE === "1" ? "Pixel 7" : "Desktop Chrome"
        ],
        launchOptions: localBrowser,
      },
    },
  ],
  webServer: [
    {
      command: "node --import tsx tests/e2e-server.ts",
      cwd: "../backend",
      env: { LUMAVOK_E2E_FIXTURE: "1", NODE_ENV: "test" },
      url: "http://127.0.0.1:4100/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: "npm run build && npm run start -- --hostname 127.0.0.1",
      env: {
        BACKEND_API_URL: "http://127.0.0.1:4100",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      url: "http://localhost:3000/login",
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
