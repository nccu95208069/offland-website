import { describe, it, expect } from "vitest";
import {
  parseOfflandNights,
  mergeOfflandBookings,
  normName,
  computeOffland,
  taipeiToday,
  parseSlashDate,
  parseAmount,
  normPlatform,
  OFFLAND_PLATFORM_DROP_PP,
  OFFLAND_NEXT7_EMPTY_THRESHOLD,
  OFFLAND_NEXT14_EMPTY_THRESHOLD,
  OFFLAND_LEAD_SHORT_DAYS,
  type OfflandNight,
  type OfflandBooking,
} from "@/lib/dashboard-utils";

// ─── fixtures ───────────────────────────────────────────────────
// today = 2026/7/13（週一）。future 7 晚 = 7/14…7/20，其中週末晚 = 週五 7/17、週六 7/18。
// 所有日期以 local-midnight Date 表示，與 sheet 解析一致。
const TODAY = new Date(2026, 6, 13);

function day(m: number, d: number, y = 2026): Date {
  return new Date(y, m - 1, d);
}
function addDaysT(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 新表 A2:N raw row（14 欄）
interface RowOpts {
  room?: string;
  name?: string;
  platform?: string;
  checkIn?: string;
  checkOut?: string;
  booking?: string;
  amount?: string;
  note?: string;
  headcount?: string;
}
function row(o: RowOpts = {}): string[] {
  const {
    room = "OFFLAND",
    name = "王小明",
    platform = "Agoda",
    checkIn = "2026/7/14",
    checkOut = "2026/7/15",
    booking = "2026/7/1",
    amount = "NT$8,000",
    note = "",
    headcount = "",
  } = o;
  // A       B     C         D        E         F        G       H   I   J      K     L          M   N
  return [room, name, platform, checkIn, checkOut, booking, amount, "", "", "uid", note, headcount, "", ""];
}

function mkBooking(over: Partial<OfflandBooking> = {}): OfflandBooking {
  const checkIn = over.checkIn ?? day(7, 14);
  const nights = over.nights ?? 1;
  const amount = over.amount ?? 8000;
  const base: OfflandBooking = {
    guestName: "王小明",
    normName: "王小明",
    platform: "Agoda",
    checkIn,
    checkOut: addDaysT(checkIn, nights),
    nights,
    amount,
    bookingDate: day(7, 1),
    headcount: null,
    notes: [],
    comp: amount === 0,
  };
  return { ...base, ...over };
}

// ─── parseOfflandNights ─────────────────────────────────────────
describe("parseOfflandNights", () => {
  it("解析單列為單晚，NT$ 千分位金額轉整數", () => {
    const [n] = parseOfflandNights([row({ amount: "NT$6,400", checkIn: "2026/1/17", checkOut: "2026/1/18" })]);
    expect(n.night).toEqual(day(1, 17));
    expect(n.amount).toBe(6400);
  });

  it("NT$0 網紅列必須保留（與水芳 amount<=0 丟棄的關鍵分歧）", () => {
    const nights = parseOfflandNights([row({ amount: "NT$0", name: "網紅客" })]);
    expect(nights).toHaveLength(1);
    expect(nights[0].amount).toBe(0);
  });

  it("L 欄「6人」→ 6；缺 L → null", () => {
    const [withL] = parseOfflandNights([row({ headcount: "6人" })]);
    expect(withL.headcount).toBe(6);
    const [noL] = parseOfflandNights([row({ headcount: "" })]);
    expect(noL.headcount).toBeNull();
  });

  it("非 OFFLAND 開頭的列（大小寫不敏感）跳過，OFFLAND(連住) 保留", () => {
    const nights = parseOfflandNights([
      row({ room: "101", name: "水芳客" }),
      row({ room: "水芳", name: "別的房" }),
      row({ room: "offland", name: "小寫也算" }),
      row({ room: "OFFLAND(連住)", name: "連住標記" }),
    ]);
    expect(nights.map((n) => n.guestNameRaw).sort()).toEqual(["小寫也算", "連住標記"]);
  });

  it("D 入住日期無效 → 整列跳過", () => {
    const nights = parseOfflandNights([
      row({ checkIn: "not-a-date", name: "壞日期" }),
      row({ checkIn: "2026/7/14", name: "好日期" }),
    ]);
    expect(nights).toHaveLength(1);
    expect(nights[0].guestNameRaw).toBe("好日期");
  });

  it("短列（只有 10 欄）不炸，缺欄防禦性取值", () => {
    const short = ["OFFLAND", "短列客", "LINE", "2026/7/14", "2026/7/15", "2026/7/1", "NT$5,000", "", "", "uid"];
    const nights = parseOfflandNights([short]);
    expect(nights).toHaveLength(1);
    expect(nights[0].headcount).toBeNull();
    expect(nights[0].note).toBe("");
  });

  it("多晚列展開為多個 OfflandNight，金額平均分攤取整", () => {
    const nights = parseOfflandNights([
      row({ checkIn: "2026/7/14", checkOut: "2026/7/16", amount: "NT$16,000" }),
    ]);
    expect(nights).toHaveLength(2);
    expect(nights.map((n) => iso(n.night))).toEqual(["2026-07-14", "2026-07-15"]);
    expect(nights.every((n) => n.amount === 8000)).toBe(true);
  });

  it("退房 ≤ 入住 視為 1 晚", () => {
    const nights = parseOfflandNights([row({ checkIn: "2026/7/14", checkOut: "2026/7/14" })]);
    expect(nights).toHaveLength(1);
    expect(nights[0].night).toEqual(day(7, 14));
  });

  it("去重：同 normName＋platform＋night 兩列 → 留第一筆（大小寫不敏感）", () => {
    const nights = parseOfflandNights([
      row({ name: "Lim Lecindra", platform: "Airbnb", amount: "NT$8,000" }),
      row({ name: "LIM LECINDRA", platform: "Airbnb", amount: "NT$9,999" }),
    ]);
    expect(nights).toHaveLength(1);
    expect(nights[0].amount).toBe(8000);
  });
});

// ─── normName ───────────────────────────────────────────────────
describe("normName", () => {
  it("刪除半形括號註記後相等", () => {
    expect(normName("YUN CHIH CHEN(LINE)")).toBe(normName("YUN CHIH CHEN"));
    expect(normName("YUN CHIH CHEN(LINE)")).toBe("yun chih chen");
  });
  it("刪除全形括號與 (連住)/(+床) 註記", () => {
    expect(normName("王 卓菁（連住）")).toBe(normName("王 卓菁"));
    expect(normName("王 卓菁(連住)")).toBe("王 卓菁");
    expect(normName("魏 子堯(+床)")).toBe("魏 子堯");
  });
  it("大小寫不敏感、空白正規化", () => {
    expect(normName("  Lim   Lecindra ")).toBe("lim lecindra");
  });
});

// ─── mergeOfflandBookings ───────────────────────────────────────
describe("mergeOfflandBookings", () => {
  it("無標記的連續兩晚（金額不同）→ 1 組、amount 加總、nights=2", () => {
    const nights = parseOfflandNights([
      row({ name: "Chu Jesse", checkIn: "2026/7/14", checkOut: "2026/7/15", amount: "NT$8,000" }),
      row({ name: "Chu Jesse", checkIn: "2026/7/15", checkOut: "2026/7/16", amount: "NT$9,000" }),
    ]);
    const [b] = mergeOfflandBookings(nights);
    expect(mergeOfflandBookings(nights)).toHaveLength(1);
    expect(b.nights).toBe(2);
    expect(b.amount).toBe(17000);
    expect(b.checkIn).toEqual(day(7, 14));
    expect(b.checkOut).toEqual(day(7, 16));
  });

  it("(連住) 標記列同樣併組（不依賴標記，靠日期相鄰）", () => {
    const nights = parseOfflandNights([
      row({ name: "王 卓菁(連住)", checkIn: "2026/7/14", checkOut: "2026/7/15" }),
      row({ name: "王 卓菁", checkIn: "2026/7/15", checkOut: "2026/7/16" }),
    ]);
    expect(mergeOfflandBookings(nights)).toHaveLength(1);
  });

  it("三晚亂序輸入（Sandford Kelly 型）→ 1 組 3 晚", () => {
    const nights = parseOfflandNights([
      row({ name: "Sandford Kelly", checkIn: "2026/7/16", checkOut: "2026/7/17" }),
      row({ name: "Sandford Kelly", checkIn: "2026/7/14", checkOut: "2026/7/15" }),
      row({ name: "Sandford Kelly", checkIn: "2026/7/15", checkOut: "2026/7/16" }),
    ]);
    const bookings = mergeOfflandBookings(nights);
    expect(bookings).toHaveLength(1);
    expect(bookings[0].nights).toBe(3);
    expect(bookings[0].checkIn).toEqual(day(7, 14));
  });

  it("同名但不連續（中間有空晚）→ 2 組", () => {
    const nights = parseOfflandNights([
      row({ name: "HUANG HSIUHUI", checkIn: "2026/6/17", checkOut: "2026/6/18" }),
      row({ name: "HUANG HSIUHUI", checkIn: "2026/11/16", checkOut: "2026/11/17" }),
    ]);
    expect(mergeOfflandBookings(nights)).toHaveLength(2);
  });

  it("同名、同一晚、不同平台 → 不併（2 組）", () => {
    const nights = parseOfflandNights([
      row({ name: "同名客", platform: "Agoda", checkIn: "2026/7/14", checkOut: "2026/7/15" }),
      row({ name: "同名客", platform: "Airbnb", checkIn: "2026/7/15", checkOut: "2026/7/16" }),
    ]);
    expect(mergeOfflandBookings(nights)).toHaveLength(2);
  });

  it("bookingDate 取組內最早，headcount 取第一個非 null，notes 去重", () => {
    const nights = parseOfflandNights([
      row({ name: "Fan Ming Hui", checkIn: "2026/7/14", checkOut: "2026/7/15", booking: "2026/7/2", note: "網紅", headcount: "" }),
      row({ name: "Fan Ming Hui", checkIn: "2026/7/15", checkOut: "2026/7/16", booking: "2026/7/1", note: "網紅", headcount: "6人" }),
    ]);
    const [b] = mergeOfflandBookings(nights);
    expect(b.bookingDate).toEqual(day(7, 1));
    expect(b.headcount).toBe(6);
    expect(b.notes).toEqual(["網紅"]);
  });

  it("NT$0 組 → comp=true", () => {
    const nights = parseOfflandNights([row({ name: "網紅客", amount: "NT$0" })]);
    const [b] = mergeOfflandBookings(nights);
    expect(b.comp).toBe(true);
    expect(b.amount).toBe(0);
  });
});

// ─── computeOffland: comp（NT$0 網紅）────────────────────────────
describe("computeOffland — comp (NT$0 招待)", () => {
  it("NT$0 組：檔期該晚 booked=true comp=true、營收計 0、orders 計 1", () => {
    // 招待組今晚（7/13）入住 → tonight & strip 今晚格
    const comp = mkBooking({
      normName: "網紅",
      guestName: "網紅客",
      platform: "LINE",
      checkIn: TODAY,
      nights: 1,
      amount: 0,
      bookingDate: day(7, 10), // 落在 last7 接單窗
    });
    const data = computeOffland([comp], [], TODAY);
    const tonightCell = data.strip.nights.find((s) => s.date === iso(TODAY))!;
    expect(tonightCell.booked).toBe(true);
    expect(tonightCell.comp).toBe(true);
    expect(data.today.tonight.occupied).toBe(true);
    expect(data.today.tonight.comp).toBe(true);
    // 營收面：last7 金額 0，但 orders 計 1
    expect(data.last7.amount).toBe(0);
    expect(data.last7.orders).toBe(1);
  });
});

// ─── computeOffland: 時間窗 ─────────────────────────────────────
describe("computeOffland — 時間窗", () => {
  it("strip 為 today-6…today+7 共 14 晚", () => {
    const data = computeOffland([], [], TODAY);
    expect(data.strip.nights).toHaveLength(14);
    expect(data.strip.nights[0].date).toBe("2026-07-07");
    expect(data.strip.nights[13].date).toBe("2026-07-20");
  });

  it("strip 標記今晚 phase=today、過去 phase=past、未來 phase=future", () => {
    const data = computeOffland([], [], TODAY);
    expect(data.strip.nights.find((s) => s.date === "2026-07-13")!.phase).toBe("today");
    expect(data.strip.nights.find((s) => s.date === "2026-07-12")!.phase).toBe("past");
    expect(data.strip.nights.find((s) => s.date === "2026-07-14")!.phase).toBe("future");
  });

  it("週末晚（週五=5、週六=6）isWeekend=true，其餘 false", () => {
    const data = computeOffland([], [], TODAY);
    const fri = data.strip.nights.find((s) => s.date === "2026-07-17")!;
    const sat = data.strip.nights.find((s) => s.date === "2026-07-18")!;
    const sun = data.strip.nights.find((s) => s.date === "2026-07-19")!;
    expect(fri.isWeekend).toBe(true);
    expect(sat.isWeekend).toBe(true);
    expect(sun.isWeekend).toBe(false);
  });

  it("daily14 為結尾昨天的 14 天", () => {
    const data = computeOffland([], [], TODAY);
    expect(data.last7.daily14).toHaveLength(14);
    expect(data.last7.daily14[0].date).toBe("2026-06-29");
    expect(data.last7.daily14[13].date).toBe("2026-07-12");
  });

  it("last7/prev7 接單窗界定正確", () => {
    const data = computeOffland([], [], TODAY);
    expect(data.last7.from).toBe("2026-07-06");
    expect(data.last7.to).toBe("2026-07-12");
  });

  it("taipeiToday：UTC 深夜換算成台北隔天", () => {
    // 16:00Z = 台北 00:00 隔天
    expect(taipeiToday(new Date("2026-07-13T16:30:00Z"))).toEqual(day(7, 14));
    expect(taipeiToday(new Date("2026-07-13T15:00:00Z"))).toEqual(day(7, 13));
  });
});

// ─── computeOffland: occupancy ──────────────────────────────────
describe("computeOffland — occupancy", () => {
  it("next7/next14 booked/empty 計數正確", () => {
    // 未來 7 晚 = 7/14…7/20；訂 7/14、7/15（2 晚）→ next7Empty=5
    const b = mkBooking({ checkIn: day(7, 14), nights: 2, bookingDate: day(7, 1) });
    const data = computeOffland([b], [], TODAY);
    expect(data.occupancy.next7Booked).toBe(2);
    expect(data.occupancy.next7Empty).toBe(5);
    expect(data.occupancy.next14Booked).toBe(2);
    expect(data.occupancy.next14Empty).toBe(12);
  });

  it("weekendEmptyNext7 只含未來 7 晚中仍空的週五/週六晚", () => {
    // 訂週五 7/17（一晚）→ weekendEmptyNext7 只剩週六 7/18
    const b = mkBooking({ checkIn: day(7, 17), nights: 1, bookingDate: day(7, 1) });
    const data = computeOffland([b], [], TODAY);
    expect(data.occupancy.weekendEmptyNext7).toEqual(["2026-07-18"]);
  });

  it("週末全訂滿 → weekendEmptyNext7 為空", () => {
    const fri = mkBooking({ normName: "五", checkIn: day(7, 17), nights: 1 });
    const sat = mkBooking({ normName: "六", checkIn: day(7, 18), nights: 1 });
    const data = computeOffland([fri, sat], [], TODAY);
    expect(data.occupancy.weekendEmptyNext7).toEqual([]);
  });
});

// ─── computeOffland: verdict ────────────────────────────────────
describe("computeOffland — verdict", () => {
  const last7Booking = (amount: number, name: string) =>
    mkBooking({ normName: name, guestName: name, amount, bookingDate: day(7, 8), checkIn: day(8, 1) });
  const prev7Booking = (amount: number, name: string) =>
    mkBooking({ normName: name, guestName: name, amount, bookingDate: day(7, 1), checkIn: day(8, 2) });

  it("prev7=0 且 last7=0 → quiet", () => {
    const data = computeOffland([], [], TODAY);
    expect(data.verdict.level).toBe("quiet");
  });

  it("prev7=0 且 last7>0 → up", () => {
    const data = computeOffland([last7Booking(10000, "a")], [], TODAY);
    expect(data.verdict.level).toBe("up");
  });

  it("變化 ≥ +15% → up（邊界）", () => {
    // prev 10000 → last 11500 = +15%
    const data = computeOffland([prev7Booking(10000, "p"), last7Booking(11500, "c")], [], TODAY);
    expect(data.verdict.level).toBe("up");
  });

  it("變化 ≤ −15% → down（邊界）", () => {
    // prev 10000 → last 8500 = -15%
    const data = computeOffland([prev7Booking(10000, "p"), last7Booking(8500, "c")], [], TODAY);
    expect(data.verdict.level).toBe("down");
  });

  it("變化在 ±15% 之間 → flat", () => {
    const data = computeOffland([prev7Booking(10000, "p"), last7Booking(10500, "c")], [], TODAY);
    expect(data.verdict.level).toBe("flat");
  });
});

// ─── computeOffland: actions（7 條規則）─────────────────────────
describe("computeOffland — actions", () => {
  // helper：塞滿今晚起未來所有晚，讓 occupancy 規則不誤觸。
  // bookingDate 刻意放在 last7/prev7 窗之外（6/1），只影響佔用、不污染接單統計/verdict。
  const OUTSIDE = day(6, 1);
  function fillFuture(fromOffset: number, count: number, name = "占位"): OfflandBooking[] {
    return Array.from({ length: count }, (_, i) =>
      mkBooking({ normName: `${name}${i}`, checkIn: addDaysT(TODAY, fromOffset + i), nights: 1, bookingDate: OUTSIDE })
    );
  }

  it("規則1 act：今晚空檔（!tonight.occupied）", () => {
    // 今晚（7/13）沒人 → 觸發；填滿 7/14..7/27 以避開其他規則
    const data = computeOffland(fillFuture(1, 14), [], TODAY);
    expect(data.actions.some((a) => a.level === "act" && a.title.includes("今晚"))).toBe(true);
  });

  it("規則1 不觸發：今晚已訂", () => {
    // 今晚有人 + 填滿未來
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1 });
    const data = computeOffland([tonight, ...fillFuture(1, 14)], [], TODAY);
    expect(data.actions.some((a) => a.title.includes("今晚 Offland 空檔"))).toBe(false);
  });

  it("規則2 act：週末未來 7 晚有空", () => {
    // 今晚有人、未來大致有訂但週末留空
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1 });
    const data = computeOffland([tonight, ...fillFuture(1, 3)], [], TODAY); // 7/14,15,16 訂，週末空
    const act2 = data.actions.find((a) => a.title.includes("本週末"));
    expect(act2).toBeDefined();
    expect(act2!.level).toBe("act");
  });

  it("規則3 act：平台金額佔比掉 ≥10pp（邊界 deltaPp=-10）", () => {
    // prev7：Agoda 6000 + Booking.com 4000（Agoda 60%）
    // last7：Agoda 5000 + Booking.com 5000（Agoda 50%）→ deltaPp = -10
    const bookings = [
      mkBooking({ normName: "p1", platform: "Agoda", amount: 6000, bookingDate: day(7, 1), checkIn: day(8, 1) }),
      mkBooking({ normName: "p2", platform: "Booking.com", amount: 4000, bookingDate: day(7, 1), checkIn: day(8, 2) }),
      mkBooking({ normName: "c1", platform: "Agoda", amount: 5000, bookingDate: day(7, 8), checkIn: day(8, 3) }),
      mkBooking({ normName: "c2", platform: "Booking.com", amount: 5000, bookingDate: day(7, 8), checkIn: day(8, 4) }),
      ...fillFuture(0, 15), // 今晚+未來填滿，避開佔用類規則
    ];
    const data = computeOffland(bookings, [], TODAY);
    expect(data.actions.some((a) => a.title.includes("Agoda") && a.level === "act")).toBe(true);
  });

  it("規則3 不觸發：平台佔比只掉 5pp（> -10）", () => {
    const bookings = [
      mkBooking({ normName: "p1", platform: "Agoda", amount: 5500, bookingDate: day(7, 1), checkIn: day(8, 1) }),
      mkBooking({ normName: "p2", platform: "Booking.com", amount: 4500, bookingDate: day(7, 1), checkIn: day(8, 2) }),
      mkBooking({ normName: "c1", platform: "Agoda", amount: 5000, bookingDate: day(7, 8), checkIn: day(8, 3) }),
      mkBooking({ normName: "c2", platform: "Booking.com", amount: 5000, bookingDate: day(7, 8), checkIn: day(8, 4) }),
      ...fillFuture(0, 15),
    ];
    const data = computeOffland(bookings, [], TODAY);
    expect(data.actions.some((a) => a.title.includes("Agoda"))).toBe(false);
  });

  it("規則4 watch：next7Empty=5（邊界）＋臨訂脈絡（lead≤3）", () => {
    // 今晚有人；未來 7 晚只訂 2（7/14,15）→ next7Empty=5
    // last7 有一筆 lead=2（checkIn 7/14 - booking 7/12）
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1, bookingDate: day(7, 12) });
    const twoNights = mkBooking({ normName: "未來客", checkIn: day(7, 14), nights: 2, bookingDate: day(7, 12) });
    const data = computeOffland([tonight, twoNights], [], TODAY);
    const act4 = data.actions.find((a) => a.title.includes("未來 7 晚"));
    expect(act4).toBeDefined();
    expect(act4!.level).toBe("watch");
    expect(act4!.evidence).toContain("補單空間");
  });

  it("規則4 lead>3 → 提前優惠脈絡", () => {
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1, bookingDate: day(6, 1) });
    const twoNights = mkBooking({ normName: "未來客", checkIn: day(7, 14), nights: 2, bookingDate: day(6, 1) });
    const data = computeOffland([tonight, twoNights], [], TODAY);
    const act4 = data.actions.find((a) => a.title.includes("未來 7 晚"))!;
    expect(act4.evidence).toContain("提前優惠");
  });

  it("規則5 watch：規則4 未觸發但 next14Empty≥11（邊界=11）", () => {
    // next7 訂滿（7/14..7/20 = 7 晚）→ 規則4 不觸發（next7Empty=0）
    // next14 訂 3 晚 → next14Empty=11
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1 });
    const next3 = mkBooking({ normName: "未來客", checkIn: day(7, 14), nights: 3, bookingDate: day(7, 1) });
    const data = computeOffland([tonight, next3], [], TODAY);
    expect(data.occupancy.next7Empty).toBeLessThan(OFFLAND_NEXT7_EMPTY_THRESHOLD);
    expect(data.occupancy.next14Empty).toBe(11);
    expect(data.actions.some((a) => a.title.includes("未來兩週") && a.level === "watch")).toBe(true);
  });

  it("規則6 ok：verdict≠down 且今晚有客 → 不需調降", () => {
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1, bookingDate: OUTSIDE });
    const data = computeOffland([tonight, ...fillFutureAll()], [], TODAY);
    expect(data.actions.some((a) => a.level === "ok" && a.title.includes("不需調降"))).toBe(true);
  });

  it("規則7 ok：規則1–5 全未觸發 → 沒有需要處理的異常", () => {
    const tonight = mkBooking({ normName: "今晚客", checkIn: TODAY, nights: 1, bookingDate: OUTSIDE });
    const data = computeOffland([tonight, ...fillFutureAll()], [], TODAY);
    expect(data.actions.some((a) => a.title.includes("沒有需要處理的異常"))).toBe(true);
  });

  // 填滿今晚後未來 14 晚（7/14..7/27），避開所有佔用類規則
  function fillFutureAll(): OfflandBooking[] {
    return Array.from({ length: 14 }, (_, i) =>
      mkBooking({ normName: `占位${i}`, checkIn: addDaysT(TODAY, 1 + i), nights: 1, bookingDate: OUTSIDE })
    );
  }
});

