// Offland 晨報（admin dashboard）純計算函式。
// Spec: docs/specs/admin-dashboard.md — 包棟民宿（一晚一組客人）的早晨 5 問：
// 今晚有沒有客人 / 今天誰要來（幾人、備註）/ 昨天進了幾組 / 未來 7·14 晚哪裡空 / 有沒有異常。
//
// 與水芳（dashboard-pulse）的關鍵差異：水芳算「房 × 晚」（6 間房），Offland 算「晚」——
// 每晚只有 booked / empty 二值。佔用看日期、營收看金額，兩者分開計：
// NT$0 網紅招待 = 有人住（佔用）、營收 0（水芳把 amount<=0 丟棄，Offland 必須保留）。
//
// 所有計算函式的 today 由參數注入（可單元測試）。「日」以台北時間為準（Vercel server 是 UTC）。
//
// 搬家自 sweetfun-web src/lib/dashboard-offland-utils.ts（232 測試綠、98.66% 覆蓋，語義一行不改）。
// 唯一差異：原本 import 自水芳模組的 4 個 helper（parseSlashDate / parseAmount /
// normPlatform / taipeiToday）在本 repo 不存在，改為內聯於本檔（實作照抄、export 供直測）。

// ─── 內聯 helper（原出處：sweetfun-web dashboard-v2-utils / dashboard-pulse-utils）──

/** `"2026/1/17"` → local-midnight Date；格式不符 → null。 */
export function parseSlashDate(s: string | undefined): Date | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** 去除所有非數字字元 → int；空/無效 → 0（`"NT$6,400"` → 6400）。 */
export function parseAmount(s: string | undefined): number {
  if (!s) return 0;
  return parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
}

const PLATFORM_ALIASES: Record<string, string> = {
  CTrip: "Ctrip",
  ctrip: "Ctrip",
  // OwlJourney（OTA）與 OwlNest（後台）都是奧丁丁體系，統一成一個管道
  OwlJourney: "奧丁丁",
  OwlNest: "奧丁丁",
};

/** trim → 空字串換 "其他" → 套用 alias 表。 */
export function normPlatform(p: string): string {
  const t = (p || "").trim() || "其他";
  return PLATFORM_ALIASES[t] || t;
}

/**
 * 台北「今天」的 local-midnight Date。Vercel server 跑 UTC，直接 new Date() 會在
 * 台北凌晨（UTC 前一天下午）算錯日，故用 Intl 取台北日曆日再組回 local Date。
 */
