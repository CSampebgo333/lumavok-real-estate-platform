import { test, expect, login } from "./fixtures";
test("login rejects wrong credentials and restores a server session on reload", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("seller@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator('form [role="alert"]')).toBeVisible();
  await page
    .getByLabel("Password", { exact: true })
    .fill("FixturePassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
});
test("anonymous users redirect and buyers cannot enter seller or admin workspaces", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await login(page, "buyer@example.test");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/forbidden$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/forbidden$/);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
  await login(page, "admin@example.test");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/forbidden$/);
});
test("registration validates password confirmation and terms before email confirmation", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Test New User");
  await page
    .getByLabel("Email", { exact: true })
    .fill("registration@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("FixturePassword123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("Mismatch");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText("Passwords don't match.")).toBeVisible();
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("FixturePassword123!");
  await page.getByLabel(/I agree/).check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByText("Check your email to confirm your account."),
  ).toBeVisible();
});
test("French authentication labels and validation are translated", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "lumavok-language", value: "fr", domain: "localhost", path: "/" },
  ]);
  await page.goto("/login");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByText("Saisissez une adresse e-mail valide."),
  ).toBeVisible();
  await expect(
    page.getByText("Le mot de passe est obligatoire."),
  ).toBeVisible();
});
test("recovery is non-enumerating and scrubs the token from the browser URL", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("unknown@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  await page.goto("/reset-password#token=invalid-fixture-token");
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  await page
    .getByLabel("New password", { exact: true })
    .fill("FixturePassword123!");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("FixturePassword123!");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.locator('form [role="alert"]')).toBeVisible();
});
test("logout clears the cookie and persists after reload", async ({
  page,
  context,
}) => {
  await login(page, "buyer@example.test");
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
  expect(
    (await context.cookies()).some((c) => c.name === "refresh_token"),
  ).toBe(false);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible();
});
