"use client";

import type { ParsedTransactionAction } from "@/lib/gemini";
import TransactionActionCard from "@/components/ai/TransactionActionCard";

export default function MessageBubble({
  role,
  text,
  action,
  error,
}: {
  role: "user" | "assistant";
  text: string;
  action?: ParsedTransactionAction;
  error?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="chat chat-end">
        <div className="chat-bubble chat-bubble-primary">{text}</div>
      </div>
    );
  }

  return (
    <div className="chat chat-start">
      <div
        className={`chat-bubble ${
          error ? "chat-bubble-error" : "chat-bubble-secondary"
        }`}
      >
        {text}
      </div>
      {action && <TransactionActionCard action={action} />}
    </div>
  );
}
