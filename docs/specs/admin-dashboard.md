---
# Spec Lock front-matter — architect 是唯一寫入者。
# 凡 commit 動到下列檔案，必須帶 `Aligned-with: admin-dashboard@<hash7>` trailer。
owns:
  - "app/admin/dashboard/**"
  - "app/api/admin/dashboard/**"
  - "lib/dashboard-utils.ts"
  - "lib/sheets.ts"
  - "__tests__/**"
  - "vitest.config.ts"
---

# Spec: admin-dashboard（Offland 營運晨報）

> Status: locked
> Author: architect（mollyteam，2026-07-18）
> Feature branch: `feat/admin-dashboard`
> 指紋演算法：`git hash-object docs/specs/admin-dashboard.md | cut -c1-7`
> commit 蓋戳：`Aligned-with: admin-dashboard@<hash7>`（trailer，訊息末行）

## 1. 目標

把**已驗證**的 Offland 晨報（先前誤放在水芳 repo `sweetfun-web`）搬進 Offland 自己的官網 repo，
掛在既有 `/admin` 後台之下。給包棟民宿（一晚一組客人）的每日晨間頁，回答早晨 5 問：
**今晚有沒有客人？今天誰要來（幾人、備註）？昨天進了幾組？未來 7/14 晚哪裡空？有沒有異常？**

這是「**搬家**」不是「重寫」：資料邏輯照搬 sweetfun-web `dashboard-offland-utils.ts`
（232 測試綠、覆蓋 98.66%，已 merge 其 main），**語義一行不改**；換掉的只有三件事——
repo（搬到這裡）、auth（改用本 repo iron-session）、視覺（Tailwind 深藍金 → CSS Modules + Offland 大地色）。

## 2. 本 repo 既有事實（實作前提，違反即出錯）

- Next.js App Router（Next 16 / React 19），**CSS Modules（每頁 `page.module.css`），沒有 Tailwind**。禁止照抄 sweetfun 的 Tailwind class。
- 已有 admin 後台：`app/admin/layout.tsx`（robots noindex、深色 `#1a1a1a` 外層背景）、`app/admin/login/page.tsx`、`app/admin/blog/page.tsx`。
- **Auth = iron-session**（`lib/auth.ts`）：`getSession()` / `isAuthenticated()` / login rate limiter；
  cookie `offland-admin-session`（HttpOnly，8h）；登入 `POST /api/auth/login` 比對 `ADMIN_USERNAME`/`ADMIN_PASSWORD`。
  **必須複用這套；禁止自造第二套 auth、禁止搬 sweetfun 的 `sf_dash` HMAC cookie / `PULSE_API_TOKEN` Bearer 方案**（本 repo 無 server-to-server 消費者，Bearer 路徑整條刪除）。
- **無 `middleware.ts`**：守門用 page 內 server 檢查（見 §6），不新增 middleware（只有兩個受保護頁面，middleware 是過度設計；未來 admin 頁 ≥4 個再議）。
- 設計 tokens 在 `app/globals.css`（CSS variables：大地色 `--color-primary:#8B6F47` 系、cream 背景、Noto Serif TC / Inter、radius、shadow）。視覺規格由 designer 出（侘寂 × 現代）；本 spec 只定資訊架構（§7）。
- 資料存取現況只有 Notion；**無 Google Sheets 相關 code 與依賴**——本 feature 新增。
- **無測試框架**（package.json 無 test script）——本 feature bootstrap vitest（§8）。

## 3. 資料來源與資料模型（照搬 sweetfun-web，語義不變）

### 3.1 來源

Google Sheet `1jBJq1xWmM7xKpUxFjsLYQc7EbLAWmcMjQK0SBbaORuc`，range `工作表1!A2:N`。**唯讀，零寫入**。
憑證：env `GOOGLE_SERVICE_ACCOUNT_KEY`（JSON 字串；同一把唯讀 service account，harness 已驗證能讀此表並會設好 env）；
本機 fallback env `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` 指向 key 檔。

欄位語義（已實測，摘自原 spec）：A 房間（只當列過濾器：不以 `OFFLAND` 開頭跳過；`(連住)` 標記不可靠不做語意依據）、
B 用戶名稱（常帶括號註記）、C 平台、D 入住、E 退房、F 預定日期（接單面統計主鍵）、G 房費（**該晚**營收，`NT$0` 保留）、
K 備註原文、L 入住人數（`"6人"`→6）。H/I/J/M/N 不使用（J 唯一ID 含垃圾值，**不可**作合併鍵）。短列（10 欄）常見，防禦性取值。

