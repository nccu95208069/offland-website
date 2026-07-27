// 各月訂房進度（vs 去年同期同日）— 供 /api/admin/forward-booking（AI 助理總覽用）。
// 與水芳 sweetfun-web 的 computeForwardBooking 同構；Offland 差異：
//   - NT$0 招待（網紅）訂單計入「筆數」（有人住），但不進客單價/營收。
//   - 無手動月度統計表：去年最終 = 去年該月全部訂單數。
//   - 不揭露淨利比率（estNetProfit 一律 null，由前端隱藏該行）。

import type { OfflandBooking } from "./dashboard-utils";

export interface ForwardBookingMonth {
  year: number;
  month: number;
  booked: number;
  avgRoomFee: number | null;
  revenue: number;
  estNetProfit: number | null;
  lyByToday: number;
  lyTotal: number;
}

export function computeOfflandForwardBooking(
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
    const inMonth = (b: OfflandBooking, yy: number) =>
      b.checkIn.getFullYear() === yy && b.checkIn.getMonth() + 1 === m;

    const monthBookings = bookings.filter((b) => inMonth(b, y));
    const paid = monthBookings.filter((b) => b.amount > 0);
    const revenue = paid.reduce((s, b) => s + b.amount, 0);

    const lyBookings = bookings.filter((b) => inMonth(b, y - 1));
    const lyByToday = lyBookings.filter(
      (b) => b.bookingDate && b.bookingDate <= lyCutoff
    ).length;

    return {
      year: y,
      month: m,
      booked: monthBookings.length,
      avgRoomFee: paid.length > 0 ? Math.round(revenue / paid.length) : null,
      revenue,
      estNetProfit: null,
      lyByToday,
      lyTotal: lyBookings.length,
    };
  });
}
