// /api/admin/forward-booking 核心計算（各月賣出晚數，CEO 2026-07-29 指定以晚為主）。
import { describe, it, expect } from "vitest";
import { computeOfflandForwardBooking } from "@/lib/forward-booking";
import type { OfflandNight, OfflandBooking } from "@/lib/dashboard-utils";

function night(date: string, amount: number, bookingDate?: string): OfflandNight {
  return {
    night: new Date(date),
    guestNameRaw: "測試",
    normName: "測試",
    platform: "官網",
    bookingDate: bookingDate ? new Date(bookingDate) : new Date("2026/05/01"),
    amount,
    headcount: null,
    note: "",
  };
}
function bk(checkIn: string, nights: number): OfflandBooking {
  return {
    checkIn: new Date(checkIn),
    nights,
  } as unknown as OfflandBooking;
}

const TODAY = new Date(2026, 6, 29); // 2026/7/29

describe("computeOfflandForwardBooking（晚數為主）", () => {
  it("13 個月（前6+當月+後6）", () => {
    const out = computeOfflandForwardBooking([], [], TODAY);
    expect(out.length).toBe(13);
    expect(out[6]).toMatchObject({ year: 2026, month: 7 });
  });

  it("soldNights = 該月有收費晚數（招待另計 compNights）；跨月連住按晚歸月", () => {
    const nights = [
      night("2026/08/31", 8000),
      night("2026/09/01", 8000), // 8/31 入住連兩晚 → 9 月只算 1 晚
      night("2026/09/10", 7000),
      night("2026/09/20", 0), // 招待
    ];
    const out = computeOfflandForwardBooking(nights, [], TODAY);
    const sep = out.find((m) => m.month === 9 && m.year === 2026)!;
    expect(sep.soldNights).toBe(2);
    expect(sep.compNights).toBe(1);
    const aug = out.find((m) => m.month === 8 && m.year === 2026)!;
    expect(aug.soldNights).toBe(1);
  });

  it("營收/客單/淨利/佔用率照 CEO 工作表4 公式：客單=營收÷晚數、淨利=營收×60%、佔用=晚數÷當月天數", () => {
    const nights = [
      night("2026/09/10", 7000),
      night("2026/09/11", 9000),
      night("2026/09/20", 0), // 招待晚：計晚數、不計營收（分母含招待晚，同 CEO 表）
    ];
    const out = computeOfflandForwardBooking(nights, [], TODAY);
    const sep = out.find((m) => m.month === 9)!;
    expect(sep.revenue).toBe(16000);
    expect(sep.avgRoomFee).toBe(8000); // 16000/2 收費晚
    expect(sep.estNetProfit).toBe(Math.round(16000 * 0.6));
    expect(sep.occupancyPct).toBe(Math.round((2 / 30) * 1000) / 10);
  });

  it("bookingsCount = 該月入住的訂單組數", () => {
    const out = computeOfflandForwardBooking([], [bk("2026/09/03", 2), bk("2026/09/10", 1)], TODAY);
    const sep = out.find((m) => m.month === 9)!;
    expect(sep.bookingsCount).toBe(2);
  });

  it("去年同日（晚）：去年該月夜晚中 bookingDate 早於「去年今天」者", () => {
    const nights = [
      night("2025/09/10", 8000, "2025/07/01"), // 去年今天(2025/7/29)前已訂 → 計入
      night("2025/09/11", 8000, "2025/08/15"), // 之後才訂 → 只進 lyTotal
    ];
    const out = computeOfflandForwardBooking(nights, [], TODAY);
    const sep = out.find((m) => m.month === 9 && m.year === 2026)!;
    expect(sep.lyByToday).toBe(1);
    expect(sep.lyTotal).toBe(2);
  });

  it("無資料月份 → 0/null", () => {
    const out = computeOfflandForwardBooking([], [], TODAY);
    expect(out[6].soldNights).toBe(0);
    expect(out[6].avgRoomFee).toBeNull();
    expect(out[6].revenue).toBe(0);
  });
});
