"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders assistant prose. The model writes Markdown even when nothing asks it
 * to, so chat bubbles parse it rather than showing the user raw `**` and `-`.
 *
 * `react-markdown` escapes HTML instead of injecting it, so a reply can never
 * smuggle markup into the page. `prose-in-bubble` (see globals.css) keeps the
 * typography plugin from imposing its own colours, which would otherwise put
 * near-black text on a near-black bubble.
 */
export default function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-in-bubble">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