// ─── computeOffland: yesterday / today / detail / summaryText ────
describe("computeOffland — 昨日/今日/明細/摘要", () => {
  it("昨晚住宿面：occupied、guestName、comp、revenue（per-night 加總）", () => {
    const yesterday = new Date(2026, 6, 12);
    const b = mkBooking({ normName: "昨晚客", guestName: "昨晚客(LINE)", checkIn: yesterday, nights: 1, amount: 7000 });
    const night: OfflandNight = {
      night: yesterday,
      guestNameRaw: "昨晚客(LINE)",
      normName: "昨晚客",
      platform: "Agoda",
      bookingDate: day(7, 1),
      amount: 7000,
      headcount: null,
      note: "",
    };
    const data = computeOffland([b], [night], TODAY);
    expect(data.yesterday.lastNight.occupied).toBe(true);
    expect(data.yesterday.lastNight.guestName).toBe("昨晚客(LINE)");
    expect(data.yesterday.lastNight.revenue).toBe(7000);
  });

  it("今日入住卡帶出人數、住幾晚、金額、備註原文、comp", () => {
    const b = mkBooking({
      normName: "今日客",
      guestName: "今日客",
      checkIn: TODAY,
      nights: 2,
      amount: 0,
      headcount: 6,
      notes: ["網紅", "未成年"],
    });
    const data = computeOffland([b], [], TODAY);
    expect(data.today.checkIns).toHaveLength(1);
    const ci = data.today.checkIns[0];
    expect(ci.headcount).toBe(6);
    expect(ci.nights).toBe(2);
    expect(ci.comp).toBe(true);
    expect(ci.notes).toEqual(["網紅", "未成年"]);
  });

  it("upcoming：checkIn 嚴格在今天之後的組", () => {
    const future = mkBooking({ normName: "未來客", checkIn: day(7, 20), nights: 1 });
    const today = mkBooking({ normName: "今日客", checkIn: TODAY, nights: 1 });
    const data = computeOffland([future, today], [], TODAY);
    expect(data.upcoming.orders).toBe(1);
  });

  it("summaryText 非空且含今晚狀態", () => {
    const data = computeOffland([mkBooking({ checkIn: TODAY, nights: 1 })], [], TODAY);
    expect(data.summaryText.length).toBeGreaterThan(0);
    expect(data.summaryText).toContain("今晚");
  });

  it("meta 帶 rowCount / bookingCount", () => {
    const b = mkBooking({ checkIn: TODAY, nights: 1 });
    const data = computeOffland([b], [], TODAY, "09:00");
    expect(data.meta.bookingCount).toBe(1);
    expect(data.today.asOf).toBe("09:00");
    expect(data.timezone).toBe("Asia/Taipei");
  });
});

