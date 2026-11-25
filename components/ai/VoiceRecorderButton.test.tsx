import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VoiceRecorderButton from "@/components/ai/VoiceRecorderButton";

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn((type: string) => type.startsWith("audio/webm"));

  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(_stream: unknown, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? "audio/webm";
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob([new Uint8Array(1024)], { type: this.mimeType }),
    });
    this.onstop?.();
  }
}

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

function renderRecorder() {
  const onTranscript = vi.fn();
  const onError = vi.fn();
  const onStatusChange = vi.fn();
  const utils = render(
    <VoiceRecorderButton
      onTranscript={onTranscript}
      onError={onError}
      onStatusChange={onStatusChange}
    />
  );
  return { ...utils, onTranscript, onError, onStatusChange };
}

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  getUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: stopTrack }],
  });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("VoiceRecorderButton", () => {
  it("records, uploads and hands back the transcript", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ transcript: "I spent 15 dollars on coffee" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { onTranscript, onError } = renderRecorder();

    fireEvent.click(screen.getByRole("button", { name: "Record voice note" }));

    const stopButton = await screen.findByRole("button", {
      name: "Stop recording",
    });
    expect(onError).not.toHaveBeenCalled();

    fireEvent.click(stopButton);

    await waitFor(() =>
      expect(onTranscript).toHaveBeenCalledWith("I spent 15 dollars on coffee")
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/transcribe");
    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    const audio = form.get("audio");
    expect(audio).toBeInstanceOf(File);
    expect((audio as File).size).toBeGreaterThan(0);
    expect(stopTrack).toHaveBeenCalled();
  });

  it("shows the recording clock while listening", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRecorder();

    fireEvent.click(screen.getByRole("button", { name: "Record voice note" }));

    expect(
      await screen.findByRole("button", { name: "Stop recording" })
    ).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("passes a server error through to the chat", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Voice transcription has reached its limit." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const { onTranscript, onError } = renderRecorder();

    fireEvent.click(screen.getByRole("button", { name: "Record voice note" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Stop recording" })
    );

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Voice transcription has reached its limit."
      )
    );
    expect(onTranscript).not.toHaveBeenCalled();
  });

  it("treats an economy recording with no bytes as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ transcript: "  " }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const { onError } = renderRecorder();

    fireEvent.click(screen.getByRole("button", { name: "Record voice note" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Stop recording" })
    );

    await waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it("explains a blocked microphone instead of failing silently", async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error("denied"), { name: "NotAllowedError" })
    );

    const { onError } = renderRecorder();

    fireEvent.click(screen.getByRole("button", { name: "Record voice note" }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("Microphone access was blocked")
      )
    );
  });
});
