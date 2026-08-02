import { NextResponse } from "next/server";
import { getDailyQuote } from "@/lib/quotes";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const quote = await getDailyQuote();
  return NextResponse.json(quote);
}
