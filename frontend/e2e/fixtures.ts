import { test as base, expect, type Page } from "@playwright/test";
export const test = base.extend({
  page: async ({ page, context }, runWithPage) => {
    await context.addCookies([
      { name: "lumavok-language", value: "en", domain: "localhost", path: "/" },
    ]);
    await runWithPage(page);
  },
});
export { expect };
export type { Page } from "@playwright/test";
export async function login(page: Page, email = "seller@example.test") {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("FixturePassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
