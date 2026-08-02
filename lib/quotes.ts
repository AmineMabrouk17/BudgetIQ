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

type QuoteSource = (data: unknown) => Quote | null;

function parseQuoteRecord(record: Record<string, unknown>): Quote | null {
  const text = typeof record.content === "string" ? record.content.trim() : "";
  const author =
    typeof record.author === "string" ? record.author.trim() : "Unknown";
  return text ? { text, author } : null;
}

function parseQuoteOfDay(data: unknown): Quote | null {
  if (Array.isArray(data)) {
    const record = data[0];
    if (typeof record !== "object" || record === null) return null;
    const r = record as Record<string, unknown>;
    const text = typeof r.quote === "string" ? r.quote.trim() : "";
    const author = typeof r.author === "string" ? r.author.trim() : "Unknown";
    return text ? { text, author } : null;
  }
  return null;
}

const SOURCES: { url: string; headers?: Record<string, string>; parse: QuoteSource }[] = [
  {
    url: "https://api.api-ninjas.com/v2/quoteoftheday",
    headers: { "X-Api-Key": process.env.API_NINJAS_API_KEY ?? "" },
    parse: parseQuoteOfDay,
  },
  {
    url: "https://api.quotable.io/quotes/random?tags=business",
    parse: (data) => {
      if (Array.isArray(data)) return parseQuoteRecord(data[0] ?? {});
      if (typeof data === "object" && data !== null) {
        return parseQuoteRecord(data as Record<string, unknown>);
      }
      return null;
    },
  },
  {
    url: "https://dummyjson.com/quotes/random",
    parse: (data) => {
      if (typeof data !== "object" || data === null) return null;
      const record = data as Record<string, unknown>;
      const text = typeof record.quote === "string" ? record.quote.trim() : "";
      const author =
        typeof record.author === "string" ? record.author.trim() : "Unknown";
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
        headers: {
          "Content-Type": "application/json",
          ...(source.headers ?? {}),
        },
      });
      if (!response.ok) continue;
      const data: unknown = await response.json();
      const quote = source.parse(data);
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
