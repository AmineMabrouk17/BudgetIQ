export type Quote = {
  text: string;
  author: string;
};

const QUOTES: Quote[] = [
  {
    text: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
  },
  {
    text: "Financial freedom is available to those who learn about it and work for it.",
    author: "Robert Kiyosaki",
  },
  {
    text: "A budget is telling your money where to go instead of wondering where it went.",
    author: "John C. Maxwell",
  },
  {
    text: "It is not how much money you make, but how much money you keep.",
    author: "Robert Kiyosaki",
  },
  {
    text: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    text: "The stock market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
  },
  {
    text: "Every time you borrow money, you're robbing your future self.",
    author: "Nathan W. Morris",
  },
  {
    text: "Wealth is not about having a lot of money; it's about having a lot of options.",
    author: "Chris Rock",
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
  },
];

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const day = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((day - start) / 86_400_000) + 1;
}

export function quoteForDate(date: Date = new Date()): Quote {
  const index = (dayOfYear(date) - 1) % QUOTES.length;
  return QUOTES[index];
}

type QuoteSource = (data: Record<string, unknown>) => Quote | null;

const SOURCES: { url: string; parse: QuoteSource }[] = [
  {
    url: "https://api.quotable.io/random?tags=business",
    parse: (data) => {
      const text = typeof data.content === "string" ? data.content.trim() : "";
      const author =
        typeof data.author === "string" ? data.author.trim() : "Unknown";
      return text ? { text, author } : null;
    },
  },
  {
    url: "https://dummyjson.com/quotes/random",
    parse: (data) => {
      const text = typeof data.quote === "string" ? data.quote.trim() : "";
      const author =
        typeof data.author === "string" ? data.author.trim() : "Unknown";
      return text ? { text, author } : null;
    },
  },
];

async function fetchRandomQuote(): Promise<Quote> {
  for (const source of SOURCES) {
    try {
      const response = await fetch(source.url, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) continue;
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) continue;
      const quote = source.parse(data as Record<string, unknown>);
      if (quote) return quote;
    } catch {
      // try the next source
    }
  }
  throw new Error("No quote source available");
}

const dailyCache = new Map<string, Quote>();

export async function getDailyQuote(now: Date = new Date()): Promise<Quote> {
  const key = now.toISOString().slice(0, 10);
  const cached = dailyCache.get(key);
  if (cached) return cached;

  const quote = await fetchRandomQuote().catch(() => quoteForDate(now));
  dailyCache.set(key, quote);
  return quote;
}
