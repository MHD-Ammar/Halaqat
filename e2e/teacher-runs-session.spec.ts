import { test, expect } from "@playwright/test";

test("teacher runs today session", async ({ page }) => {
  test.skip(!process.env.E2E_RUN_REAL, "Enable with E2E_RUN_REAL=1 once seed/login is configured.");

  await page.goto("/login");
  await page.getByLabel("البريد الإلكتروني").fill("teacher@halaqat.test");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();

  await page.goto("/my-circle");
  await expect(page.getByText(/جلسة اليوم|اليوم/i)).toBeVisible();
});

