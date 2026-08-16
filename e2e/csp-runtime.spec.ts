import { expect, test } from "@playwright/test";

test("applies the CSP nonce to framework scripts with no violations", async ({
  page,
}) => {
  const violations: string[] = [];

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("Content Security Policy")
    ) {
      violations.push(message.text());
    }
  });
  page.on("pageerror", (error) => violations.push(error.message));

  await page.goto("/");

  await expect(page.locator("html")).not.toBeEmpty();
  const scriptCount = await page.locator("script").count();
  expect(scriptCount).toBeGreaterThan(0);
  const nonceCount = await page.locator("script[nonce]").count();
  expect(nonceCount).toBeGreaterThan(0);

  expect(violations).toEqual([]);
});