// ─── 常數哨兵（adversarial 改壞會被這些邊界測試抓到）──────────────
describe("規則常數", () => {
  it("閾值常數維持 spec 定義值", () => {
    expect(OFFLAND_PLATFORM_DROP_PP).toBe(-10);
    expect(OFFLAND_NEXT7_EMPTY_THRESHOLD).toBe(5);
    expect(OFFLAND_NEXT14_EMPTY_THRESHOLD).toBe(11);
    expect(OFFLAND_LEAD_SHORT_DAYS).toBe(3);
  });
});

// ─── 內聯 helper 直測（搬家時從水芳模組內聯進本檔，補其直接單元測試）────
describe("parseSlashDate（內聯 helper）", () => {
  it("`2026/1/17` → local-midnight Date", () => {
    expect(parseSlashDate("2026/1/17")).toEqual(day(1, 17));
  });
  it("補零格式 `2026/01/07` 亦可", () => {
    expect(parseSlashDate("2026/01/07")).toEqual(day(1, 7));
  });
  it("前後空白容忍", () => {
    expect(parseSlashDate("  2026/7/14 ")).toEqual(day(7, 14));
  });
  it("格式不符 → null", () => {
    expect(parseSlashDate("not-a-date")).toBeNull();
    expect(parseSlashDate("2026-07-14")).toBeNull();
    expect(parseSlashDate("2026/7")).toBeNull();
  });
  it("undefined / 空字串 → null", () => {
    expect(parseSlashDate(undefined)).toBeNull();
    expect(parseSlashDate("")).toBeNull();
  });
});

