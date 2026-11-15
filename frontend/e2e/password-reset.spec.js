const { test, expect } = require("@playwright/test");
const { ACCOUNTS, login } = require("./helpers");

test("forgot password -> reset link -> sign in with the new password", async ({ page }) => {
  const { email, password: oldPassword } = ACCOUNTS.reset;
  const newPassword = `new-pass-${Date.now()}`;

  await page.goto("/login");
  await page.getByTestId("login-forgot").click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await page.getByTestId("forgot-email").fill(email);
  await page.getByTestId("forgot-submit").click();
  await expect(page.getByTestId("forgot-sent")).toBeVisible();

  // The E2E backend runs with PASSWORD_RESET_DEBUG_LINK=true, so the link is shown instead of emailed.
  await page.getByTestId("forgot-debug-link").click();
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await page.getByTestId("reset-password").fill(newPassword);
  await page.getByTestId("reset-confirm").fill(newPassword);
  await page.getByTestId("reset-submit").click();

  // The new password works; the old one no longer does.
  await login(page, { email, password: oldPassword });
  await expect(page.getByTestId("login-error")).toBeVisible();
  await login(page, { email, password: newPassword });
  await expect(page).toHaveURL(/\/dashboard/);
});
