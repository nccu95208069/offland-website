# OFFLAND 專案 Git 工作流程

## 快速參考

### 日常開發流程

```bash
# 1. 開始新功能
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. 開發並提交
# 修改檔案...
/commit  # 使用 Claude skill 自動生成 commit 訊息

# 3. 完成功能並建立 PR
/commit-push-pr  # 自動推送並建立 PR

# 4. PR 合併後清理
git checkout main
git pull origin main
/clean_gone  # 清理已刪除的分支
```

### 分支命名規範

- `feature/描述` - 新功能
- `bugfix/描述` - Bug 修復
- `hotfix/描述` - 緊急修復

### Commit 訊息格式

```
<type>(<scope>): <subject>

<body>
```

**Type**: feat, fix, docs, style, refactor, perf, test, chore

**範例**:
```
feat(analytics): add booking button tracking
fix(navigation): resolve mobile menu overflow
docs(readme): update installation guide
```

## 詳細指南

請參考 [Git 最佳實踐完整指南](file:///Users/seanlo/.gemini/antigravity/brain/7c0c6701-c68f-4726-bb3e-1331851c2fa7/git_best_practices.md)
