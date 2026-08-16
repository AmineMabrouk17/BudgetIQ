import { expect, test } from "@playwright/test";

test.describe("AntiInspect deterrent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/anti-inspect/);
  });

  test("blocks the right-click context menu", async ({ page }) => {
    const prevented = await page.evaluate(() => {
      const event = new MouseEvent("contextmenu", { cancelable: true });
      document.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(true);
  });

  test("blocks devtools hotkeys", async ({ page }) => {
    const blockedKeys = [
      { key: "F12" },
      { key: "i", ctrlKey: true, shiftKey: true },
      { key: "j", ctrlKey: true, shiftKey: true },
      { key: "c", ctrlKey: true, shiftKey: true },
      { key: "u", ctrlKey: true },
      { key: "s", metaKey: true },
    ];

    for (const keyOptions of blockedKeys) {
      const prevented = await page.evaluate((options) => {
        const event = new KeyboardEvent("keydown", {
          ...options,
          cancelable: true,
        });
        document.dispatchEvent(event);
        return event.defaultPrevented;
      }, keyOptions);

      expect(prevented, `expected ${JSON.stringify(keyOptions)} to be blocked`).toBe(
        true
      );
    }
  });

  test("does not block normal keys or copy shortcuts", async ({ page }) => {
    const allowedKeys = [
      { key: "a" },
      { key: "Enter" },
      { key: "c", ctrlKey: true },
      { key: "v", metaKey: true },
    ];

    for (const keyOptions of allowedKeys) {
      const prevented = await page.evaluate((options) => {
        const event = new KeyboardEvent("keydown", {
          ...options,
          cancelable: true,
        });
        document.dispatchEvent(event);
        return event.defaultPrevented;
      }, keyOptions);

      expect(prevented, `expected ${JSON.stringify(keyOptions)} to pass`).toBe(
        false
      );
    }
  });

  test("disables text selection but keeps inputs selectable", async ({
    page,
  }) => {
    const bodyUserSelect = await page.evaluate(() =>
      getComputedStyle(document.body).userSelect
    );
    expect(bodyUserSelect).toBe("none");

    const inputUserSelect = await page.evaluate(() => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      const value = getComputedStyle(input).userSelect;
      input.remove();
      return value;
    });
    expect(inputUserSelect).toBe("text");
  });
});
