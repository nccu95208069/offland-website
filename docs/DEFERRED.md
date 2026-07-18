# DEFERRED — 推遲/略過的工作追蹤

| 日期 | 項目 | 推遲原因 | 重啟條件 |
|------|------|---------|---------|
| 2026-07-19 | 晨報頁元件測試（RTL/jsdom：DashboardClient 及子元件的 render/互動測試） | 本 repo 零測試基建，一次引入 jsdom+React Testing Library 會拉大「搬家」範圍（spec §8）。UI 正確性改由 verifier 真實資料 smoke ＋ 375px 檢查 ＋ demo 錄影把關。utils/route 的 72 測試不受影響。 | admin 後台再長出新的互動頁（表單、篩選、狀態機）時一併補上元件測試基建。 |
