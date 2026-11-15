const { test, expect } = require("@playwright/test");
const { ACCOUNTS, loginAndWait } = require("./helpers");

test("educator marks attendance for a class and it shows in the history", async ({ page }) => {
  await loginAndWait(page, ACCOUNTS.educator);
  await page.goto("/attendance");

  // Pick the first class that has enrolled students.
  const classSelect = page.getByTestId("att-class");
  await expect(classSelect.locator("option")).not.toHaveCount(1);
  const options = await classSelect.locator("option").evaluateAll((els) => els.map((el) => el.value).filter(Boolean));
  let chosen = false;
  for (const value of options) {
    await classSelect.selectOption(value);
    await page.getByTestId("att-grid").waitFor();
    // Students load asynchronously; give the list a moment before judging the class empty.
    await page.waitForTimeout(500);
    if ((await page.locator('[data-testid^="att-row-"]').count()) > 0) {
      chosen = true;
      break;
    }
  }
  expect(chosen, "seed data should contain a class with enrolled students").toBe(true);

  // Mark the first student absent and save.
  const firstRow = page.locator('[data-testid^="att-row-"]').first();
  const studentId = (await firstRow.getAttribute("data-testid")).replace("att-row-", "");
  await page.getByTestId(`att-${studentId}-absent`).click();
  await page.getByTestId("att-submit").click();

  // The history card lists the saved record: its counter goes above zero.
  await expect(page.getByTestId("att-history")).toContainText(/\([1-9]\d*\/[1-9]\d*\)/);
});
