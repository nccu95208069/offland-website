// Offland 各月訂房進度 feed — 供 CEO 個人 AI 助理 dashboard 總覽頁。
// 認證同 /api/admin/dashboard：iron-session 或 Bearer OFFLAND_API_TOKEN。
import { NextResponse } from "next/server";
import { isAuthenticated, hasValidApiToken } from "@/lib/auth";
import { getOfflandSheetRows, SheetsError } from "@/lib/sheets";
import {
  parseOfflandNights,
  mergeOfflandBookings,
} from "@/lib/dashboard-utils";
import { computeOfflandForwardBooking } from "@/lib/forward-booking";

export const dynamic = "force-dynamic";

let cached: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

async function buildData() {
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
  const rows = await getOfflandSheetRows();
  const nights = parseOfflandNights(rows);
  const bookings = mergeOfflandBookings(nights);
  const now = new Date();
  const data = {
    asOf: new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei", month: "numeric", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(now),
    months: computeOfflandForwardBooking(nights, bookings, now),
  };
  cached = { data, timestamp: Date.now() };
  return data;
}

export async function GET(request: Request) {
  if (!(await isAuthenticated()) && !hasValidApiToken(request)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("refresh")) cached = null;
    return NextResponse.json({ success: true, data: await buildData() });
  } catch (error) {
    console.error("Error building offland forward booking:", error);
    if (error instanceof SheetsError) {
      return NextResponse.json({ success: false, error: "sheets_unavailable" }, { status: 502 });
    }
    return NextResponse.json({ success: false, error: "internal" }, { status: 500 });
  }
}
