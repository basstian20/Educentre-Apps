const { test, expect } = require("@playwright/test");
const { ACCOUNTS, loginAndWait } = require("./helpers");

test("admin creates an invoice and records a full payment", async ({ page }) => {
  const description = `E2E tuition ${Date.now()}`;
  await loginAndWait(page, ACCOUNTS.admin);
  await page.goto("/invoices");

  await page.getByTestId("new-invoice-btn").click();
  await page.getByTestId("inv-student").selectOption({ index: 1 });
  await page.getByTestId("inv-desc").fill(description);
  await page.getByTestId("inv-amount").fill("250000");
  await page.getByTestId("submit-invoice").click();

  // The new invoice is listed (search narrows the table to it, whatever the page size).
  await page.getByTestId("invoice-search").fill(description);
  const row = page.locator("tr", { hasText: description });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(/250[.,]000/);

  // Record the full balance: the "pay" action disappears once the invoice is settled.
  await row.locator('[data-testid^="pay-"]').click();
  await expect(page.getByTestId("pay-amount")).toHaveValue("250000");
  await page.getByTestId("submit-payment").click();
  await expect(row.locator('[data-testid^="pay-"]')).toHaveCount(0);
});
