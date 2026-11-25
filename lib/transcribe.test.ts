import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TRANSCRIBE_MODEL,
  MAX_AUDIO_BYTES,
  TranscriptionError,
  normalizeAudioMimeType,
  normalizeTranscript,
  transcribeAudio,
} from "@/lib/transcribe";

const AUDIO = new Uint8Array(1024).fill(7);

function geminiResponse(parts: Array<{ text?: string; thought?: boolean }>) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, message = "nope") {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  delete process.env.GEMINI_TRANSCRIBE_MODEL;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("normalizeAudioMimeType", () => {
  it("keeps the container and drops MediaRecorder codec parameters", () => {
    expect(normalizeAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
  });

  it("accepts the formats a browser can record", () => {
    expect(normalizeAudioMimeType("audio/ogg")).toBe("audio/ogg");
    expect(normalizeAudioMimeType("audio/mp4")).toBe("audio/mp4");
    expect(normalizeAudioMimeType("audio/wav")).toBe("audio/wav");
  });

  it("maps browser aliases to Gemini's canonical names", () => {
    expect(normalizeAudioMimeType("audio/x-m4a")).toBe("audio/mp4");
    expect(normalizeAudioMimeType("audio/mp3")).toBe("audio/mpeg");
  });

  it("rejects formats Gemini cannot read", () => {
    expect(normalizeAudioMimeType("video/mp4")).toBeNull();
    expect(normalizeAudioMimeType("application/octet-stream")).toBeNull();
    expect(normalizeAudioMimeType("")).toBeNull();
  });
});

describe("normalizeTranscript", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeTranscript("  I   spent\n$15  ")).toBe("I spent $15");
  });

  it("strips matching quotes the model added around the transcript", () => {
    expect(normalizeTranscript('"I spent $15 on coffee."')).toBe(
      "I spent $15 on coffee."
    );
    expect(normalizeTranscript("“Bonjour, j'ai payé 15 euros”")).toBe(
      "Bonjour, j'ai payé 15 euros"
    );
  });

  it("strips a Transcript: label", () => {
    expect(normalizeTranscript("Transcript: I paid the rent")).toBe(
      "I paid the rent"
    );
  });

  it("leaves a plain transcript untouched", () => {
    expect(normalizeTranscript("Spent 12 dollars on lunch")).toBe(
      "Spent 12 dollars on lunch"
    );
  });
});

describe("transcribeAudio", () => {
  it("sends inline audio to the default audio model and returns the text", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(geminiResponse([{ text: "I spent $15 on coffee" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeAudio({
      data: AUDIO,
      mimeType: "audio/webm;codecs=opus",
    });

    expect(result).toEqual({
      text: "I spent $15 on coffee",
      model: DEFAULT_TRANSCRIBE_MODEL,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(
      `models/${DEFAULT_TRANSCRIBE_MODEL}:generateContent`
    );
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(
      "test-key"
    );

    const body = JSON.parse(String(init.body)) as {
      contents: Array<{
        parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>;
      }>;
    };
    const inline = body.contents[0].parts[1].inline_data;
    expect(inline?.mime_type).toBe("audio/webm");
    expect(inline?.data).toBe(Buffer.from(AUDIO).toString("base64"));
  });

  it("honours GEMINI_TRANSCRIBE_MODEL", async () => {
    vi.stubEnv("GEMINI_TRANSCRIBE_MODEL", "gemini-4-neon");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(geminiResponse([{ text: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeAudio({ data: AUDIO, mimeType: "audio/webm" });

    expect(result.model).toBe("gemini-4-neon");
    expect(fetchMock.mock.calls[0][0]).toContain("models/gemini-4-neon");
  });

  it("ignores thinking parts and joins the answer parts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse([
          { text: "let me listen", thought: true },
          { text: "Paid " },
          { text: "40 euros for groceries" },
        ])
      )
    );

    const result = await transcribeAudio({ data: AUDIO, mimeType: "audio/webm" });

    expect(result.text).toBe("Paid 40 euros for groceries");
  });

  it("treats silence as an empty transcription", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(geminiResponse([{ text: "   " }]))
    );

    await expect(
      transcribeAudio({ data: AUDIO, mimeType: "audio/webm" })
    ).rejects.toMatchObject({ kind: "empty" });
  });

  it("rejects an unsupported format before calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      transcribeAudio({ data: AUDIO, mimeType: "video/mp4" })
    ).rejects.toMatchObject({ kind: "unsupported" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a recording over the size cap", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      transcribeAudio({
        data: new Uint8Array(MAX_AUDIO_BYTES + 1),
        mimeType: "audio/webm",
      })
    ).rejects.toMatchObject({ kind: "too_large" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats an accidental tap as empty audio", async () => {
    await expect(
      transcribeAudio({ data: new Uint8Array(10), mimeType: "audio/webm" })
    ).rejects.toMatchObject({ kind: "empty" });
  });

  it("maps a quota response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(429, "Resource exhausted"))
    );

    await expect(
      transcribeAudio({ data: AUDIO, mimeType: "audio/webm" })
    ).rejects.toMatchObject({ kind: "quota", status: 429 });
  });

  it("maps a provider outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(503)));

    await expect(
      transcribeAudio({ data: AUDIO, mimeType: "audio/webm" })
    ).rejects.toMatchObject({ kind: "overloaded", status: 503 });
  });

  it("maps a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    await expect(
      transcribeAudio({ data: AUDIO, mimeType: "audio/webm" })
    ).rejects.toMatchObject({ kind: "overloaded" });
  });

  it("refuses to run without a key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      transcribeAudio({ data: AUDIO, mimeType: "audio/webm" })
    ).rejects.toBeInstanceOf(TranscriptionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
