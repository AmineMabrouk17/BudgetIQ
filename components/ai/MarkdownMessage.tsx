"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders assistant prose. The model writes Markdown even when nothing asks it
 * to, so chat bubbles parse it rather than showing the user raw `**` and `-`.
 *
 * `react-markdown` escapes HTML instead of injecting it, so a reply can never
 * smuggle markup into the page. `prose` classes come from the Tailwind typography
 * plugin; `prose-invert` keeps the bubble readable in dark mode.
 */
export default function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-invert dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
