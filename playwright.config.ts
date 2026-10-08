import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4173/marvel-watchverse/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/marvel-watchverse/",
    reuseExistingServer: !process.env.CI,
  },
});
