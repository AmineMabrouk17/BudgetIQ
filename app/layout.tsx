import type { Metadata } from "next";
import { Hanken_Grotesk, Young_Serif } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { metadata as siteMetadata } from "./metadata";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get("theme")?.value;
  const dataTheme =
    storedTheme === "dark" || storedTheme === "light" ? storedTheme : undefined;

  return (
    <html
      lang="en"
      data-theme={dataTheme}
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${youngSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
