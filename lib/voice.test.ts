import { describe, expect, it } from "vitest";
import {
  extensionForMimeType,
  formatElapsed,
  pickRecorderMimeType,
} from "@/lib/voice";

describe("pickRecorderMimeType", () => {
  it("prefers Opus in WebM, which Chromium records", () => {
    const supported = (type: string) => type.startsWith("audio/webm");
    expect(pickRecorderMimeType(supported)).toBe("audio/webm;codecs=opus");
  });

  it("falls back to the first supported container", () => {
    const supported = (type: string) => type === "audio/mp4";
    expect(pickRecorderMimeType(supported)).toBe("audio/mp4");
  });

  it("returns undefined when nothing is supported", () => {
    expect(pickRecorderMimeType(() => false)).toBeUndefined();
  });
});

describe("extensionForMimeType", () => {
  it("matches the container, ignoring codec parameters", () => {
    expect(extensionForMimeType("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionForMimeType("audio/ogg;codecs=opus")).toBe("ogg");
    expect(extensionForMimeType("audio/mp4")).toBe("m4a");
    expect(extensionForMimeType("audio/mpeg")).toBe("mp3");
  });

  it("defaults to webm for unknown types", () => {
    expect(extensionForMimeType("audio/unknown")).toBe("webm");
  });
});

describe("formatElapsed", () => {
  it("renders a recording clock", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(3_400)).toBe("0:03");
    expect(formatElapsed(61_000)).toBe("1:01");
  });

  it("never goes negative", () => {
    expect(formatElapsed(-500)).toBe("0:00");
  });
});
