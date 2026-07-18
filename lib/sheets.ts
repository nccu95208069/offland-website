// Google Sheets 唯讀 client（薄）。Spec: docs/specs/admin-dashboard.md §3.3。
// 只讀 Offland 訂單主表 工作表1!A2:N，零寫入。用 google-auth-library 取 OAuth token
// 後直接打 Sheets REST（不裝整包 googleapis），pattern 已在 sweetfun-web 驗證可行。

import { GoogleAuth } from "google-auth-library";

const SPREADSHEET_ID = "1jBJq1xWmM7xKpUxFjsLYQc7EbLAWmcMjQK0SBbaORuc";
const RANGE = "工作表1!A2:N";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

/** 憑證/取 token/REST 讀取任一環節失敗，統一以此標記，供 route 對映 502。 */
export class SheetsError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SheetsError";
  }
}

/**
 * 憑證讀取順序：GOOGLE_SERVICE_ACCOUNT_KEY（JSON 字串 env，正式環境）→
 * GOOGLE_SERVICE_ACCOUNT_KEY_PATH（本機 dev 指向 key 檔）→ 都沒有 → throw。
 */
async function getCredentials(): Promise<Record<string, unknown>> {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  }
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (keyPath) {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    return JSON.parse(readFileSync(resolve(keyPath), "utf-8"));
  }
  throw new Error("Missing Google service account credentials");
}

/**
 * 讀 Offland 訂單主表 A2:N 原始列。非 2xx → throw（由 route 轉 502）。
 * 回傳 `string[][]`（無資料時 `[]`）。
 */
export async function getOfflandSheetRows(): Promise<string[][]> {
  try {
    const auth = new GoogleAuth({
      credentials: await getCredentials(),
      scopes: [SCOPE],
    });
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new SheetsError(`Sheets API error: ${res.status}`);
    const json = await res.json();
    return (json.values as string[][]) || [];
  } catch (err) {
    if (err instanceof SheetsError) throw err;
    throw new SheetsError("Failed to read Offland sheet", { cause: err });
  }
}
