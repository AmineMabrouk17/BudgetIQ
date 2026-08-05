import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "BudgetIQ — Your money, finally under control.",
  description:
    "BudgetIQ is a free, open-source AI-powered personal finance app. Track income, expenses, and assets — and let the AI assistant log them straight from your words.",
  openGraph: {
    title: "BudgetIQ — Your money, finally under control.",
    description:
      "Track income, expenses, and assets with an AI assistant that logs transactions from natural language. Free, open source, no ads.",
    images: [{ url: "/logo-vertical-light.png", alt: "BudgetIQ" }],
  },
};