### 3.2 `lib/dashboard-utils.ts` — 從 sweetfun-web `src/lib/dashboard-offland-utils.ts` 整檔 port

**語義照搬、不改演算法**。唯一結構性差異：原檔 import 的 4 個水芳 helper 在本 repo 不存在，**內聯進本檔**（實作同樣照抄）：

| helper | 原出處 | 語義 |
|---|---|---|
| `parseSlashDate` | dashboard-v2-utils | `"2026/1/17"` → local Date，格式不符 → null |
| `parseAmount` | dashboard-v2-utils | 去非數字字元 → int，空/無效 → 0 |
| `normPlatform` | dashboard-v2-utils | trim、空→"其他"、alias 表（CTrip/ctrip→Ctrip、OwlJourney/OwlNest→奧丁丁） |
| `taipeiToday` | dashboard-pulse-utils | `Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei"})` 取台北日 → local midnight Date（server 是 UTC） |

照搬的核心語義（摘要；權威定義=原檔案，port 時逐函式對照）：

1. **逐列 parse → `OfflandNight`**：A 列過濾 → D 解析失敗跳列 → 多晚列展開（`amount = G/晚數 取整`）→
   **`NT$0` 保留**（網紅招待＝佔用計、營收 0）→ 去重鍵 `normName|platform|iso(night)` 留第一筆。
   `normName`：刪半形/全形括號段（`(連住)`/`(LINE)`/`(+床)`）→ 空白正規化 → lowercase。
2. **連住合併 → `OfflandBooking`**：依 `(normName, platform)` 分群 → 群內按夜晚排序 → 切「連續（相鄰恰差 1 天）夜晚段」，
   一段＝一組。不依賴 `(連住)` 標記；同名不連續＝不同組；`bookingDate` 不當合併條件。
   組欄位：amount=各晚加總、bookingDate=組內最早、headcount=第一個非 null、notes=非空去重、`comp = amount===0`。
3. **`computeOffland(bookings, nights, today, asOf)` → `OfflandData`**：today 參數注入（可測）；
   時間窗 `last7=[today−7,today−1]`、`prev7=[today−14,today−8]`、`daily14`（結尾昨天）；接單面以組的 bookingDate 分窗。
   檔期條 strip = `today−6 … today+7` 共 **14 晚**；occupancy 算 next7/next14 booked/empty 與 `weekendEmptyNext7`（**週末晚=週五、週六**）。
   verdict：last7 vs prev7 接單金額，`quiet`（雙 0）/ prev7=0→`up` / ±15% → up/down / 其餘 flat。
   **actions 7 條規則**（依序、附 evidence、常數 exported：`OFFLAND_PLATFORM_DROP_PP=-10`、`NEXT7_EMPTY≥5`、`NEXT14_EMPTY≥11`、`LEAD_SHORT≤3`）：
   ①今晚空→act 限時優惠 ②週末空→act 優先推銷 ③平台佔比掉 ≥10pp→act 查曝光 ④next7 空≥5→watch（帶 lead time 脈絡）
   ⑤（④未觸發且）next14 空≥11→watch ⑥verdict≠down 且①未觸發→ok 不需調降 ⑦①–⑤全未觸發→ok 無異常。
   `summaryText`＝純文字晨報（LLM/推播接口，v1 只產字串不接推播）。
4. 型別全部照搬並 export：`OfflandNight` / `OfflandBooking` / `OfflandData` / `OfflandStripNight` / `OfflandAction` /
   `OfflandPlatformShare` / `OfflandBookingRow`（頁面 import type 用）。

### 3.3 `lib/sheets.ts` — Sheets 唯讀 client（新檔，薄）

- 依賴新增 **`google-auth-library`**（不裝整包 `googleapis`：只需要 OAuth token，REST fetch 一支就夠；已在 sweetfun 版驗證可行）。
- `getOfflandSheetRows(): Promise<string[][]>`：GoogleAuth（scope `spreadsheets.readonly`）取 token →
  `fetch` Sheets REST `values/工作表1!A2:N` → 回 `json.values || []`。非 2xx → throw（由 route 轉 502）。
- Spreadsheet id / range 為本檔常數。credentials 讀取順序：`GOOGLE_SERVICE_ACCOUNT_KEY`（JSON env）→ `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`（檔案）→ 都沒有 → throw。

