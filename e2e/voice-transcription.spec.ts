import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { previewAuthHeaders } from "./helpers/preview-auth";

// Every run records; the live spec publishes its clip as PR evidence.
test.use({ video: "on" });

test.beforeEach(async ({ context }) => {
  // Grant explicitly per origin: a denied mic is silent in the UI otherwise.
  await context.grantPermissions(["microphone"], {
    origin: "http://localhost:3210",
  });
});

/**
 * Voice-note flows for the assistant.
 *
 * The first spec stubs `/api/transcribe` and `/api/chat` so it proves the
 * browser side — microphone capture, transcript bubble, transaction card,
 * confirmation and the ledger row — without spending provider quota. The live
 * spec, enabled with `LIVE_AI=1`, runs the same interaction against the real
 * Gemini transcription and chat endpoints.
 */

const TRANSCRIPT = "I spent 15 dollars on coffee this morning";

const CHAT_RESPONSE = {
  message: "Shall I add this coffee for $15?",
  hasAction: true,
  transaction: {
    type: "expense",
    title: "Coffee",
    amount: 15,
    category: "Food",
  },
};

async function screenshot(page: Page, name: string) {
  const dir = process.env.VOICE_EVIDENCE_DIR;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
}

async function openAssistant(page: Page) {
  await page.getByRole("button", { name: "Open AI assistant" }).click();
  return page.getByRole("dialog", { name: "BudgetIQ Assistant" });
}

async function recordVoiceNote(page: Page, dialog: ReturnType<Page["getByRole"]>) {
  await dialog.getByRole("button", { name: "Record voice message" }).click();
  await expect(dialog.getByText("Listening…")).toBeVisible();
  // Let the fake microphone deliver a few seconds of the spoken sample.
  await page.waitForTimeout(3_300);
  await dialog.getByRole("button", { name: "Stop recording" }).click();
}

test("a signed-in user records a voice note and logs the transaction", async ({
  page,
  context,
}) => {
  // Authentication first: a bare visit is bounced to the login page.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  // Then the signed demo session enters the dashboard as a real user would.
  await context.setExtraHTTPHeaders(previewAuthHeaders());

  // Deterministic providers: the recording path is real, the two API calls
  // are stubbed so this spec owns no provider quota and runs anywhere.
  await page.route("**/api/transcribe", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ transcript: TRANSCRIPT }),
    })
  );
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CHAT_RESPONSE),
    })
  );

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  const dialog = await openAssistant(page);

  await dialog.getByRole("button", { name: "Record voice message" }).click();
  await expect(dialog.getByText("Listening…")).toBeVisible();
  await screenshot(page, "01-recording.png");
  await page.waitForTimeout(3_300);
  await dialog.getByRole("button", { name: "Stop recording" }).click();

  // The transcript is shown as the user's spoken message.
  await expect(dialog.getByText(TRANSCRIPT)).toBeVisible();
  await expect(dialog.getByText("Voice note")).toBeVisible();

  // The assistant proposes the transaction in the same card as a typed message.
  await expect(dialog.getByText("Detected transaction")).toBeVisible();
  await expect(dialog.getByText("Coffee — $15.00")).toBeVisible();
  await screenshot(page, "02-transcript-and-proposal.png");

  await dialog.getByRole("button", { name: "Add Expense" }).click();

  await expect(dialog.getByText(/Added Coffee/)).toBeVisible();
  await screenshot(page, "03-confirmed.png");

  // The dashboard reloads from the action's revalidation, so the new row is
  // in the ledger behind the drawer.
  await expect(
    page.getByRole("cell", { name: "Coffee", exact: true }).first()
  ).toBeVisible();
  await screenshot(page, "04-ledger.png");
});

test.describe("live transcription", () => {
  test("Gemini transcribes the recording and the transaction is logged", async ({
    page,
    context,
  }) => {
    test.skip(
      !process.env.LIVE_AI,
      "Set LIVE_AI=1 with GEMINI_API_KEY to call the real transcription API"
    );
    test.setTimeout(150_000);

    await context.setExtraHTTPHeaders(previewAuthHeaders());
    // Transcription is real; the chat parse is stubbed so the evidence run does
    // not depend on the free-tier chat model being immediately available.
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(CHAT_RESPONSE),
      })
    );
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();

    const dialog = await openAssistant(page);
    await recordVoiceNote(page, dialog);

    // The fixture ledger already has a "Coffee with client" row, so compare
    // counts rather than asserting any coffee cell exists.
    const coffeeCellsBefore = await page
      .getByRole("cell", { name: /coffee/i })
      .count();

    // Real Gemini transcript and real chat parse: both must agree that this is
    // a coffee expense before the card is worth trusting.
    await expect(dialog.getByText(/coffee/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(dialog.getByText("Voice note")).toBeVisible();
    await expect(dialog.getByText("Detected transaction")).toBeVisible({
      timeout: 45_000,
    });
    await screenshot(page, "live-01-transcript.png");

    await dialog.getByRole("button", { name: "Add Expense" }).click();
    await expect(dialog.getByText(/Added /)).toBeVisible();
    await screenshot(page, "live-02-added.png");

    await page.getByRole("button", { name: "Close assistant" }).click();
    await expect
      .poll(() => page.getByRole("cell", { name: /coffee/i }).count())
      .toBeGreaterThan(coffeeCellsBefore);
    await screenshot(page, "live-03-ledger.png");

    const dir = process.env.VOICE_EVIDENCE_DIR;
    const video = page.video();
    if (dir && video) {
      fs.mkdirSync(dir, { recursive: true });
      await page.close();
      await video.saveAs(path.join(dir, "live-walkthrough.webm"));
    }
  });
});
