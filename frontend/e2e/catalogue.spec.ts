import { test, expect } from "./fixtures";
test("catalogue uses canonical Burkina locations and opens property and developer pages", async ({
  page,
}) => {
  await page.goto("/properties");
  await expect(page.getByText("House in Ouagadougou")).toBeVisible();
  await page
    .getByLabel("Location", { exact: true })
    .selectOption("Ouagadougou");
  await expect(page).toHaveURL(/city=Ouagadougou/);
  await page
    .getByRole("link")
    .filter({ hasText: "House in Ouagadougou" })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "House in Ouagadougou",
  );
  await expect(
    page.getByText("Family house with a garden in Ouagadougou."),
  ).toBeVisible();
  await expect(page.getByText(/45,000,000/)).toBeVisible();
  await page.locator('a[href="/developers/dev-one"]').first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Agence Faso",
  );
  await expect(
    page.getByText(
      "A local agency serving buyers and tenants in Burkina Faso.",
    ),
  ).toBeVisible();
});
test("language switch updates the interface and database content and persists after reload", async ({
  page,
}) => {
  await page.goto("/properties/house-one");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("menuitem", { name: /FR/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Maison à Ouagadougou",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(
    page.getByText("Connectez-vous pour demander une visite"),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Maison à Ouagadougou",
  );
});
test("missing content is 404 and an API outage is a visible service error", async ({
  page,
}) => {
  await page.goto("/properties/missing-slug");
  await expect(page.getByText("Page not found")).toBeVisible();
  await page.route("**/api/v1/properties?*", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ success: false, code: "INTERNAL_ERROR" }),
    }),
  );
  await page.goto("/properties");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByText("The service is temporarily unavailable. Try again later."),
  ).toBeVisible();
});
test("empty searches do not invent results", async ({ page }) => {
  await page.goto("/search?q=no-matching-record");
  await expect(page.getByText("No properties found")).toBeVisible();
});
test("nonce CSP protects documents and the application hydrates", async ({
  page,
}) => {
  const response = await page.goto("/login");
  const csp = response?.headers()["content-security-policy"];
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).toContain("object-src 'none'");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
});
