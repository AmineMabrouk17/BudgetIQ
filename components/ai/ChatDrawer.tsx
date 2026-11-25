"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import type { ChatActionResponse, ParsedTransactionAction } from "@/lib/gemini";
import MessageBubble from "@/components/ai/MessageBubble";
import VoiceRecorderButton, {
  type VoiceRecorderStatus,
} from "@/components/ai/VoiceRecorderButton";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: ParsedTransactionAction;
  error?: boolean;
  /** The message was spoken; the bubble shows the transcript and a note badge. */
  viaVoice?: boolean;
};

const MAX_MESSAGE_LENGTH = 1000;

export default function ChatDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceRecorderStatus>("idle");

  const listRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isPending, voiceStatus]);

  function closeDrawer() {
    setIsOpen(false);
    openButtonRef.current?.focus();
  }

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const panel = drawerPanelRef.current;
    if (!panel) return;

    // Focus chat input on drawer open
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function addAssistantError(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", text, error: true },
    ]);
  }

  async function sendMessage(rawText: string, options: { viaVoice?: boolean } = {}) {
    const text = rawText.trim();
    if (!text || isPending) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      addAssistantError("That message is too long. Keep it under 1000 characters.");
      return;
    }

    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        text,
        ...(options.viaVoice ? { viaVoice: true } : {}),
      },
    ]);
    setIsPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${response.status})`
        );
      }

      const data = (await response.json()) as ChatActionResponse;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.message,
          action: data.hasAction ? data.transaction : undefined,
        },
      ]);
    } catch (error) {
      addAssistantError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsPending(false);
    }
  }

  function handleVoiceTranscript(transcript: string) {
    void sendMessage(transcript, { viaVoice: true });
  }

  const isVoiceBusy =
    voiceStatus === "requesting" ||
    voiceStatus === "recording" ||
    voiceStatus === "transcribing";

  return (
    <div className="drawer drawer-end">
      <input
        id="chat-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        onChange={(e) => setIsOpen(e.target.checked)}
      />
      <div className="drawer-content">
        {children}
        <button
          ref={openButtonRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-primary btn-circle fixed bottom-6 right-6 z-40 shadow-lg"
          aria-label="Open AI assistant"
          aria-expanded={isOpen}
          aria-controls="chat-drawer-panel"
        >
          <Bot />
        </button>
      </div>
      <div className="drawer-side z-50">
        <label
          htmlFor="chat-drawer"
          aria-label="Close AI assistant"
          className="drawer-overlay !bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
        <div
          id="chat-drawer-panel"
          ref={drawerPanelRef}
          role="dialog"
          aria-modal="true"
          aria-label="BudgetIQ Assistant"
          className="flex h-full w-80 max-w-[85vw] flex-col bg-base-100 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-base-200 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-bold">BudgetIQ Assistant</h2>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="btn btn-ghost btn-sm"
              aria-label="Close assistant"
            >
              <X />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="pt-10 text-center text-sm text-base-content/60">
                Ask me anything about your finances.
                <br />
                Try: &ldquo;I spent $15 on coffee&rdquo;
                <br />
                or tap the mic and say it.
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                text={m.text}
                action={m.action}
                error={m.error}
                viaVoice={m.viaVoice}
              />
            ))}
            {voiceStatus === "recording" && (
              <div className="chat chat-end" role="status">
                <div className="chat-bubble chat-bubble-primary flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 animate-pulse rounded-full bg-error"
                    aria-hidden="true"
                  />
                  Listening… tap stop to send
                </div>
              </div>
            )}
            {voiceStatus === "transcribing" && (
              <div className="chat chat-end" role="status">
                <div className="chat-bubble chat-bubble-primary">
                  <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  Transcribing your voice note…
                </div>
              </div>
            )}
            {isPending && (
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-secondary">
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <form
            className="flex gap-2 border-t border-base-200 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <VoiceRecorderButton
              disabled={!isOpen || isPending}
              onTranscript={handleVoiceTranscript}
              onError={addAssistantError}
              onStatusChange={setVoiceStatus}
            />
            <input
              ref={inputRef}
              className="input input-bordered flex-1"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask or speak your transaction…"
              aria-label="Chat message"
              disabled={isPending || isVoiceBusy}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                isPending || isVoiceBusy || input.trim().length === 0
              }
              aria-label="Send message"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Send />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
