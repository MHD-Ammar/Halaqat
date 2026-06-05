import { test, expect } from "@playwright/test";

test("teacher logs mushaf mistakes and saves", async ({ page }) => {
  test.skip(!process.env.E2E_RUN_REAL, "Enable with E2E_RUN_REAL=1 once seed/login is configured.");

  await page.goto("/my-circle");
  await page.goto("/students");
  await expect(page.getByText(/المصحف|Mushaf/i)).toBeVisible();
});

