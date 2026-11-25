// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const rateLimit = vi.fn();
const transcribeAudio = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getUser: () => getUser(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => rateLimit(...args),
}));

vi.mock("@/lib/transcribe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/transcribe")>();
  return {
    ...actual,
    transcribeAudio: (...args: unknown[]) => transcribeAudio(...args),
  };
});

import { POST } from "@/app/api/transcribe/route";
import { MAX_AUDIO_BYTES, TranscriptionError } from "@/lib/transcribe";

function multipartRequest(
  options: {
    field?: string;
    type?: string;
    bytes?: number;
    omitAudio?: boolean;
  } = {}
) {
  const {
    field = "audio",
    type = "audio/webm",
    bytes = 2048,
    omitAudio = false,
  } = options;

  const form = new FormData();
  if (!omitAudio) {
    form.append(
      field,
      new File([new Uint8Array(bytes)], "voice-note.webm", { type }),
      "voice-note.webm"
    );
  }

  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: form,
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ id: "user-1" });
  rateLimit.mockResolvedValue({ success: true });
  transcribeAudio.mockResolvedValue({
    text: "I spent 15 dollars on coffee",
    model: "gemini-3.5-flash-lite",
  });
});

describe("POST /api/transcribe", () => {
  it("rejects an anonymous caller", async () => {
    getUser.mockResolvedValue(null);

    const response = await POST(multipartRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rate-limits per user before reading the audio", async () => {
    rateLimit.mockResolvedValue({ success: false });

    const response = await POST(multipartRequest());

    expect(response.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "transcribe",
        identifier: "user-1",
      })
    );
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it("rejects a body that is not a multipart upload", async () => {
    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: "nope" }),
      }) as never
    );

    expect(response.status).toBe(415);
  });

  it("rejects a multipart body with no audio field", async () => {
    const response = await POST(multipartRequest({ omitAudio: true }));

    expect(response.status).toBe(400);
  });

  it("returns the transcript", async () => {
    const response = await POST(multipartRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      transcript: "I spent 15 dollars on coffee",
    });

    const [input] = transcribeAudio.mock.calls[0] as [
      { data: Uint8Array; mimeType: string },
    ];
    expect(input.mimeType).toBe("audio/webm");
    expect(input.data.byteLength).toBe(2048);
  });

  it("accepts MediaRecorder's codec parameter", async () => {
    const response = await POST(
      multipartRequest({ type: "audio/webm;codecs=opus" })
    );

    expect(response.status).toBe(200);
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "audio/webm" })
    );
  });

  it("rejects an unsupported audio format", async () => {
    const response = await POST(multipartRequest({ type: "video/mp4" }));

    expect(response.status).toBe(415);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it("rejects an empty upload", async () => {
    const response = await POST(multipartRequest({ bytes: 0 }));

    expect(response.status).toBe(422);
  });

  it("rejects a recording over the size cap", async () => {
    const response = await POST(
      multipartRequest({ bytes: MAX_AUDIO_BYTES + 1 })
    );

    expect(response.status).toBe(413);
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it("turns silence into a retryable 422", async () => {
    transcribeAudio.mockRejectedValue(
      new TranscriptionError("No speech", { kind: "empty" })
    );

    const response = await POST(multipartRequest());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "I couldn't hear any speech in that recording. Please try again.",
    });
  });

  it("maps a spent quota to 429", async () => {
    transcribeAudio.mockRejectedValue(
      new TranscriptionError("Quota", { kind: "quota" })
    );

    expect((await POST(multipartRequest())).status).toBe(429);
  });

  it("maps a provider outage to 503", async () => {
    transcribeAudio.mockRejectedValue(
      new TranscriptionError("Busy", { kind: "overloaded" })
    );

    expect((await POST(multipartRequest())).status).toBe(503);
  });

  it("keeps configuration problems internal", async () => {
    transcribeAudio.mockRejectedValue(
      new TranscriptionError("GEMINI_API_KEY is not configured", {
        kind: "config",
      })
    );

    const response = await POST(multipartRequest());
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).not.toContain("GEMINI_API_KEY");
  });

  it("returns 502 for an unexpected failure", async () => {
    transcribeAudio.mockRejectedValue(new Error("boom"));

    expect((await POST(multipartRequest())).status).toBe(502);
  });
});