export function taipeiToday(now: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── action 規則常數（spec §3.2；adversarial 改壞會被 actions 邊界測試抓到）──
export const OFFLAND_PLATFORM_DROP_PP = -10; // 平台金額佔比掉這麼多 pp → 檢查曝光
export const OFFLAND_NEXT7_EMPTY_THRESHOLD = 5; // 未來 7 晚空 ≥ 這麼多 → watch
export const OFFLAND_NEXT14_EMPTY_THRESHOLD = 11; // 未來 14 晚空 ≥ 這麼多 → watch
export const OFFLAND_LEAD_SHORT_DAYS = 3; // lead time 中位數 ≤ 這麼多天 → 視為臨訂

// ─── 型別 ───────────────────────────────────────────────────────

export interface OfflandNight {
  night: Date; // 該列涵蓋的夜晚（＝入住日；多晚列展開成多個 OfflandNight）
  guestNameRaw: string; // B 原文（顯示用）
  normName: string; // 合併鍵用
  platform: string; // normPlatform(C)
  bookingDate: Date | null; // parseSlashDate(F)
  amount: number; // 該晚營收（多晚列 = G/晚數 取整），0 保留
  headcount: number | null; // L "6人" → 6
  note: string; // K trim 後原文（可空字串）
}

export interface OfflandBooking {
  guestName: string; // 組內第一晚的 guestNameRaw
  normName: string;
  platform: string;
  checkIn: Date; // 第一晚
  checkOut: Date; // 最後一晚 +1 天
  nights: number; // 組內晚數
  amount: number; // 組內各晚 amount 加總
  bookingDate: Date | null; // 組內最早的 bookingDate
  headcount: number | null; // 組內第一個非 null 的 L
  notes: string[]; // 組內非空 K 去重
  comp: boolean; // amount === 0（招待/網紅）
}

export interface OfflandPlatformShare {
  name: string;
  orders: number;
  nights: number;
  amount: number;
  sharePct: number;
  prevSharePct: number | null;
  deltaPp: number | null;
}

export interface OfflandBookingRow {
  bookingDate: string | null;
  platform: string;
  guestName: string;
  checkIn: string;
  nights: number;
  headcount: number | null;
  leadDays: number | null;
  amount: number;
  comp: boolean;
}

export interface OfflandStripNight {
  date: string; // YYYY-MM-DD
  weekday: number; // 0=日 … 6=六
  isWeekend: boolean; // 週五(5)/週六(6) 為 weekend
  phase: "past" | "today" | "future";
  booked: boolean;
  guestName: string | null;
  platform: string | null;
  comp: boolean;
}

export interface OfflandAction {
  level: "act" | "watch" | "ok";
  title: string;
  evidence: string;
}

export interface OfflandData {
  generatedAt: string;
  timezone: "Asia/Taipei";
  yesterday: {
    date: string;
    orders: number;
    nights: number;
    amount: number;
    platforms: { name: string; orders: number }[];
    lastNight: {
      occupied: boolean;
      guestName: string | null;
      platform: string | null;
      comp: boolean;
      revenue: number;
    };
    detail: OfflandBookingRow[];
  };
  today: {
    date: string;
    asOf: string;
    orders: number;
    nights: number;
    amount: number;
    platforms: { name: string; orders: number }[];
    checkIns: {
      guestName: string;
      platform: string;
      checkOut: string;
      nights: number;
      headcount: number | null;
      amount: number;
      comp: boolean;
      notes: string[];
    }[];
    checkOutsCount: number;
    tonight: { occupied: boolean; guestName: string | null; platform: string | null; comp: boolean };
  };
  last7: {
    from: string;
    to: string;
    orders: number;
    nights: number;
    amount: number;
    vsPrev7: { ordersDelta: number; amountDelta: number; amountDeltaPct: number | null };
    platforms: OfflandPlatformShare[];
    daily14: { date: string; orders: number; amount: number }[];
    leadTimeMedianDays: number | null;
    detail: OfflandBookingRow[];
  };
  upcoming: { orders: number; nights: number; amount: number };
  strip: { nights: OfflandStripNight[] };
  occupancy: {
    next7Booked: number;
    next7Empty: number;
    next14Booked: number;
    next14Empty: number;
    weekendEmptyNext7: string[];
  };
  verdict: { level: "up" | "flat" | "down" | "quiet"; headline: string; basis: string };
  actions: OfflandAction[];
  summaryText: string;
  meta: { rowCount: number; bookingCount: number; generatedAt: string };
}

// ─── date helpers ───────────────────────────────────────────────

const DAY_MS = 86400000;

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function md(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mdFromIso(s: string): string {
  const [, m, d] = s.split("-").map(Number);
  return `${m}/${d}`;
}

function isWeekendNight(d: Date): boolean {
  const w = d.getDay();
  return w === 5 || w === 6; // 週五、週六晚 = 民宿週末
}

// ─── parse ──────────────────────────────────────────────────────

/**
 * 名字正規化（合併鍵）：去頭尾空白 → 刪除所有半形 (...) 與全形 （...） 括號段
 * （含 (連住)/(LINE)/(+床)）→ 空白正規化為單一半形空白 → lowercase。
 */
export function normName(raw: string): string {
  return (raw || "")
    .replace(/[（(][^（()）]*[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseHeadcount(s: string | undefined): number | null {
  const m = (s || "").match(/(\d+)\s*人/);
  return m ? Number(m[1]) : null;
}

/**
 * 逐列 parse 新表 A2:N → OfflandNight[]（多晚列展開成多個夜晚）。
 * 規則（依序）：
 *  1. A 不以 OFFLAND 開頭（大小寫不敏感）→ 跳過整列。
 *  2. D 入住解析失敗 → 跳過整列。
 *  3. E 退房失敗或 ≤ 入住 → 1 晚；否則 nights = round((E−D)/日)。
 *  4. amount = parseAmount(G)，0 保留（NT$0 網紅招待列必須留下佔用檔期）。
 *  5. 去重：normName|platform|iso(night) 留第一筆。
 */
export function parseOfflandNights(rows: string[][]): OfflandNight[] {
  const out: OfflandNight[] = [];
  for (const r of rows) {
    const room = (r[0] || "").trim();
    if (!/^offland/i.test(room)) continue;

    const checkIn = parseSlashDate(r[3]);
    if (!checkIn) continue;
    const checkOut = parseSlashDate(r[4]);
    const nights =
      checkOut && checkOut.getTime() > checkIn.getTime()
        ? Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS))
        : 1;

    const total = parseAmount(r[6]);
    const perNight = Math.round(total / nights);
    const nName = normName(r[1] || "");
    const platform = normPlatform(r[2] || "");
    const bookingDate = parseSlashDate(r[5]);
    const headcount = parseHeadcount(r[11]);
    const note = (r[10] || "").trim();
    const guestNameRaw = (r[1] || "").trim();

    for (let i = 0; i < nights; i++) {
      out.push({
        night: addDays(checkIn, i),
        guestNameRaw,
        normName: nName,
        platform,
        bookingDate,
        amount: perNight,
        headcount,
        note,
      });
    }
  }

  const seen = new Set<string>();
  return out.filter((n) => {
    const k = `${n.normName}|${n.platform}|${iso(n.night)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── 連住合併 ───────────────────────────────────────────────────

function buildBooking(run: OfflandNight[]): OfflandBooking {
  const first = run[0];
  const last = run[run.length - 1];
  const amount = run.reduce((s, n) => s + n.amount, 0);
  const bookingDates = run
    .map((n) => n.bookingDate)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  const headcount = run.find((n) => n.headcount !== null)?.headcount ?? null;
  const notes = Array.from(new Set(run.map((n) => n.note).filter((x) => x !== "")));
  return {
    guestName: first.guestNameRaw,
    normName: first.normName,
    platform: first.platform,
    checkIn: first.night,
    checkOut: addDays(last.night, 1),
    nights: run.length,
    amount,
    bookingDate: bookingDates[0] ?? null,
    headcount,
    notes,
    comp: amount === 0,
  };
}

/**
 * 連住合併 → OfflandBooking[]（「組」）。不依賴 (連住) 標記（實測多數連住組無標記）。
 * 依 (normName, platform) 分群後，各群按夜晚排序，切成連續（相鄰恰差 1 天）的段落。
 * 這比「全域排序後看相鄰」更穩：不受不同客人交錯或亂序列影響（實測有亂序列）。
 */
export function mergeOfflandBookings(nights: OfflandNight[]): OfflandBooking[] {
  const groups = new Map<string, OfflandNight[]>();
  for (const n of nights) {
    const k = `${n.normName}|${n.platform}`;
    const list = groups.get(k);
    if (list) list.push(n);
    else groups.set(k, [n]);
  }

  const bookings: OfflandBooking[] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => a.night.getTime() - b.night.getTime());
    let run: OfflandNight[] = [];
    const flush = () => {
      if (run.length > 0) {
        bookings.push(buildBooking(run));
        run = [];
      }
    };
    for (const n of list) {
      if (run.length === 0) {
        run.push(n);
        continue;
      }
      const diff = Math.round((n.night.getTime() - run[run.length - 1].night.getTime()) / DAY_MS);
      if (diff === 0) continue; // 同晚重複（理論上已去重）→ 忽略
      if (diff === 1) run.push(n);
      else {
        flush();
        run.push(n);
      }
    }
    flush();
  }

  bookings.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
  return bookings;
}

// ─── compute helpers ────────────────────────────────────────────

function coversNight(b: OfflandBooking, night: Date): boolean {
  return b.checkIn.getTime() <= night.getTime() && night.getTime() < b.checkOut.getTime();
}

/** 該晚佔用的組（包棟：至多一組）。取 checkIn 最早者為代表。 */
function bookingForNight(bookings: OfflandBooking[], night: Date): OfflandBooking | null {
  let best: OfflandBooking | null = null;
  for (const b of bookings) {
    if (coversNight(b, night) && (!best || b.checkIn.getTime() < best.checkIn.getTime())) best = b;
  }
  return best;
}

function bookedBetween(bookings: OfflandBooking[], from: Date, to: Date): OfflandBooking[] {
  return bookings.filter(
    (b) => b.bookingDate && b.bookingDate.getTime() >= from.getTime() && b.bookingDate.getTime() <= to.getTime()
  );
}

function stats(list: OfflandBooking[]) {
  return {
    orders: list.length,
    nights: list.reduce((s, b) => s + b.nights, 0),
    amount: list.reduce((s, b) => s + b.amount, 0),
  };
}

function platformCounts(list: OfflandBooking[]): { name: string; orders: number }[] {
  const m = new Map<string, number>();
  for (const b of list) m.set(b.platform, (m.get(b.platform) || 0) + 1);
  return Array.from(m.entries())
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders);
}

function leadDaysOf(b: OfflandBooking): number | null {
  if (!b.bookingDate) return null;
  return Math.round((b.checkIn.getTime() - b.bookingDate.getTime()) / DAY_MS);
}

function toRow(b: OfflandBooking): OfflandBookingRow {
  return {
    bookingDate: b.bookingDate ? iso(b.bookingDate) : null,
    platform: b.platform,
    guestName: b.guestName,
    checkIn: iso(b.checkIn),
    nights: b.nights,
    headcount: b.headcount,
    leadDays: leadDaysOf(b),
    amount: b.amount,
    comp: b.comp,
  };
}

// ─── main ───────────────────────────────────────────────────────

export function computeOffland(
  bookings: OfflandBooking[],
  nights: OfflandNight[],
  today: Date,
  asOf = ""
): OfflandData {
  const yesterdayD = addDays(today, -1);
  const last7From = addDays(today, -7);
  const prev7From = addDays(today, -14);
  const prev7To = addDays(today, -8);

  // ── 接單窗（by bookingDate）
  const bookedYesterday = bookedBetween(bookings, yesterdayD, yesterdayD);
  const bookedLast7 = bookedBetween(bookings, last7From, yesterdayD);
  const bookedPrev7 = bookedBetween(bookings, prev7From, prev7To);
  const bookedToday = bookedBetween(bookings, today, today);

  const yStats = stats(bookedYesterday);
  const tStats = stats(bookedToday);
  const l7 = stats(bookedLast7);
  const p7 = stats(bookedPrev7);

  // ── 平台金額佔比（近 7 天 vs 前 7 天）
  const groupAmount = (list: OfflandBooking[]) => {
    const m = new Map<string, { orders: number; nights: number; amount: number }>();
    for (const b of list) {
      const a = m.get(b.platform) || { orders: 0, nights: 0, amount: 0 };
      a.orders++;
      a.nights += b.nights;
      a.amount += b.amount;
      m.set(b.platform, a);
    }
    return m;
  };
  const curMap = groupAmount(bookedLast7);
  const prevMap = groupAmount(bookedPrev7);
  const platforms: OfflandPlatformShare[] = Array.from(curMap.entries())
    .map(([name, a]) => {
      const sharePct = l7.amount > 0 ? (a.amount / l7.amount) * 100 : 0;
      const prev = prevMap.get(name);
      const prevSharePct = prev && p7.amount > 0 ? (prev.amount / p7.amount) * 100 : null;
      return {
        name,
        ...a,
        sharePct,
        prevSharePct,
        deltaPp: prevSharePct === null ? null : sharePct - prevSharePct,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // ── daily14：結尾昨天的 14 天接單
  const daily14 = Array.from({ length: 14 }, (_, k) => {
    const d = addDays(today, k - 14);
    const list = bookedBetween(bookings, d, d);
    return { date: iso(d), orders: list.length, amount: list.reduce((s, b) => s + b.amount, 0) };
  });

  // ── lead time 中位數（近 7 天接單）
  const leads = bookedLast7
    .map(leadDaysOf)
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);
  const leadTimeMedianDays =
    leads.length === 0
      ? null
      : leads.length % 2 === 1
        ? leads[(leads.length - 1) / 2]
        : Math.floor((leads[leads.length / 2 - 1] + leads[leads.length / 2]) / 2);

  // ── 今日入住 / 退房 / 今晚
  const checkIns = bookings
    .filter((b) => b.checkIn.getTime() === today.getTime())
    .map((b) => ({
      guestName: b.guestName,
      platform: b.platform,
      checkOut: iso(b.checkOut),
      nights: b.nights,
      headcount: b.headcount,
      amount: b.amount,
      comp: b.comp,
      notes: b.notes,
    }));
  const checkOutsCount = bookings.filter((b) => b.checkOut.getTime() === today.getTime()).length;

  const tonightBooking = bookingForNight(bookings, today);
  const tonight = {
    occupied: tonightBooking !== null,
    guestName: tonightBooking?.guestName ?? null,
    platform: tonightBooking?.platform ?? null,
    comp: tonightBooking?.comp ?? false,
  };

  // ── 昨晚住宿面：佔用 + 營收（per-night 金額直接加總，不攤平）
  const lastNightBooking = bookingForNight(bookings, yesterdayD);
  const lastNightRevenue = nights
    .filter((n) => n.night.getTime() === yesterdayD.getTime())
    .reduce((s, n) => s + n.amount, 0);
  const lastNight = {
    occupied: lastNightBooking !== null,
    guestName: lastNightBooking?.guestName ?? null,
    platform: lastNightBooking?.platform ?? null,
    comp: lastNightBooking?.comp ?? false,
    revenue: lastNightRevenue,
  };

  // ── 檔期條 strip：today−6 … today+7（14 晚）
  const stripNights: OfflandStripNight[] = Array.from({ length: 14 }, (_, k) => {
    const d = addDays(today, k - 6);
    const b = bookingForNight(bookings, d);
    const phase: OfflandStripNight["phase"] =
      d.getTime() < today.getTime() ? "past" : d.getTime() === today.getTime() ? "today" : "future";
    return {
      date: iso(d),
      weekday: d.getDay(),
      isWeekend: isWeekendNight(d),
      phase,
      booked: b !== null,
      guestName: b?.guestName ?? null,
      platform: b?.platform ?? null,
      comp: b?.comp ?? false,
    };
  });

  // ── occupancy：未來 7 / 14 晚（today+1 起）
  const countBooked = (span: number) => {
    let booked = 0;
    for (let i = 1; i <= span; i++) if (bookingForNight(bookings, addDays(today, i))) booked++;
    return booked;
  };
  const next7Booked = countBooked(7);
  const next14Booked = countBooked(14);
  const weekendEmptyNext7: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, i);
    if (isWeekendNight(d) && !bookingForNight(bookings, d)) weekendEmptyNext7.push(iso(d));
  }
  const occupancy = {
    next7Booked,
    next7Empty: 7 - next7Booked,
    next14Booked,
    next14Empty: 14 - next14Booked,
    weekendEmptyNext7,
  };

  // ── verdict（近 7 天 vs 前 7 天接單金額，comp 組貢獻 0）
  let verdict: OfflandData["verdict"];
  if (p7.amount === 0 && l7.amount === 0) {
    verdict = { level: "quiet", headline: "最近 14 天沒有新訂單", basis: "近 7 天與前 7 天接單金額都是 0。" };
  } else if (p7.amount === 0) {
    verdict = {
      level: "up",
      headline: `前 7 天沒有接單，近 7 天接回 ${l7.orders} 組，動能在回升`,
      basis: `近 7 天接單 NT$${l7.amount.toLocaleString()}，前 7 天為 0。`,
    };
  } else {
    const pct = Math.round(((l7.amount - p7.amount) / p7.amount) * 100);
    const basis = `近 7 天接單 NT$${l7.amount.toLocaleString()}（${l7.orders} 組），前 7 天 NT$${p7.amount.toLocaleString()}（${p7.orders} 組）。`;
    if (pct >= 15) verdict = { level: "up", headline: `近 7 天接單金額比前 7 天多 ${pct}%，動能在回升`, basis };
    else if (pct <= -15)
      verdict = { level: "down", headline: `近 7 天接單金額比前 7 天少 ${Math.abs(pct)}%，動能轉弱`, basis };
    else verdict = { level: "flat", headline: `近 7 天接單與前 7 天大致持平（${pct >= 0 ? "+" : ""}${pct}%）`, basis };
  }

  // ── actions（spec §3.2，依序、附 evidence）
  const actions: OfflandAction[] = [];

  const rule1 = !tonight.occupied;
  if (rule1) {
    actions.push({
      level: "act",
      title: "今晚 Offland 空檔，考慮當日限時優惠",
      evidence: "過了今晚，這一晚的房間價值就歸零。",
    });
  }

  const rule2 = weekendEmptyNext7.length > 0;
  if (rule2) {
    actions.push({
      level: "act",
      title: `本週末 ${weekendEmptyNext7.map(mdFromIso).join("、")} 還空著，優先推銷`,
      evidence: "週五、週六晚是包棟民宿最好賣的檔期。",
    });
  }

  let rule3 = false;
  for (const pf of platforms) {
    if (pf.prevSharePct !== null && pf.deltaPp !== null && pf.deltaPp <= OFFLAND_PLATFORM_DROP_PP) {
      rule3 = true;
      actions.push({
        level: "act",
        title: `檢查 ${pf.name} 的房價與排名曝光`,
        evidence: `${pf.name} 金額佔比從 ${Math.round(pf.prevSharePct)}% 掉到 ${Math.round(pf.sharePct)}%（${Math.round(pf.deltaPp)}pp）。`,
      });
    }
  }

  const rule4 = occupancy.next7Empty >= OFFLAND_NEXT7_EMPTY_THRESHOLD;
  if (rule4) {
    const leadNote =
      leadTimeMedianDays !== null && leadTimeMedianDays <= OFFLAND_LEAD_SHORT_DAYS
        ? `客人習慣臨訂（中位數約 ${leadTimeMedianDays} 天），還有補單空間。`
        : "自然補單機會偏低，可考慮提前優惠。";
    actions.push({
      level: "watch",
      title: `未來 7 晚只訂 ${occupancy.next7Booked} 晚，偏空`,
      evidence: leadNote,
    });
  }

  const rule5 = !rule4 && occupancy.next14Empty >= OFFLAND_NEXT14_EMPTY_THRESHOLD;
  if (rule5) {
    actions.push({
      level: "watch",
      title: `未來兩週只訂 ${occupancy.next14Booked} 晚，檔期偏空，先觀察`,
      evidence: `未來 14 晚有 ${occupancy.next14Empty} 晚還沒訂。`,
    });
  }

  const rule6 = verdict.level !== "down" && !rule1;
  if (rule6) {
    actions.push({ level: "ok", title: "整體價格不需調降", evidence: `接單動能：${verdict.headline}。` });
  }

  const rule7 = !rule1 && !rule2 && !rule3 && !rule4 && !rule5;
  if (rule7) {
    actions.push({
      level: "ok",
      title: "今天沒有需要處理的異常",
      evidence: "今晚有客、近期檔期不算空、平台結構穩定。",
    });
  }

  // ── summary text（純文字 Offland 晨報，先不接推播）
  const lines: string[] = [
    `【Offland 晨報 ${iso(today)}】`,
    `昨天（${md(yesterdayD)}）接單 ${yStats.orders} 組、${yStats.nights} 晚、NT$${yStats.amount.toLocaleString()}${
      bookedYesterday.length > 0
        ? `（${platformCounts(bookedYesterday).map((x) => `${x.name}×${x.orders}`).join("、")}）`
        : ""
    }。`,
    `昨晚${lastNight.occupied ? `有客：${lastNight.guestName}${lastNight.comp ? "（招待）" : ""}，營收 NT$${lastNight.revenue.toLocaleString()}` : "空檔"}。`,
    `今晚${tonight.occupied ? `已訂：${tonight.guestName}${tonight.comp ? "（招待）" : ""}` : "空檔"}。今日入住 ${checkIns.length} 組、退房 ${checkOutsCount} 組。`,
    `未來 7 晚已訂 ${occupancy.next7Booked}/7、未來 14 晚已訂 ${occupancy.next14Booked}/14${
      weekendEmptyNext7.length > 0 ? `，週末還空：${weekendEmptyNext7.map(mdFromIso).join("、")}` : ""
    }。`,
    `近 7 天接單 ${l7.orders} 組、NT$${l7.amount.toLocaleString()}（前 7 天 ${p7.orders} 組、NT$${p7.amount.toLocaleString()}）。`,
    `判讀：${verdict.headline}。`,
    ...actions.map(
      (a) => `• [${a.level === "act" ? "建議行動" : a.level === "watch" ? "先觀察" : "不需行動"}] ${a.title} — ${a.evidence}`
    ),
  ];

  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    timezone: "Asia/Taipei",
    yesterday: {
      date: iso(yesterdayD),
      ...yStats,
      platforms: platformCounts(bookedYesterday),
      lastNight,
      detail: bookedYesterday.map(toRow),
    },
    today: {
      date: iso(today),
      asOf,
      ...tStats,
      platforms: platformCounts(bookedToday),
      checkIns,
      checkOutsCount,
      tonight,
    },
    last7: {
      from: iso(last7From),
      to: iso(yesterdayD),
      ...l7,
      vsPrev7: {
        ordersDelta: l7.orders - p7.orders,
        amountDelta: l7.amount - p7.amount,
        amountDeltaPct: p7.amount > 0 ? ((l7.amount - p7.amount) / p7.amount) * 100 : null,
      },
      platforms,
      daily14,
      leadTimeMedianDays,
      detail: bookedBetween(bookings, last7From, today)
        .sort((a, b) => (b.bookingDate?.getTime() || 0) - (a.bookingDate?.getTime() || 0))
        .map(toRow),
    },
    upcoming: stats(bookings.filter((b) => b.checkIn.getTime() > today.getTime())),
    strip: { nights: stripNights },
    occupancy,
    verdict,
    actions,
    summaryText: lines.join("\n"),
    meta: { rowCount: nights.length, bookingCount: bookings.length, generatedAt },
  };
}
