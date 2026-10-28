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
  "/this-route-does-not-exist",
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

test("analytics statistics support keyboard scrolling on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.goto("/analytics");
  const statistics = page.getByRole("region", { name: "Analytics statistics" });
  await expect(
    statistics.getByText("Total Listings", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => statistics.evaluate((el) => el.scrollWidth - el.clientWidth))
    .toBeGreaterThan(0);
  await statistics.focus();
  await expect(statistics).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => statistics.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  const forward = await statistics.evaluate((el) => el.scrollLeft);
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(() => statistics.evaluate((el) => el.scrollLeft))
    .toBeLessThan(forward);
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      statistics.evaluate(
        (el) => el.scrollWidth - el.clientWidth - el.scrollLeft,
      ),
    )
    .toBeLessThan(2);
  await page.keyboard.press("Home");
  await expect
    .poll(() => statistics.evaluate((el) => el.scrollLeft))
    .toBeLessThan(2);
});
