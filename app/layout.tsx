import type { Metadata } from "next";
import { Archivo, Geist, Instrument_Serif } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { metadata as siteMetadata } from "./metadata";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
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
      className={`${geist.variable} ${archivo.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
