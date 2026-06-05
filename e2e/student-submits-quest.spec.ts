import { test, expect } from "@playwright/test";

test("student submits quest flow", async ({ page }) => {
  test.skip(!process.env.E2E_RUN_REAL, "Enable with E2E_RUN_REAL=1 once seed/login is configured.");

  await page.goto("/login");
  await page.getByLabel("اسم المستخدم").fill("student1");
  await page.getByLabel("كلمة المرور").fill("password123");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();

  await page.goto("/student-portal");
  await expect(page.getByText(/الترتيب|المهام/i)).toBeVisible();
});

