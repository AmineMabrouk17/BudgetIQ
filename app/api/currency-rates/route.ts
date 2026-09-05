import { NextRequest, NextResponse } from "next/server";
import { getRatesForDisplay } from "@/lib/currency/rates";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const RATES_RATE_LIMIT = 30;
const RATES_RATE_WINDOW = 60;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  const rate = await rateLimit({
    prefix: "currency-rates",
    identifier: getClientIp(request),
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