## 4. API：`GET /api/admin/dashboard`（`app/api/admin/dashboard/route.ts`）

遵循本 repo `app/api/` 慣例（NextResponse.json）。`export const dynamic = "force-dynamic"`。

1. **Auth guard 最先執行、在 cache 之前**：`await isAuthenticated()`（`@/lib/auth`，iron-session）。
   否→ `401 { success:false, error:"unauthorized" }`，**不回傳任何營運數據、不觸發 sheets 讀取**。
2. Cache：module-scope in-memory 5 分鐘；`?refresh=1` 略過 cache 重抓。**不 cache 401 判定**（guard 在前自然成立）、**不 cache 錯誤**。
3. 資料流：`getOfflandSheetRows()` → `parseOfflandNights` → `mergeOfflandBookings` →
   `computeOffland(bookings, nights, taipeiToday(now), asOf)`；`asOf` = 台北時間 `HH:mm`。
4. 成功：`200 { success:true, data: OfflandData }`（envelope 與型別照搬原 spec §5，shape 不變）。
5. 錯誤：sheets 讀取失敗 → `502 { success:false, error:"sheets_unavailable" }`；其他未預期 → `500 { success:false, error:"internal" }`。不洩 stack / key 內容。

## 5. 環境變數

| 變數 | 狀態 |
|---|---|
| `SESSION_SECRET` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 既有，複用，不新增不改 |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | **新增**（harness 已驗證同 key 可讀此表並會設定） |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | 選配，本機 dev fallback |

不建新金鑰、不接任何第三方新服務。

## 6. 路由與守門（狀態流）

- 頁面路由：**`/admin/dashboard`**（`app/admin/dashboard/page.tsx`），在既有 `app/admin/layout.tsx`（noindex）保護傘下。
- **守門**：`page.tsx` 是 **server component**，開頭
  `if (!(await isAuthenticated())) redirect("/admin/login?next=/admin/dashboard")`，
  然後 render `DashboardClient`（client component，同目錄 `DashboardClient.tsx` + `page.module.css`）。
- `DashboardClient` 掛載後 fetch `/api/admin/dashboard`；收 **401**（session 過期，8h）→ `router.push("/admin/login?next=/admin/dashboard")`。
  fetch 失敗 / 非 200 → 錯誤卡＋重試鈕（不留白畫面）。載入中 → skeleton/文字態。
- 「重新整理」鈕 → fetch `?refresh=1`。
- **跨 feature 最小改動（不 own、需蓋本 feature trailer）**：`app/admin/login/page.tsx` 成功後寫死
  `router.push('/admin/blog')`（`page.tsx:33`）——改為讀 `?next=` query param，**僅接受以 `/admin` 開頭的值**
  （防 open redirect），否則 fallback `/admin/blog`。只准這一處改動，零其他邏輯變動。
  另允許在 `/admin/blog` 頁 header 加一個「晨報」`<a href="/admin/dashboard">` 純連結（零邏輯）。

## 7. 頁面資訊架構（`/admin/dashboard`；視覺由 designer 出，CSS Modules + globals.css tokens）

**資訊架構照搬 sweetfun 版 7 區塊、順序不變**；所有 Tailwind class 換成 `page.module.css`，
色彩/字體/radius/shadow 一律引 `globals.css` 的 CSS variables（大地色 `--color-primary` 系，**不得**出現深藍金）。
注意 `app/admin/layout.tsx` 外層是深色 `#1a1a1a`：dashboard 頁自設淺色（cream）滿版背景蓋過。

1. **Header**：「Offland 晨報」＋日期＋asOf＋重新整理鈕。
2. **昨日卡**：昨天接單 X 組/Y 晚/NT$Z（平台 chips）；昨晚：有客（客名/平台/招待標記/營收）或空檔。
3. **今日卡**：今日入住組列表（客名、平台、**入住人數**、住幾晚、金額、K 備註原文、comp 標「招待」）；退房數；今晚：已訂或「空檔」大字警示。
4. **檔期條**：14 晚橫向格（今−6 … 今+7），每格日期/星期，booked=填色＋客名縮寫＋平台縮寫、empty=空格、週末晚標記、今晚高亮；窄幕水平捲動。
5. **近 7 天接單**：組/晚/金額 vs 前 7 天 delta；平台金額佔比（含 deltaPp）；daily14 純 div 長條（不引圖表庫）。
6. **AI 判讀卡**：verdict headline+basis；actions 清單（act=紅、watch=黃、ok=綠 —— 語意色由 designer 從大地色系延伸定義）。
7. **明細表**：last7.detail（BookingRow），窄幕水平捲動。

