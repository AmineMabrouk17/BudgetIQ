import { expect, test } from "@playwright/test";

test.describe("auth guard", () => {
  test("redirects unauthenticated visitors away from the dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("serves the security headers on the login page too", async ({
    request,
  }) => {
    const response = await request.get("/login");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("'nonce-");
  });
});
