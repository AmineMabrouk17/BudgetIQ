import { NextResponse } from "next/server";
import { quoteForDate } from "@/lib/quotes";

export const runtime = "nodejs";

export const revalidate = 86_400;

export function GET() {
  return NextResponse.json(quoteForDate());
}