## 8. 測試策略（TDD：先 port 測試（紅）、再 port 實作（綠））

**Bootstrap vitest**：devDependencies 加 `vitest` + `@vitest/coverage-v8`；根目錄 `vitest.config.ts`
（environment: node、alias `@` → repo root 對齊 tsconfig）；package.json 加 `"test": "vitest run"`、`"test:coverage"`。

- **`__tests__/dashboard-utils.test.ts`**：port sweetfun `src/__tests__/dashboard-offland-utils.test.ts`
  （232 案例）——只改 import path，**不改任何 assertion**；因 4 個 helper 已內聯，補其直測案例
  （parseSlashDate 無效格式→null、parseAmount `"NT$6,400"`→6400、normPlatform alias、taipeiToday UTC 深夜=台北隔天）。
- **`__tests__/dashboard-api.test.ts`**：route 層——未登入 → 401 且 body 無數據、不呼叫 sheets（mock `lib/auth` 的
  `isAuthenticated` 與 `lib/sheets`，**不 mock 被測的 parse/compute 邏輯**）；已登入 → 200 envelope shape；
  sheets throw → 502；`?refresh=1` 略過 cache。
- 覆蓋率門檻：`lib/dashboard-utils.ts` ≥ 80%（沿用原達成的 98.66%，port 後不應掉）。
- **頁面元件測試（RTL/jsdom）v1 不引入** → 記 `docs/DEFERRED.md`。理由：repo 零測試基建，一次引 jsdom+RTL
  拉大搬家範圍；UI 正確性由 verifier 真實資料 smoke＋375px 檢查＋demo 錄影把關。重啟條件：admin 後台再長新互動頁。
- Adversarial（verifier 執行）：故意改壞一條 action 閾值常數 → 對應測試必須紅；驗完 revert，報告註記。

## 9. 明確不做（防 scope creep）

1. 不寫入 Google Sheet（唯讀）。
2. 不動 sweetfun-web repo 任何檔案（那邊的舊頁面下線由該 repo 自己的 cleanup 任務處理，不在本 feature）。
3. 不改 `lib/auth.ts` / `app/admin/layout.tsx` / `app/admin/blog`（連結除外）/ `app/globals.css`（token 只引用；若 designer 需新增變數，由其規格提出、frontend 最小新增）。
4. 不加 middleware.ts、不做 Bearer token / server-to-server 授權、不接 LINE 推播 / PWA（`summaryText` 只留接口）。
5. 不做取消語意（K「請客人取消」不解讀）、付款狀態（H）、N 欄對帳 → 沿用原 DEFERRED。
6. 不引圖表庫、不引 Tailwind、不做新設計系統。
7. 不做水芳資料 / 雙民宿合併視圖。

## 10. 驗收標準（verifier 逐條打勾）

1. `npm run build` 過（含 typecheck）。
2. `npm test` 綠：port 的 232 utils 案例全數通過＋內聯 helper 直測＋API guard 測試；`lib/dashboard-utils.ts` 覆蓋率 ≥ 80%。
3. Adversarial test passed（§8 末段）並已 revert。
4. 未登入直開 `/admin/dashboard` → 302 到 `/admin/login?next=/admin/dashboard`；登入成功 → 回到 `/admin/dashboard`。
5. `curl /api/admin/dashboard`（無 cookie）→ 401，body 只有 `{success:false,error:"unauthorized"}`。
6. 登入後頁面以真實 sheet 資料渲染：7 區塊全部有內容（今日卡含**入住人數**），console 無錯誤、無 `NaN` / `Invalid Date`。
7. 連住組（含無 `(連住)` 標記者）只算 1 組，晚數與金額正確加總；NT$0 網紅列在檔期條顯示已訂（招待標記）、營收計 0、未被丟棄。
8. 視覺：全頁只用 CSS Modules + `globals.css` tokens（大地色系），無 Tailwind class、無深藍金殘留；375px 不破版，檔期條與明細表可水平捲動。
9. 既有 `/admin/blog`、`/admin/login`、公開站頁面行為不變（login 僅多 `next` 支援，預設行為照舊）。
10. ≤60s demo：登入 → 捲過 7 區塊 → 展示未登入被擋（頁面 redirect + API 401）。
