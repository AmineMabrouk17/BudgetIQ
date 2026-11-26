/**
 * Pure helpers for the voice-note recorder.
 *
 * Kept out of the component so the format choice and clock formatting can be
 * tested without a MediaRecorder.
 */

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

/** First recording container the browser can produce. */
export function pickRecorderMimeType(
  isSupported: (type: string) => boolean
): string | undefined {
  return PREFERRED_MIME_TYPES.find((type) => isSupported(type));
}

/** File extension that matches the recorded MIME type, for the upload form. */
export function extensionForMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase();
  switch (base) {
    case "audio/mp4":
    case "audio/m4a":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
      return "wav";
    case "audio/mpeg":
      return "mp3";
    default:
      return "webm";
  }
}

/** Recording clock as m:ss. */
export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
