"use client";

import { Mic } from "lucide-react";
import type { ParsedTransactionAction } from "@/lib/gemini";
import TransactionActionCard from "@/components/ai/TransactionActionCard";
import MarkdownMessage from "@/components/ai/MarkdownMessage";

export default function MessageBubble({
  role,
  text,
  action,
  error,
  viaVoice,
}: {
  role: "user" | "assistant";
  text: string;
  action?: ParsedTransactionAction;
  error?: boolean;
  /** True when the message started as a recorded voice note. */
  viaVoice?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="chat chat-end">
        {viaVoice && (
          <div className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-base-content/60">
            <Mic className="h-3 w-3" aria-hidden="true" />
            Voice note
          </div>
        )}
        <div className="chat-bubble chat-bubble-primary">{text}</div>
      </div>
    );
  }

  return (
    <>
      <div className="chat chat-start">
        <div
          className={`chat-bubble ${
            error ? "chat-bubble-error" : "chat-bubble-secondary"
          }`}
        >
          {error ? text : <MarkdownMessage text={text} />}
        </div>
      </div>
      {/* Outside the chat grid: the card is wider than a bubble, and as a
          sibling it squeezes the bubble into a one-word column. */}
      {action && <TransactionActionCard action={action} />}
    </>
  );
}
