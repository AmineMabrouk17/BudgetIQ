import { NextRequest, NextResponse } from "next/server";
import { getRatesForDisplay } from "@/lib/currency/rates";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/client-ip";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const RATES_RATE_LIMIT = 30;
const RATES_RATE_WINDOW = 60;

export async function GET(request: NextRequest) {
  const rate = await rateLimit({
    prefix: "currency-rates",
    identifier: getClientIpFromRequest(request),
    limit: RATES_RATE_LIMIT,
    window: RATES_RATE_WINDOW,
  });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const rates = await getRatesForDisplay();
  return NextResponse.json({ rates });
}
