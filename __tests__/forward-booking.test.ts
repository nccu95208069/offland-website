// /api/admin/forward-booking 核心計算（各月訂房進度）。
import { describe, it, expect } from "vitest";
import { computeOfflandForwardBooking } from "@/lib/forward-booking";
import type { OfflandBooking } from "@/lib/dashboard-utils";

function bk(checkIn: string, amount: number, bookingDate?: string): OfflandBooking {
  return {
    guest: "測試",
    room: "包棟",
    checkIn: new Date(checkIn),
    checkOut: new Date(checkIn),
    nights: 1,
    amount,
    bookingDate: bookingDate ? new Date(bookingDate) : new Date("2026/05/01"),
    platform: "官網",
    comp: amount === 0,
  } as unknown as OfflandBooking;
}

const TODAY = new Date(2026, 6, 28); // 2026/7/28

describe("computeOfflandForwardBooking", () => {
  it("13 個月（前6+當月+後6）", () => {
    const out = computeOfflandForwardBooking([], TODAY);
    expect(out.length).toBe(13);
    expect(out[6]).toMatchObject({ year: 2026, month: 7 });
  });

  it("筆數含 NT$0 招待；客單價/營收只算有收費的", () => {
    const out = computeOfflandForwardBooking(
      [bk("2026/07/05", 15000), bk("2026/07/12", 22000), bk("2026/07/20", 0)],
      TODAY
    );
    const jul = out.find((m) => m.month === 7 && m.year === 2026)!;
    expect(jul.booked).toBe(3);
    expect(jul.revenue).toBe(37000);
    expect(jul.avgRoomFee).toBe(18500);
  });

  it("去年同日：去年該月訂單中 bookingDate 早於「去年今天」者", () => {
    const out = computeOfflandForwardBooking(
      [
        bk("2025/07/10", 15000, "2025/07/01"), // 去年今天(2025/7/28)前已訂 → 計入
        bk("2025/07/20", 15000, "2025/07/30"), // 去年今天後才訂 → 不計 byToday、計 total
      ],
      TODAY
    );
    const jul = out.find((m) => m.month === 7 && m.year === 2026)!;
    expect(jul.lyByToday).toBe(1);
    expect(jul.lyTotal).toBe(2);
  });

  it("無資料月份 → 0/null", () => {
    const out = computeOfflandForwardBooking([], TODAY);
    expect(out[6].booked).toBe(0);
    expect(out[6].avgRoomFee).toBeNull();
    expect(out[6].revenue).toBe(0);
  });
});
