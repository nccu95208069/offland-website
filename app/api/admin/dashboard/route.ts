// Offland 晨報頁資料 API。Spec: docs/specs/admin-dashboard.md §4。
//   - Auth guard 最先執行、在 cache/fetch 之前：iron-session isAuthenticated()。
//     未登入絕不回傳今晚客名/人數/備註/營收判讀，也不觸發 sheets 讀取。
//   - 5 分鐘 module-scope in-memory cache；?refresh=1 清 cache。不 cache 401、不 cache 錯誤。
//   - 唯讀 工作表1!A2:N；「今天」以台北時間計（server 是 UTC）。
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { isAuthenticated } from "@/lib/auth";
import { getOfflandSheetRows, SheetsError } from "@/lib/sheets";
import {
  parseOfflandNights,
  mergeOfflandBookings,
  computeOffland,
  taipeiToday,
  type OfflandData,
} from "@/lib/dashboard-utils";

export const dynamic = "force-dynamic";

let cachedData: { data: OfflandData; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

async function buildOfflandData(): Promise<OfflandData> {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  const rows = await getOfflandSheetRows();
  const nights = parseOfflandNights(rows);
  const bookings = mergeOfflandBookings(nights);
  const now = new Date();
  const asOf = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const data = computeOffland(bookings, nights, taipeiToday(now), asOf);
  cachedData = { data, timestamp: Date.now() };
  return data;
}

/** 伺服器對伺服器認證（如 Super Molly PWA）：Authorization: Bearer <OFFLAND_API_TOKEN>。
 * 常數時間比對；未設 token 一律 false（不會意外全開）。 */
function hasValidApiToken(request: Request): boolean {
  const token = process.env.OFFLAND_API_TOKEN;
  if (!token) return false;
  const auth = request.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  // Auth 在 cache/fetch 之前：未登入且無有效 token → 絕不洩漏營運數據、不打 sheets。
  // 允許兩種身分：管理員 iron-session（瀏覽器）或 Bearer OFFLAND_API_TOKEN（伺服器對伺服器）。
  if (!(await isAuthenticated()) && !hasValidApiToken(request)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("refresh")) cachedData = null;
    const data = await buildOfflandData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error building offland dashboard data:", error);
    if (error instanceof SheetsError) {
      return NextResponse.json({ success: false, error: "sheets_unavailable" }, { status: 502 });
    }
    return NextResponse.json({ success: false, error: "internal" }, { status: 500 });
  }
}
