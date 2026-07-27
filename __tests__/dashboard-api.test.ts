import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock 外部邊界：iron-session 認證與 Sheets client。被測的 parse/compute 邏輯不 mock。
// SheetsError 保留真實 class（route 用 instanceof 分流 502），只 stub getOfflandSheetRows。
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  // isAuthenticated mock（session 情境由各測試控制）；hasValidApiToken 用真實作
  return { ...actual, isAuthenticated: vi.fn() };
});
vi.mock("@/lib/sheets", async () => {
  const actual = await vi.importActual<typeof import("@/lib/sheets")>("@/lib/sheets");
  return { ...actual, getOfflandSheetRows: vi.fn() };
});

import { GET } from "@/app/api/admin/dashboard/route";
import { isAuthenticated } from "@/lib/auth";
import { getOfflandSheetRows, SheetsError } from "@/lib/sheets";

const mockAuth = vi.mocked(isAuthenticated);
const mockRows = vi.mocked(getOfflandSheetRows);

// 一列合法 A2:N 資料（今晚入住，讓 compute 有內容）。
const sampleRows: string[][] = [
  ["OFFLAND", "測試客", "Agoda", "2026/7/14", "2026/7/16", "2026/7/1", "NT$16,000", "", "", "uid", "備註", "6人", "", ""],
];

function req(url = "https://x.test/api/admin/dashboard"): Request {
  return new Request(url);
}

function reqWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://x.test/api/admin/dashboard", { headers });
}

const API_TOKEN = "offland-server-token";

beforeEach(() => {
  vi.clearAllMocks();
  mockRows.mockResolvedValue(sampleRows);
});

describe("GET /api/admin/dashboard — Bearer token（伺服器對伺服器，Super Molly PWA）", () => {
  const OLD = { ...process.env };
  beforeEach(() => { process.env.OFFLAND_API_TOKEN = API_TOKEN; });
  afterEach(() => { process.env = { ...OLD }; });

  it("未登入但帶正確 Bearer token → 200", async () => {
    mockAuth.mockResolvedValue(false);
    const res = await GET(reqWithHeaders({ authorization: `Bearer ${API_TOKEN}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it("未登入 + 錯誤 Bearer token → 401，不讀 sheets", async () => {
    mockAuth.mockResolvedValue(false);
    const res = await GET(reqWithHeaders({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
    expect(mockRows).not.toHaveBeenCalled();
  });

  it("OFFLAND_API_TOKEN 未設 → Bearer 一律無效（仍需登入）", async () => {
    delete process.env.OFFLAND_API_TOKEN;
    mockAuth.mockResolvedValue(false);
    const res = await GET(reqWithHeaders({ authorization: `Bearer ${API_TOKEN}` }));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/dashboard — auth guard", () => {
  it("未登入 → 401，body 只有 unauthorized，且不觸發 sheets 讀取", async () => {
    mockAuth.mockResolvedValue(false);
    const res = await GET(req());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "unauthorized" });
    expect(body.data).toBeUndefined();
    expect(mockRows).not.toHaveBeenCalled();
  });

  it("已登入 → 200，envelope shape 正確（success + data 七區塊）", async () => {
    mockAuth.mockResolvedValue(true);
    const res = await GET(req("https://x.test/api/admin/dashboard?refresh=1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.timezone).toBe("Asia/Taipei");
    for (const key of ["yesterday", "today", "last7", "upcoming", "strip", "occupancy", "verdict", "actions"]) {
      expect(body.data).toHaveProperty(key);
    }
    expect(mockRows).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/admin/dashboard — sheets 失敗", () => {
  it("SheetsError → 502 sheets_unavailable，不洩漏內部細節", async () => {
    mockAuth.mockResolvedValue(true);
    mockRows.mockRejectedValue(new SheetsError("Sheets API error: 503"));
    const res = await GET(req("https://x.test/api/admin/dashboard?refresh=1"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "sheets_unavailable" });
  });

  it("非 SheetsError 的未預期錯誤 → 500 internal", async () => {
    mockAuth.mockResolvedValue(true);
    mockRows.mockRejectedValue(new Error("boom"));
    const res = await GET(req("https://x.test/api/admin/dashboard?refresh=1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: "internal" });
  });
});

describe("GET /api/admin/dashboard — cache 與 refresh", () => {
  it("5 分鐘 cache：連續兩次登入請求只讀 sheets 一次", async () => {
    mockAuth.mockResolvedValue(true);
    // 先用 refresh 清掉前面測試殘留的 cache，建立乾淨 baseline。
    await GET(req("https://x.test/api/admin/dashboard?refresh=1"));
    mockRows.mockClear();
    // 這兩次不帶 refresh → 應命中 cache，不再讀 sheets。
    await GET(req());
    await GET(req());
    expect(mockRows).not.toHaveBeenCalled();
  });

  it("?refresh=1 略過 cache 重新讀 sheets", async () => {
    mockAuth.mockResolvedValue(true);
    await GET(req("https://x.test/api/admin/dashboard?refresh=1")); // 建 cache
    mockRows.mockClear();
    await GET(req("https://x.test/api/admin/dashboard?refresh=1")); // 強制重讀
    expect(mockRows).toHaveBeenCalledTimes(1);
  });
});
