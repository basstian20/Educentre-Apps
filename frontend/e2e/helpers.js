const { expect } = require("@playwright/test");

// Demo accounts created by backend/seed.py. Each spec uses its own so tests do not affect each other
// (the lockout and password-reset specs change the account they touch).
const ACCOUNTS = {
  admin: { email: "admin@educentre.id", password: "admin123" },
  educator: { email: "fariz@educentre.id", password: "educator123" },
  lockout: { email: "noor@educentre.id", password: "educator123" },
  reset: { email: "aiman@educentre.id", password: "student123" },
};

async function login(page, { email, password }) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
}

async function loginAndWait(page, account) {
  await login(page, account);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("main-content")).toBeVisible();
}

module.exports = { ACCOUNTS, login, loginAndWait };
