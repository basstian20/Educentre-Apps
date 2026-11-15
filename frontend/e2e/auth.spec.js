const { test, expect } = require("@playwright/test");
const { ACCOUNTS, login, loginAndWait } = require("./helpers");

test.describe("login", () => {
  test("admin signs in, sees the dashboard and signs out", async ({ page }) => {
    await loginAndWait(page, ACCOUNTS.admin);
    await expect(page.getByTestId("sidebar")).toBeVisible();
    await page.getByTestId("logout-btn").click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-page")).toBeVisible();
  });

  test("wrong password shows an error and stays on the login page", async ({ page }) => {
    await login(page, { email: ACCOUNTS.admin.email, password: "wrong-password" });
    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected pages redirect to login when signed out", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page).toHaveURL(/\/login/);
  });

  test("repeated failures lock the account, even with the right password", async ({ page }) => {
    const { email, password } = ACCOUNTS.lockout;
    for (let i = 0; i < 5; i += 1) {
      await login(page, { email, password: `wrong-${i}` });
      await expect(page.getByTestId("login-error")).toBeVisible();
    }
    // Locked now: the correct password is refused with the "too many attempts" message.
    await login(page, { email, password });
    await expect(page.getByTestId("login-error")).toContainText(/too many|terlalu banyak/i);
    await expect(page).toHaveURL(/\/login/);
  });
});
