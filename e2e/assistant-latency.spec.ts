import fs from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { previewAuthHeaders } from "./helpers/preview-auth";

/**
 * Assistant latency harness.
 *
 * Measures the two provider-backed paths a transaction can take:
 *   - typed message  -> POST /api/chat
 *   - voice note     -> POST /api/transcribe -> POST /api/chat
 *
 * Run it against a server (`pnpm dev` / `pnpm start`) and point
 * `LATENCY_OUT` at a file to keep the raw samples for a before/after table:
 *
 *   LATENCY_RUNS=3 LATENCY_OUT=/tmp/latency.json \
 *     pnpm exec playwright test e2e/assistant-latency.spec.ts --reporter=list
 *
 * The assertions are budgets, not benchmarks: they fail a build where the
 * assistant regresses from seconds into tens of seconds.
 */

const RUNS = Number(process.env.LATENCY_RUNS ?? 2);
const OUT_FILE = process.env.LATENCY_OUT
  ? path.resolve(process.env.LATENCY_OUT)
  : null;
const AUDIO = path.resolve(__dirname, "fixtures/voice-note-coffee.wav");

type Sample = {
  path: "text" | "voice-transcript" | "voice-total" | "voice-chat";
  ms: number;
  status: number;
  serverMs: number | null;
  ok: boolean;
};

const samples: Sample[] = [];

function serverMs(headers: Record<string, string>): number | null {
  // `Server-Timing: chat;dur=812` when the route reports its own duration.
  const match = headers["server-timing"]?.match(/dur=([\d.]+)/);
  return match ? Math.round(Number(match[1])) : null;
}

async function wallTime<T>(
  run: () => Promise<T>
): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await run();
  return { result, ms: Date.now() - start };
}

async function chat(
  request: APIRequestContext,
  message: string
): Promise<{ status: number; ms: number; server: number | null; body: unknown }> {
  const { result, ms } = await wallTime(() =>
    request.post("/api/chat", {
      headers: previewAuthHeaders(),
      data: { message },
      timeout: 70_000,
      failOnStatusCode: false,
    })
  );
  const body = await result.json().catch(() => null);
  return {
    status: result.status(),
    ms,
    server: serverMs(result.headers()),
    body,
  };
}

async function transcribe(
  request: APIRequestContext
): Promise<{ status: number; ms: number; server: number | null; transcript: string }> {
  const { result, ms } = await wallTime(() =>
    request.post("/api/transcribe", {
      headers: previewAuthHeaders(),
      multipart: {
        audio: {
          name: "voice-note.wav",
          mimeType: "audio/wav",
          buffer: fs.readFileSync(AUDIO),
        },
      },
      timeout: 70_000,
      failOnStatusCode: false,
    })
  );
  const body = (await result.json().catch(() => null)) as {
    transcript?: string;
  } | null;
  return {
    status: result.status(),
    ms,
    server: serverMs(result.headers()),
    transcript: body?.transcript ?? "",
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

function record(sample: Sample) {
  samples.push(sample);
}

test.describe.configure({ mode: "serial" });

test("typed transaction latency", async ({ request }) => {
  // First call pays route compilation in dev; it is not a user-facing sample.
  await request.post("/api/chat", {
    headers: previewAuthHeaders(),
    data: { message: "hello" },
    timeout: 90_000,
    failOnStatusCode: false,
  });

  for (let i = 0; i < RUNS; i++) {
    const result = await chat(request, "I spent 15 dollars on coffee");
    record({
      path: "text",
      ms: result.ms,
      status: result.status,
      serverMs: result.server,
      ok: result.status === 200,
    });
    console.log(`text #${i + 1}: ${result.ms}ms (${result.status})`);
  }

  const values = samples.filter((s) => s.path === "text").map((s) => s.ms);
  expect(median(values), "typed transactions should answer in seconds").toBeLessThan(
    15_000
  );
});

test("voice note latency (transcription + reply)", async ({ request }) => {
  for (let i = 0; i < RUNS; i++) {
    const transcript = await transcribe(request);
    record({
      path: "voice-transcript",
      ms: transcript.ms,
      status: transcript.status,
      serverMs: transcript.server,
      ok: transcript.status === 200 && transcript.transcript.length > 0,
    });
    console.log(
      `voice-transcript #${i + 1}: ${transcript.ms}ms (${transcript.status})`
    );

    if (transcript.status !== 200) continue;

    const reply = await chat(request, transcript.transcript);
    record({
      path: "voice-chat",
      ms: reply.ms,
      status: reply.status,
      serverMs: reply.server,
      ok: reply.status === 200,
    });
    record({
      path: "voice-total",
      ms: transcript.ms + reply.ms,
      status: reply.status,
      serverMs:
        transcript.server !== null && reply.server !== null
          ? transcript.server + reply.server
          : null,
      ok: reply.status === 200,
    });
    console.log(
      `voice-total #${i + 1}: ${transcript.ms + reply.ms}ms (${reply.status})`
    );
  }

  const transcriptions = samples
    .filter((s) => s.path === "voice-transcript")
    .map((s) => s.ms);
  const totals = samples.filter((s) => s.path === "voice-total").map((s) => s.ms);

  expect(
    median(transcriptions),
    "transcription should finish in seconds"
  ).toBeLessThan(20_000);
  if (totals.length > 0) {
    expect(
      median(totals),
      "a spoken transaction should finish in seconds"
    ).toBeLessThan(30_000);
  }
});

test.afterAll(() => {
  if (!OUT_FILE) return;
  const byPath = Object.fromEntries(
    [...new Set(samples.map((s) => s.path))].map((kind) => {
      const values = samples.filter((s) => s.path === kind).map((s) => s.ms);
      return [
        kind,
        {
          runs: values.length,
          medianMs: median(values),
          minMs: Math.min(...values),
          maxMs: Math.max(...values),
        },
      ];
    })
  );
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ measuredAt: new Date().toISOString(), samples, summary: byPath }, null, 2)
  );
});
