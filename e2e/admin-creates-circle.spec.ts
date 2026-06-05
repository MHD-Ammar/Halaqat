import { test, expect } from "@playwright/test";

test("admin creates a circle", async ({ page }) => {
  test.skip(!process.env.E2E_RUN_REAL, "Enable with E2E_RUN_REAL=1 once seed/login is configured.");

  await page.goto("/login");
  await page.getByLabel("البريد الإلكتروني").fill("admin@halaqat.test");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();

  await page.goto("/circles");
  await page.getByRole("button", { name: /حلقة جديدة/i }).click();
  await page.getByLabel("اسم الحلقة").fill("حلقة الاختبار");
  await page.getByRole("button", { name: /حفظ|إضافة/i }).click();

  await expect(page.getByText("حلقة الاختبار")).toBeVisible();
});

