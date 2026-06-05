import { test, expect } from "@playwright/test";

test("rbac smoke", async ({ page }) => {
  test.skip(!process.env.E2E_RUN_REAL, "Enable with E2E_RUN_REAL=1 once seed/login is configured.");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

