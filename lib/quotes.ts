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
    text: "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, and trains to forethought.",
    author: "Margaret Oliphant",
  },
  {
    text: "Financial freedom is available to those who learn about it and work for it.",
    author: "Robert Kiyosaki",
  },
  {
    text: "Formal education will make you a living; self-education will make you a fortune.",
    author: "Jim Rohn",
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
    text: "Don't look for the needle in the haystack. Just buy the haystack!",
    author: "John Bogle",
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
    text: "Saving money is a great habit to have, but investing money is a great way to grow it.",
    author: "Unknown",
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

export function listQuotes(): Quote[] {
  return QUOTES;
}
