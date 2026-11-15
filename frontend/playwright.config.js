// E2E (F0-10). Needs a production build made with REACT_APP_BACKEND_URL=http://localhost:8001.
//
//   REACT_APP_BACKEND_URL=http://localhost:8001 yarn build
//   yarn e2e
//
// Starts its own backend on :8001 against a throw-away database (E2E_DB_NAME, default edu_e2e_test)
// and a static server for ./build on :3000 (:3000 is already in the backend's CORS allow-list).
// Env: MONGO_URL (default mongodb://localhost:27017), E2E_PYTHON (default "python"),
//      E2E_REUSE_SERVERS=1 to use servers you already started, E2E_CHROMIUM_PATH to use a browser you already have.
const { defineConfig, devices } = require("@playwright/test");

const BACKEND_PORT = 8001;
const FRONTEND_PORT = 3000;
const dbName = process.env.E2E_DB_NAME || "edu_e2e_test";
if (!dbName.toLowerCase().includes("test")) {
  throw new Error(`Refusing to run E2E against database "${dbName}": the name must contain "test".`);
}

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1, // tests share one database and one client IP (login lockout), so run them in order
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.E2E_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.E2E_CHROMIUM_PATH } } : {}),
      },
    },
  ],
  webServer: [
    {
      command: `${process.env.E2E_PYTHON || "python"} -m uvicorn server:app --host 127.0.0.1 --port ${BACKEND_PORT}`,
      cwd: "../backend",
      url: `http://127.0.0.1:${BACKEND_PORT}/api/health`,
      reuseExistingServer: !!process.env.E2E_REUSE_SERVERS,
      timeout: 120_000,
      env: {
        MONGO_URL: process.env.MONGO_URL || "mongodb://localhost:27017",
        DB_NAME: dbName,
        JWT_SECRET: "e2e-only-secret-not-for-production",
        LOGIN_LOCK_SECONDS: "900",
        MAIL_PROVIDER: "console",
        PASSWORD_RESET_DEBUG_LINK: "true", // reset link comes back in the API response (no inbox in E2E)
        FRONTEND_URL: `http://localhost:${FRONTEND_PORT}`,
      },
    },
    {
      command: "node e2e/serve.js",
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: !!process.env.E2E_REUSE_SERVERS,
      timeout: 30_000,
      env: { E2E_FRONTEND_PORT: String(FRONTEND_PORT) },
    },
  ],
});
