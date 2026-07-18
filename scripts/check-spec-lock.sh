#!/usr/bin/env bash
# ============================================================================
# check-spec-lock.sh — Spec Lock 對齊閘門（project-agnostic drop-in）
# ----------------------------------------------------------------------------
# 母藍圖：~/.claude/UPGRADE_BLUEPRINT.md  §#3 Spec Lock（漸進式）
#
# 驗證：凡 commit 動到某 feature spec「擁有」的實作檔，該 commit range 必須帶
#   Aligned-with: <feature>@<hash7>
# trailer，且 <hash7> == 當前 `git hash-object docs/specs/<feature>.md | cut -c1-7`。
#
#   Phase 1（預設）：違規 → 警告、exit 0（不擋 merge）      SPEC_LOCK_PHASE=1
#   Phase 2        ：違規 → 擋下、exit 1                      SPEC_LOCK_PHASE=2
#
# 容差（藍圖 #6）：
#   - 只動到 spec 檔本身（architect 改 spec）→ 免戳
#   - 動到沒有任何 feature 認領的檔（純 docs/typo/設定）→ 免戳
#
# 用法：
#   check-spec-lock.sh [<git-range>]            # 預設 HEAD~1..HEAD
#   SPEC_LOCK_PHASE=2 check-spec-lock.sh origin/main..HEAD
#
# 環境變數：
#   SPEC_LOCK_PHASE       1|2（預設 1）
#   SPEC_LOCK_SPECS_DIR   spec 目錄（預設 docs/specs）
# ============================================================================
set -uo pipefail

SPECS_DIR="${SPEC_LOCK_SPECS_DIR:-docs/specs}"
PHASE="${SPEC_LOCK_PHASE:-1}"
RANGE="${1:-HEAD~1..HEAD}"

log() { printf '%s\n' "$*" >&2; }

# --- 1. 掃描 specs：建 feature→hash7 表 + (feature,glob) manifest ----------
HASHES=""    # 每行： feature <TAB> hash7
MANIFEST=""  # 每行： feature <TAB> glob

if [ -d "$SPECS_DIR" ]; then
  for spec in "$SPECS_DIR"/*.md; do
    [ -e "$spec" ] || continue
    feature="$(basename "$spec" .md)"
    hash7="$(git hash-object "$spec" | cut -c1-7)"
    HASHES="${HASHES}${feature}	${hash7}
"
    # 只解析第一個 front-matter 區塊內的 owns: 清單
    globs="$(awk '
      /^---[[:space:]]*$/ { dash++; next }
      dash==1 && /^owns:[[:space:]]*$/ { inb=1; next }
      inb==1 {
        if ($0 ~ /^[[:space:]]+-[[:space:]]*/) {
          line=$0; sub(/^[[:space:]]+-[[:space:]]*/,"",line);
          sub(/[[:space:]]*#.*/,"",line);
          gsub(/["'\'' ]/,"",line);
          if (line != "") print line;
        } else if ($0 ~ /^[^[:space:]]/) { inb=0 }
      }' "$spec")"
    while IFS= read -r g; do
      [ -n "$g" ] || continue
      MANIFEST="${MANIFEST}${feature}	${g}
"
    done <<EOF
$globs
EOF
  done
fi

feat_hash() { printf '%s' "$HASHES"  | awk -F'\t' -v f="$1" '$1==f{print $2; exit}'; }
stamp_hash(){ printf '%s' "$STAMPS"  | awk -F'\t' -v f="$1" '$1==f{print $2; exit}'; }

# --- 2. 算 range 內變更的實作檔 → 觸及哪些 feature -------------------------
CHANGED="$(git diff --name-only "$RANGE" 2>/dev/null || true)"
TOUCHED=""

while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in
    "$SPECS_DIR"/*) continue ;;   # spec 檔本身 → 免戳（容差）
  esac
  while IFS='	' read -r mfeat mglob; do
    [ -n "$mfeat" ] || continue
    # shellcheck disable=SC2254  # $mglob 刻意當 glob pattern
    case "$file" in
      $mglob) TOUCHED="${TOUCHED}${mfeat}
" ;;
    esac
  done <<EOF
$MANIFEST
EOF
done <<EOF
$CHANGED
EOF

TOUCHED="$(printf '%s' "$TOUCHED" | sed '/^$/d' | sort -u)"

# --- 3. 收集 range 內所有 Aligned-with trailer ----------------------------
BODIES="$(git log --format=%B "$RANGE" 2>/dev/null || true)"
STAMPS="$(printf '%s\n' "$BODIES" \
  | sed -n 's/^Aligned-with:[[:space:]]*\([A-Za-z0-9._\/-]\{1,\}\)@\([0-9a-fA-F]\{7,40\}\).*/\1	\2/p' \
  | awk -F'\t' '{print $1"\t"substr($2,1,7)}')"

# --- 4. 比對 ---------------------------------------------------------------
violations=0
oks=0

if [ -z "$TOUCHED" ]; then
  log "Spec Lock：本次變更未觸及任何受規格管轄的實作檔（免戳）。"
  exit 0
fi

while IFS= read -r feat; do
  [ -n "$feat" ] || continue
  cur="$(feat_hash "$feat")"
  # 收集 range 內「該 feature」的所有戳記 hash（可能有多個：改錯又改對、revert 等）
  gots="$(printf '%s' "$STAMPS" | awk -F'\t' -v f="$feat" '$1==f{print $2}')"
  if [ -z "$gots" ]; then
    log "✗ [$feat] 缺對齊戳記 — 動了 $feat 的實作檔，但 commit 沒有 'Aligned-with: $feat@$cur' trailer"
    violations=$((violations + 1))
  elif printf '%s\n' "$gots" | grep -qx "$cur"; then
    # PR 層級：range 內只要有任一戳記對上當前指紋就算對齊（容忍中途改錯又改對 / revert）
    log "✓ [$feat] 對齊 $cur"
    oks=$((oks + 1))
  else
    log "✗ [$feat] 對齊的是舊版規格 $(printf '%s' "$gots" | paste -sd, -)，現在已是 ${cur} — 請重讀 spec 後重新蓋戳"
    violations=$((violations + 1))
  fi
done <<EOF
$TOUCHED
EOF

# --- 5. 收尾（漸進式嚴格度）-----------------------------------------------
if [ "$violations" -gt 0 ]; then
  if [ "$PHASE" = "2" ]; then
    log ""
    log "Spec Lock [Phase 2] 擋下 merge：$violations 個對齊違規。"
    exit 1
  fi
  log ""
  log "Spec Lock [Phase 1] 警告：$violations 個對齊違規（不擋 merge）。升級 SPEC_LOCK_PHASE=2 後會擋。"
  exit 0
fi

log "Spec Lock：$oks 個 feature 對齊通過，無違規。"
exit 0
