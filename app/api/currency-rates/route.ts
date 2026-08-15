import { NextResponse } from "next/server";
import { getRatesForDisplay } from "@/lib/currency-rates";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await getRatesForDisplay();
  return NextResponse.json({ rates });
}
