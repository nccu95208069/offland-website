---
# Spec Lock front-matter — architect 是唯一寫入者。
# owns: 這個 feature「擁有」的實作檔 glob（相對 repo root）。
# 凡 commit 動到這些檔，就必須帶 `Aligned-with: <檔名>@<hash7>` trailer。
# 檔名（去掉 .md）即 feature 名：docs/specs/study-plan-edit.md → feature = study-plan-edit
owns:
  - "src/<feature>/**"
  - "services/<feature>*.ts"
---

# <Feature> 規格

> 指紋演算法：`git hash-object docs/specs/<feature>.md | cut -c1-7`
> commit 蓋戳：`Aligned-with: <feature>@<hash7>`（trailer，訊息末行）

## 目標

（這個 feature 解決什麼問題）

## 範圍

**做**
-

**明確不做**
-

## 驗收標準

（verifier 對照這段確認 feature 真的能用）
-
