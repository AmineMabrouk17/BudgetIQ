"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, X } from "lucide-react";
import {
  extensionForMimeType,
  formatElapsed,
  pickRecorderMimeType,
} from "@/lib/voice";

export type VoiceRecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "transcribing";

/** The server caps uploads; the client stops the recording well before that. */
const MAX_RECORDING_MS = 60_000;

type VoiceRecorderButtonProps = {
  disabled?: boolean;
  /** Receives the transcript of a finished, successfully uploaded note. */
  onTranscript: (transcript: string) => void;
  /** Receives a message safe to show the user. */
  onError: (message: string) => void;
  /** Lets the chat surface a "listening"/"transcribing" state. */
  onStatusChange?: (status: VoiceRecorderStatus) => void;
};

function microphoneErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
      case "SecurityError":
        return "Microphone access was blocked. Allow it in your browser settings and try again.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No microphone was found. Connect one and try again.";
      case "NotReadableError":
      case "TrackStartError":
        return "The microphone is busy in another app. Close it and try again.";
      default:
        return error.message || "Could not start recording. Please try again.";
    }
  }
  return "Could not start recording. Please try again.";
}

/**
 * Records a short voice note, uploads it to `/api/transcribe`, and hands the
 * transcript back to the chat. Recording state lives here so the chat form
 * only needs to react to the finished transcript.
 */
export default function VoiceRecorderButton({
  disabled = false,
  onTranscript,
  onError,
  onStatusChange,
}: VoiceRecorderButtonProps) {
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);

  const callbacksRef = useRef({ onTranscript, onError, onStatusChange });
  useEffect(() => {
    callbacksRef.current = { onTranscript, onError, onStatusChange };
  }, [onTranscript, onError, onStatusChange]);

  const updateStatus = useCallback((next: VoiceRecorderStatus) => {
    setStatus(next);
    callbacksRef.current.onStatusChange?.(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const upload = useCallback(
    async (blob: Blob, mimeType: string) => {
      updateStatus("transcribing");
      try {
        const form = new FormData();
        form.append(
          "audio",
          blob,
          `voice-note.${extensionForMimeType(mimeType)}`
        );

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        const body = (await response.json().catch(() => null)) as {
          transcript?: unknown;
          error?: unknown;
        } | null;

        if (!response.ok) {
          const message =
            typeof body?.error === "string"
              ? body.error
              : `Transcription failed (${response.status})`;
          throw new Error(message);
        }

        const transcript =
          typeof body?.transcript === "string" ? body.transcript.trim() : "";
        if (!transcript) {
          throw new Error(
            "I couldn't hear any speech in that recording. Please try again."
          );
        }

        callbacksRef.current.onTranscript(transcript);
      } catch (error) {
        callbacksRef.current.onError(
          error instanceof Error
            ? error.message
            : "Voice transcription failed. Please try again."
        );
      } finally {
        if (!cancelledRef.current) {
          updateStatus("idle");
          setElapsed(0);
        }
      }
    },
    [updateStatus]
  );

  const stopRecording = useCallback(
    (discard: boolean) => {
      const recorder = recorderRef.current;
      clearTimers();
      if (!recorder) {
        releaseStream();
        updateStatus("idle");
        setElapsed(0);
        return;
      }

      discardRef.current = discard;
      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        releaseStream();
        recorderRef.current = null;
        updateStatus("idle");
        setElapsed(0);
      }
    },
    [clearTimers, releaseStream, updateStatus]
  );

  async function startRecording() {
    if (disabled || status !== "idle") return;

    // A fresh attempt is live again even if a previous close cancelled one.
    cancelledRef.current = false;
    updateStatus("requesting");
    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error(
          "Voice recording is not supported in this browser. Type your message instead."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        releaseStream();
        updateStatus("idle");
        return;
      }
      streamRef.current = stream;

      const mimeType = pickRecorderMimeType(
        (type) => MediaRecorder.isTypeSupported?.(type) ?? false
      );
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        clearTimers();
        const chunks = chunksRef.current;
        const recordedType = recorder.mimeType || mimeType || "audio/webm";
        const discarded = discardRef.current;
        recorderRef.current = null;
        releaseStream();

        if (cancelledRef.current) return;

        if (discarded) {
          chunksRef.current = [];
          updateStatus("idle");
          setElapsed(0);
          return;
        }

        const blob = new Blob(chunks, { type: recordedType });
        chunksRef.current = [];
        if (blob.size < 256) {
          updateStatus("idle");
          setElapsed(0);
          callbacksRef.current.onError(
            "No audio was captured. Try holding the microphone a little longer."
          );
          return;
        }

        void upload(blob, recordedType);
      };

      recorderRef.current = recorder;
      recorder.start(250);
      startedAtRef.current = Date.now();
      setElapsed(0);
      updateStatus("recording");

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current);
      }, 250);
      autoStopRef.current = setTimeout(() => {
        stopRecording(false);
      }, MAX_RECORDING_MS);
    } catch (error) {
      releaseStream();
      updateStatus("idle");
      callbacksRef.current.onError(microphoneErrorMessage(error));
    }
  }

  // Stop a live recording when the drawer closes or the chat becomes busy;
  // leaving the microphone open is both a privacy and a battery problem.
  useEffect(() => {
    if (!disabled) return;
    if (status === "recording") {
      stopRecording(true);
      return;
    }
    if (status === "requesting") {
      // No recorder exists yet: mark the pending getUserMedia as abandoned so
      // it cannot start a microphone after the drawer closed.
      cancelledRef.current = true;
      updateStatus("idle");
    }
  }, [disabled, status, stopRecording, updateStatus]);

  useEffect(() => {
    // React (StrictMode in development) mounts, cleans up and mounts again.
    // Reset the flag on every mount, or the second mount looks already
    // cancelled and every recording aborts after getUserMedia resolves.
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      clearTimers();
      discardRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      releaseStream();
    };
  }, [clearTimers, releaseStream]);

  if (status === "recording") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-error btn-sm gap-2"
          onClick={() => stopRecording(false)}
          aria-label="Stop recording"
        >
          <Square className="h-4 w-4" />
          <span className="tabular-nums">{formatElapsed(elapsed)}</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm"
          onClick={() => stopRecording(true)}
          aria-label="Cancel recording"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const busy = status === "requesting" || status === "transcribing";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square"
      onClick={startRecording}
      disabled={disabled || busy}
      aria-label={
        status === "transcribing"
          ? "Transcribing voice note"
          : "Record voice note"
      }
      title="Record a voice note"
    >
      {busy ? <Loader2 className="animate-spin" /> : <Mic />}
    </button>
  );
}
