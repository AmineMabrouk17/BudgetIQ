import { Quote } from "lucide-react";
import type { Quote as QuoteType } from "@/lib/quotes";

export default function QuoteCard({ quote }: { quote: QuoteType }) {
  return (
    <figure className="card w-full bg-base-100 shadow">
      <div className="card-body flex-row items-start gap-3">
        <Quote className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden />
        <blockquote>
          <p className="text-base font-medium text-base-content">
            &ldquo;{quote.text}&rdquo;
          </p>
          <figcaption className="mt-1 text-sm text-base-content/60">
            — {quote.author}
          </figcaption>
        </blockquote>
      </div>
    </figure>
  );
}
