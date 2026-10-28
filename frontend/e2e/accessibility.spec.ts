import AxeBuilder from "@axe-core/playwright";
import { test, expect, login } from "./fixtures";
for (const path of [
  "/",
  "/properties",
  "/properties/house-one",
  "/developers",
  "/search",
  "/saved",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/forbidden",
])
  test(`accessible public page ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(r.violations).toEqual([]);
  });
for (const path of [
  "/dashboard",
  "/listings",
  "/appointments",
  "/analytics",
  "/notifications",
  "/profile",
])
  test(`accessible seller page ${path}`, async ({ page }) => {
    await login(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(r.violations).toEqual([]);
  });
