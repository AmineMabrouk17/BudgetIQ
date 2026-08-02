"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import type { ChatActionResponse, ParsedTransactionAction } from "@/lib/gemini";
import MessageBubble from "@/components/ai/MessageBubble";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: ParsedTransactionAction;
  error?: boolean;
};

export default function ChatDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isPending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text },
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
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="drawer drawer-end">
      <input id="chat-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {children}
        <label
          htmlFor="chat-drawer"
          className="btn btn-primary btn-circle fixed bottom-6 right-6 z-40 shadow-lg"
          aria-label="Open AI assistant"
        >
          <Bot />
        </label>
      </div>
      <div className="drawer-side z-50">
        <label
          htmlFor="chat-drawer"
          aria-label="Close AI assistant"
          className="drawer-overlay"
        />
        <div className="flex h-full w-80 max-w-[85vw] flex-col bg-base-100">
          <div className="flex items-center justify-between border-b border-base-200 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-bold">BudgetIQ Assistant</h2>
            </div>
            <label
              htmlFor="chat-drawer"
              className="btn btn-ghost btn-sm"
              aria-label="Close assistant"
            >
              <X />
            </label>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="pt-10 text-center text-sm text-base-content/60">
                Ask me anything about your finances.
                <br />
                Try: &ldquo;I spent $15 on coffee&rdquo;
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                text={m.text}
                action={m.action}
                error={m.error}
              />
            ))}
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
              handleSend();
            }}
          >
            <input
              className="input input-bordered flex-1"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask your assistant…"
              aria-label="Chat message"
              disabled={isPending}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isPending || input.trim().length === 0}
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
