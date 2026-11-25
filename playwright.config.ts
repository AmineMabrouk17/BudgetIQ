import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * The signed demo session used by authenticated specs and evidence capture.
 * Locally this must match the value passed to `webServer.env` below.
 */
const previewSecret = process.env.PREVIEW_TEST_SECRET ?? "local-preview-secret";

/**
 * Chromium's fake microphone reads this file, so a voice-note spec can record
 * real audio without a physical device. The clip says
 * "I spent fifteen dollars on coffee this morning".
 */
const fakeAudioFile = path.resolve(
  __dirname,
  "e2e/fixtures/voice-note-coffee.wav"
);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
    // Headless Chromium refuses the microphone even with `permissions` and the
    // fake device flags; run headed under Xvfb when recording (`PW_HEADED=1
    // xvfb-run -a pnpm test:e2e`).
    headless: process.env.PW_HEADED !== "1",
    // Voice specs record from the fake microphone; grant the permission up
    // front so Chromium does not reject getUserMedia.
    permissions: ["microphone"],
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-audio-capture=${fakeAudioFile}`,
      ],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // The chrome-headless-shell build used by default cannot open a
        // microphone even with the fake device flags; the full Chromium build
        // can, which is what the voice specs need.
        channel: "chromium",
      },
    },
  ],
  webServer: {
    command: "pnpm run build && pnpm start -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Enables the signed preview session so specs run as an authenticated
      // demo user without a real Supabase account.
      VERCEL_ENV: "preview",
      PREVIEW_TEST_SECRET: previewSecret,
    },
  },
});
