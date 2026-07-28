// 各月訂房進度 — 以「賣出晚數」為主指標（CEO 2026-07-29 指定，公式對齊訂單主表工作表4）：
//   賣出晚數 = 該月「有收費」夜晚數（跨月連住按晚歸月；NT$0 招待晚另計 compNights，不算賣出——對帳 CEO 工作表4 確認）
//   平均客單 = 總收入 ÷ 賣出晚數
//   預估淨利 = 總收入 × 60%（Offland 係數，非水芳的 68%）
//   佔用率   = 賣出晚數 ÷ 當月天數
//   訂單組數 = 該月入住的訂單數（次要資訊）

import type { OfflandNight, OfflandBooking } from "./dashboard-utils";

const NET_PROFIT_RATIO = 0.6;

export interface ForwardBookingMonth {
  year: number;
  month: number;
  soldNights: number; // 有收費的晚數（賣出）
  compNights: number; // NT$0 招待晚
  bookingsCount: number;
  avgRoomFee: number | null;
  revenue: number;
  estNetProfit: number | null;
  occupancyPct: number; // 0–100，一位小數
  lyByToday: number; // 去年同月、去年今天前已訂晚數
  lyTotal: number; // 去年同月最終晚數
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function computeOfflandForwardBooking(
  nights: OfflandNight[],
  bookings: OfflandBooking[],
  today: Date
): ForwardBookingMonth[] {
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const lyCutoff = new Date(
    today.getFullYear() - 1, today.getMonth(), today.getDate(), 23, 59, 59
  );

  return Array.from({ length: 13 }, (_, i) => {
    const offset = i - 6;
    const m = ((((currentMonth - 1 + offset) % 12) + 12) % 12) + 1;
    const y = currentYear + Math.floor((currentMonth - 1 + offset) / 12);
    const inMonth = (d: Date, yy: number) =>
      d.getFullYear() === yy && d.getMonth() + 1 === m;

    const monthNights = nights.filter((n) => inMonth(n.night, y));
    const paid = monthNights.filter((n) => n.amount > 0);
    const soldNights = paid.length;
    const revenue = paid.reduce((s, n) => s + n.amount, 0);

    const lyNights = nights.filter((n) => inMonth(n.night, y - 1) && n.amount > 0);
    const lyByToday = lyNights.filter(
      (n) => n.bookingDate && n.bookingDate <= lyCutoff
    ).length;

    return {
      year: y,
      month: m,
      soldNights,
      compNights: monthNights.length - soldNights,
      bookingsCount: bookings.filter((b) => inMonth(b.checkIn, y)).length,
      avgRoomFee: soldNights > 0 ? Math.round(revenue / soldNights) : null,
      revenue,
      estNetProfit: soldNights > 0 ? Math.round(revenue * NET_PROFIT_RATIO) : null,
      occupancyPct: Math.round((soldNights / daysInMonth(y, m)) * 1000) / 10,
      lyByToday,
      lyTotal: lyNights.length,
    };
  });
}