describe("parseAmount（內聯 helper）", () => {
  it("`NT$6,400` → 6400（去千分位與貨幣符號）", () => {
    expect(parseAmount("NT$6,400")).toBe(6400);
  });
  it("`NT$0` → 0（招待列保留 0）", () => {
    expect(parseAmount("NT$0")).toBe(0);
  });
  it("純數字字串 → 整數", () => {
    expect(parseAmount("8000")).toBe(8000);
  });
  it("無數字 / 空 / undefined → 0", () => {
    expect(parseAmount("免費")).toBe(0);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
  });
});

describe("normPlatform（內聯 helper）", () => {
  it("CTrip / ctrip → Ctrip", () => {
    expect(normPlatform("CTrip")).toBe("Ctrip");
    expect(normPlatform("ctrip")).toBe("Ctrip");
  });
  it("OwlJourney / OwlNest → 奧丁丁（統一奧丁丁體系）", () => {
    expect(normPlatform("OwlJourney")).toBe("奧丁丁");
    expect(normPlatform("OwlNest")).toBe("奧丁丁");
  });
  it("trim 前後空白", () => {
    expect(normPlatform("  Agoda ")).toBe("Agoda");
  });
  it("空字串 → 其他", () => {
    expect(normPlatform("")).toBe("其他");
    expect(normPlatform("   ")).toBe("其他");
  });
  it("未知平台原樣返回", () => {
    expect(normPlatform("Booking.com")).toBe("Booking.com");
  });
});

describe("taipeiToday（內聯 helper）", () => {
  it("UTC 16:30 深夜 → 台北隔天", () => {
    expect(taipeiToday(new Date("2026-07-13T16:30:00Z"))).toEqual(day(7, 14));
  });
  it("UTC 15:00 → 仍為台北當天", () => {
    expect(taipeiToday(new Date("2026-07-13T15:00:00Z"))).toEqual(day(7, 13));
  });
});
