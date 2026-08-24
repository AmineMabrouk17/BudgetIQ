import type { Metadata } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { metadata as siteMetadata } from "./metadata";
import AntiInspect from "@/components/AntiInspect";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}
    >
      <body>
        {children}
        <AntiInspect />
      </body>
    </html>
  );
}
