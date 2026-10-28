import { test, expect, login } from "./fixtures";
test("account favorites persist and can be removed after reload", async ({
  page,
}) => {
  await login(page, "buyer@example.test");
  await page.goto("/properties/house-one");
  await page
    .getByRole("button", { name: "Save House in Ouagadougou", exact: true })
    .click();
  await page.goto("/saved");
  await expect(page.getByText("House in Ouagadougou")).toBeVisible();
  await expect(
    page.getByText(
      "Saved properties are synced to your account across devices.",
    ),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("House in Ouagadougou")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove House in Ouagadougou from saved properties",
      exact: true,
    })
    .click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});
test("a viewing request reaches buyer history, seller appointments and notifications", async ({
  page,
  browser,
}) => {
  await login(page, "buyer@example.test");
  await page.goto("/properties/house-one");
  await page
    .getByLabel("Preferred viewing time")
    .fill(new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 16));
  await page
    .getByRole("button", { name: "Request a viewing", exact: true })
    .click();
  await expect(page.getByText(/Viewing requested. The seller/)).toBeVisible();
  await page.goto("/my-viewings");
  await expect(page.getByText("House in Ouagadougou")).toBeVisible();
  const context = await browser.newContext();
  await context.addCookies([
    { name: "lumavok-language", value: "en", domain: "localhost", path: "/" },
  ]);
  const seller = await context.newPage();
  await login(seller);
  await seller.goto("/appointments");
  await expect(seller.getByText("Test Buyer").first()).toBeVisible();
  await seller.goto("/notifications");
  await expect(seller.getByText("Viewing requested.").first()).toBeVisible();
  await context.close();
});
test("seller onboarding requires admin approval and the role survives session refresh", async ({
  page,
  browser,
}) => {
  await login(page, "applicant@example.test");
  await page.goto("/sell");
  await page.getByLabel("Business name").fill("New Faso Agency");
  await page.getByLabel("City", { exact: true }).selectOption("c1");
  await page
    .getByLabel("Phone number (international format)", { exact: true })
    .fill("+22670123456");
  await page
    .getByLabel("WhatsApp number (international format)", { exact: true })
    .fill("+22670123456");
  await page.getByRole("button", { name: "Apply to become a seller" }).click();
  await expect(
    page.getByText(
      "Your seller application is awaiting administrator approval.",
    ),
  ).toBeVisible();
  const context = await browser.newContext();
  await context.addCookies([
    { name: "lumavok-language", value: "en", domain: "localhost", path: "/" },
  ]);
  const admin = await context.newPage();
  await login(admin, "admin@example.test");
  await expect(admin).toHaveURL(/\/admin$/);
  await admin
    .getByRole("listitem")
    .filter({ hasText: "New Faso Agency" })
    .getByRole("button", { name: "Activate seller" })
    .click();
  await expect(admin.getByText("New Faso Agency")).not.toBeVisible();
  await page.reload();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});
test("profile translations and explicitly public contact email persist", async ({
  page,
}) => {
  await login(page);
  await page.goto("/profile");
  await page.getByLabel("Content language").selectOption("en");
  await expect(page.getByLabel("Biography")).toHaveValue(/A local agency/);
  await expect(page.getByLabel("City", { exact: true })).toHaveValue("c1");
  await page
    .getByLabel("Biography")
    .fill("An English profile managed by the seller.");
  await page
    .getByLabel("Public contact email (optional)")
    .fill("public-contact@example.test");
  const save = page.waitForResponse(
    (r) => r.url().includes("/sellers/me") && r.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  expect((await save).status()).toBe(200);
  await page.goto("/developers/dev-one");
  await expect(
    page.getByText("An English profile managed by the seller."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "public-contact@example.test" }),
  ).toBeVisible();
});
test("a rental listing preserves its draft terms, uploads a photo and publishes", async ({
  page,
}) => {
  await login(page);
  await page.goto("/listings/new");
  await page.getByLabel("Title", { exact: true }).fill("Browser test draft");
  await page.getByLabel("Category", { exact: true }).selectOption("house");
  await page.getByLabel("Listing type", { exact: true }).selectOption("RENT");
  await page.getByLabel("City", { exact: true }).selectOption("c1");
  await page.getByLabel("Price", { exact: true }).fill("175000");
  await page.getByLabel("Currency", { exact: true }).selectOption("XOF");
  await page.getByLabel("Rental period", { exact: true }).selectOption("MONTH");
  await expect(page).toHaveURL(/\/listings\/[^/]+\/edit$/);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Browser test draft",
  );
  await expect(page.getByLabel("Price", { exact: true })).toHaveValue("175000");
  await expect(page.getByLabel("Currency", { exact: true })).toHaveValue("XOF");
  await expect(page.getByLabel("Rental period", { exact: true })).toHaveValue(
    "MONTH",
  );
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "A family rental home in Ouagadougou with clear monthly rental terms.",
    );
  await page
    .getByLabel("Address", { exact: true })
    .fill("Zone du Bois, Ouagadougou");
  const image = await page.screenshot({ type: "png" });
  await page.getByLabel("Add photos").setInputFiles({
    name: "fixture-photo.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
  const publish = page.waitForResponse(
    (r) => r.url().includes("/status") && r.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const published = await publish;
  expect(published.status()).toBe(200);
  const data = await published.json();
  await page.goto("/properties/" + encodeURIComponent(data.data.slug));
  await expect(
    page.getByRole("heading", { name: "Browser test draft", level: 1 }),
  ).toBeVisible();
  const photo = page.locator("main img").first();
  await expect(photo).toBeVisible();
  await expect
    .poll(() =>
      photo.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
});
