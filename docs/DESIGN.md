# DESIGN.md — Offland 民宿營運晨報 Admin Dashboard

> Designer spec for `feat/admin-dashboard`. Target route: `/dashboard` (or `/admin/dashboard`, TBD by architect) on **offland-yilan.com** — NOT sweetfun-web. Reference for layout/logic only: `sweetfun-web/src/app/dashboard-pulse/page.tsx` + `sweetfun-web/docs/specs/dashboard-pulse.md` (the brief's `dashboard-offland/page.tsx` path does not exist; `dashboard-pulse` is the actual matching implementation — same "昨日→今日→近7天→AI判讀" structure, currently in sweetfun-web's emerald palette which we are explicitly NOT reusing).
>
> CEO feedback being corrected: (1) previous deep-navy/gold palette rejected → replaced with Offland's own brand tokens, (2) previously built on the wrong domain (水芳) → this spec targets `offland-website` only.

---

## 0. ui-ux-pro-max reference citations (auditable)

Consulted `/Users/seanlo/.claude/skills/ui-ux-pro-max/data/` CSVs directly (no Bash tool in this session; queried via Grep/Read instead of `search.py`, same source data).

| Domain | Entry | Why cited |
|---|---|---|
| `styles.csv` #1 Minimalism & Swiss Style | "Best For: Enterprise apps, **dashboards**, admin panels" — clean, spacious, functional, high-contrast, grid-based | Base layout philosophy: no decoration for decoration's sake, structure carries the design. Matches CEO's "溫暖但不幼稚、有結構但不死板" brief. |
| `styles.csv` #39/#53 Bento Box Grid / Bento Grids | Modular cards, varied sizes, rounded corners, dashboard tiles, negative space | Stat-cell grid (今日/近7天數字卡) and section cards use bento-style modular blocks, not one dense monolithic table. |
| `styles.csv` #66 Editorial Grid/Magazine | Explicitly lists **"Dashboards, real-time data" under "Do Not Use For"** | Confirms we should NOT lean editorial/magazine (large pull-quotes, drop caps) for this page even though the rest of offland-website is editorial-serif. Dashboard is the one page that breaks from that voice toward function. |
| `typography.csv` #22 Japanese Elegant (Serif+Sans: Noto Serif JP + Noto Sans JP) | Closest analog pairing pattern to Offland's own Noto Serif TC (heading) + Inter (data) — CJK serif headline paired with clean sans for numbers | Confirms the brand's existing serif/sans split is sound practice, not overridden. |
| `charts.csv` #2 Compare Categories → Horizontal Bar Chart | "Each bar distinct color... sorted descending... add value labels on bars" | Directly informs the 平台佔比 (platform share) horizontal bar component. |
| `charts.csv` #5 Heatmap/Intensity → Grid Heat Map | "Colorblind: use pattern/texture overlay, provide numerical legend" | Directly informs the 檔期條 (occupancy strip) grid — binary occupied/vacant grid is a 2-value heatmap; the colorblind guidance is why occupied/vacant is NOT color-only (see §3). |
| `ux-guidelines.csv` #37 Accessibility / Color Only | "Don't convey information by color alone... Red text + error icon, not red border only" | Directly informs semantic color dual-encoding in §2 and §4. |
| `ux-guidelines.csv` #61, #78 Loading/Feedback states | Skeleton/spinner for waits >300ms, explicit loading→success/error states | Informs §7 empty/loading/error states. |

**Explicitly NOT used from ui-ux-pro-max**: any of its 97 color palettes. Per CEO instruction, brand color = Offland's own `globals.css` tokens exclusively. ui-ux-pro-max guided *pattern/layout/accessibility* choices only, never hex values.

---

## 1. Brand color mapping (single source of truth: `app/globals.css`)

No new brand hex values are introduced. Every dashboard surface maps to an existing CSS variable.

| Dashboard element | CSS variable | Value |
|---|---|---|
| Page background | `var(--color-bg-light)` | `#FAFAF8` |
| Card background | `var(--color-bg-white)` | `#FFFFFF` |
| Card border/definition | `rgba(44,44,44,0.06)` inset ring (see §5) — NOT `--color-accent` border, too heavy at this density | — |
| Section eyebrow chip bg | `var(--color-bg-cream)` | `#F5F1E8` |
| Primary interactive (buttons, links, active tab, "今晚已訂" hot stat) | `var(--color-primary)` / hover `var(--color-primary-dark)` | `#8B6F47` / `#6B5437` |
| Occupied-night fill (strip cells) | `var(--color-primary)` at full opacity | `#8B6F47` |
| Vacant-night fill (strip cells) | `var(--color-bg-cream)` + dashed inset ring | `#F5F1E8` |
| Headings (h1/h2/section title) | `var(--font-serif)` + `var(--color-text-primary)` | Noto Serif TC / `#2C2C2C` |
| Body/secondary text | `var(--color-text-secondary)` | `#6B6B6B` |
| Meta/timestamp text | `var(--color-text-light)` | `#9B9B9B` |
| Numeric data (stat values, table numbers, %) | `var(--font-en)` | Inter, `tabular-nums` |
| Card radius | `var(--radius-lg)` | 16px |
| Inner elements (stat cell, badge) | `var(--radius-md)` | 8px |
| Strip cell / tag radius | `var(--radius-sm)` | 4px |
| Shadows | `var(--shadow-sm)` default, `var(--shadow-md)` on hover/focus | per tokens |

No deep-navy hero band (that was a MathDNA-project convention accidentally carried over last time — not part of Offland's system at all). The dashboard opens directly into a plain `--color-bg-light` page with a simple text header, same weight as `about`/`blog` page headers minus the full-bleed hero — this is a **utility page**, not a marketing page, per Style #1 (Minimalism & Swiss) guidance above.

---

## 2. Semantic colors (red/yellow/green action system) — earth-tone version

Offland's system has no semantic (status) colors defined. Rather than importing generic Tailwind red-500/amber-500/emerald-500 (which would look like a foreign design system bolted onto a wabi-sabi site), these are derived **in the same low-chroma, warm-neutral tonal family as `--color-primary` (#8B6F47)** so they read as siblings of the brand color, not a clash.

```css
/* Add to globals.css :root, alongside existing brand vars */
--color-good: #6E8B5A;        /* 橄欖綠 — 有客/正向/不需行動 */
--color-good-bg: #EDF1E5;
--color-good-border: #C3D1AE;
--color-good-text: #4A5F3A;   /* text on light bg — ~7:1 contrast on white */

--color-warn: #C68A2E;        /* 赭黃 — 先觀察 */
--color-warn-bg: #FBF1DD;
--color-warn-border: #E8CB93;
--color-warn-text: #8F6620;

--color-alert: #B54B36;       /* 磚紅/赤陶 — 建議行動 */
--color-alert-bg: #F7E8E3;
--color-alert-border: #E3B3A5;
--color-alert-text: #8A3826;
```

**Colorblind-safe rule (from ux-guidelines #37 — mandatory, not optional):** color is never the sole signal. Every semantic-colored element pairs with one of:
- an icon (SVG, not emoji, per skill checklist): filled-circle-check for good, triangle-exclamation for warn, octagon-alert for alert
- a text label ("不需行動" / "先觀察" / "建議行動")
- both, as in the action list (§4)

---

## 3. 檔期條 (occupancy strip) visual encoding — the page's primary visual

This is the one component that most needs non-color differentiation since it's a dense grid a manager scans in under a second.

| State | Fill | Extra encoding (never color-only) |
|---|---|---|
| 有客 (occupied) | `var(--color-primary)` solid | filled square, no border needed — solid vs. empty is already a strong non-color signal |
| 空檔 (vacant) | `var(--color-bg-cream)` | 1px dashed `var(--color-accent)` inset ring — reads as "outline/empty" even in grayscale |
| 今晚 (tonight, current column) | same fill as occupied/vacant state | 1.5px solid `var(--color-primary-dark)` **inset ring** around the whole column (not fill change) — a shape/border cue, distinguishable without color |
| 週末 (Fri/Sat night) | no fill change | small 3px dot marker `var(--color-text-light)` centered below the weekday letter in the header row — orthogonal to the occupancy signal, never touches the cell itself |
| 招待 (comp/complimentary stay) | occupied fill unchanged | small ★ SVG icon (8px) overlaid bottom-right corner of the cell — icon-based, not a third color |

Cell radius: `var(--radius-sm)` (4px), consistent with concentric-radius rule (Schoger #2: card 16px → stat cell 8px → strip cell 4px, each nested radius shrinks with its container).

Grid header row: date (Inter, `--text-xs`, `--color-text-light`) over weekday (Noto Serif TC or Sans TC per `--font-sans`, bold, `--color-text-secondary`; `var(--color-primary)` + bold if it's the "今晚" column).

Two strips per spec: 近 7 晚 (ending today) and 未來 7 晚 (starting tomorrow) — same component, `highlightTonight` prop toggles the ring treatment (true only on the near-7 strip's last column).

---

## 4. Action list (紅黃綠 unified card)

Each action item is a row: `[icon+label badge] [title, bold, --color-text-primary] [evidence, --text-xs, --color-text-secondary]`.

Badge = pill, `var(--radius-md)`, background `--color-*-bg`, text `--color-*-text`, 1px border `--color-*-border`, containing icon (14px) + label text side by side — never icon-only, never color-only per §2.

Sort order top-to-bottom: alert → warn → good (most urgent first, matches existing dashboard-pulse behavior).

---

## 5. CSS Modules structure (`app/dashboard/dashboard.module.css`)

This is **not Tailwind** — Offland uses CSS Modules with `var(--...)` tokens. Frontend should build class names below; every color/spacing/radius value must reference a CSS variable, never a hardcoded hex (exception: the three semantic-color var declarations in §2, which are new tokens themselves and belong in `globals.css`, not the module file).

```
.page                    /* min-height:100vh; background: var(--color-bg-light); padding: var(--spacing-sm) on mobile, var(--spacing-md) desktop */
.container               /* max-width: 720px (dashboard is narrow/mobile-first, not full container-max); margin: 0 auto */

.header                  /* flex row, justify-between, align items baseline */
.headerTitle             /* font-serif, text-lg→text-xl responsive, tracking-tight (Schoger #5: 24px+ needs tighter tracking) */
.headerMeta              /* font-en, text-xs, color-text-light */
.navPill                 /* inline-block, height 36px, padding 0 var(--spacing-sm), border-radius: 999px (pill, Schoger #12 — deviates from the 16px radius scale intentionally for nav/action pills), background var(--color-bg-white), border 1px var(--color-accent), color var(--color-text-secondary); :hover → border-color var(--color-primary), color var(--color-primary) */
.refreshPill             /* same as navPill but background var(--color-bg-cream), color var(--color-primary), for the primary "刷新" action */

.sectionHead             /* flex row, align-items: baseline, gap: var(--spacing-xs), margin-top: var(--spacing-lg) */
.sectionTag              /* eyebrow: font-en, text 11px, uppercase, letter-spacing: 0.08em (Schoger #6 mono-style eyebrow substitute — no mono font in system, Inter uppercase+tracking stands in), background var(--color-bg-cream), color var(--color-primary-dark), border-radius: var(--radius-sm), padding: 2px 8px */
.sectionTitle            /* font-serif, text-lg, color var(--color-text-primary), font-weight 600 */
.sectionDate             /* font-en, text-xs, color var(--color-text-light) */

.statGrid                /* grid, grid-template-columns: repeat(2, 1fr) mobile / repeat(3, 1fr) ≥768px, gap: var(--spacing-xs) */
.statCell                /* background var(--color-bg-white); border-radius: var(--radius-md); padding: var(--spacing-sm); box-shadow: var(--shadow-sm); inset ring 1px rgba(44,44,44,.05) — Schoger #1/#3, ring not border+shadow stacked */
.statCellHot             /* background var(--color-bg-cream); ring color var(--color-primary) 15% opacity — for the one "needs attention now" stat, e.g. 今晚已訂 */
.statKey                 /* font-sans, text-xs, color var(--color-text-secondary), font-weight 500 */
.statValue                /* font-en, text-xl, font-weight 700, tabular-nums, color var(--color-text-primary) */
.statDim                 /* font-en, text-sm, color var(--color-text-light), font-weight 500 — the unit/suffix beside statValue */
.statNote                /* font-sans, text-xs (14px — below Schoger's 16px mobile-body floor, acceptable here since it's secondary annotation not primary reading content), color var(--color-text-light), line-height: 2 (Schoger #8: small text needs doubled line-height) */

.card                    /* background var(--color-bg-white); border-radius: var(--radius-lg); padding: var(--spacing-md); box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-sm) */
.cardTitle               /* font-sans, text-sm, font-weight 600, color var(--color-text-primary) */
.cardSub                 /* font-sans, text-xs, color var(--color-text-light); max-width: 40ch (Schoger #11) */

.table / .th / .td       /* .th: font-en, uppercase, 10px, letter-spacing .05em, color var(--color-text-light), border-bottom 1px var(--color-accent) at 40% opacity, text-align left; .td: font-sans text-xs, color var(--color-text-secondary), border-bottom 1px rgba(44,44,44,.04), tabular-nums for numeric columns */
.badgePaid / .badgeUnpaid /* pill, var(--radius-sm), border 1px, background var(--color-good-bg)/var(--color-alert-bg), color var(--color-good-text)/var(--color-alert-text) — 已付全額/未付全額 */

.stripWrap               /* overflow-x: auto on mobile */
.stripGrid                /* CSS grid, first column fixed (room label ~52px), remaining columns 1fr each, gap: 2px */
.stripHeadDate / .stripHeadDay  /* per §3 header row */
.stripRoomLabel          /* font-sans, text-xs, font-weight 600, color var(--color-text-primary) */
.stripCell                /* per §3 — base square, aspect-ratio near 1.4:1, border-radius var(--radius-sm) */
.stripCellOccupied / .stripCellVacant / .stripCellTonight / .stripCellWeekendDot / .stripCellComp  /* modifiers per §3 table */
.stripTotal               /* font-en, text-xs, tabular-nums, color var(--color-text-secondary); color var(--color-primary) + font-weight 700 when near-full */

.hbarRow                 /* grid: fixed label col / flexible track / fixed value col */
.hbarLabel                /* font-sans, text-sm, color var(--color-text-primary) */
.hbarTrack                /* background var(--color-bg-cream); border-radius: var(--radius-sm); height 14px; overflow hidden */
.hbarFill                 /* background var(--color-primary); height 100%; border-radius inherit */
.hbarFillFlat             /* background var(--color-accent) — for the "0 nights sold" flat/promo-candidate state */
.hbarValue                /* font-en, text-xs, tabular-nums, color var(--color-text-secondary), text-align right */
.deltaUp                 /* color var(--color-good-text), font-weight 600 */
.deltaDown                /* color var(--color-alert-text), font-weight 600 */
.deltaFlat                /* color var(--color-text-light) */

.verdictBanner            /* background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); border-radius: var(--radius-lg); padding: var(--spacing-md); color: white; box-shadow: var(--shadow-md) */
.verdictChip              /* pill, background rgba(255,255,255,.18), border 1px rgba(255,255,255,.35), font-en text-xs font-weight 700, padding 2px 10px */
.verdictHeadline          /* font-serif, text-lg, font-weight 600, line-height 1.3 */
.verdictBasis             /* font-sans, text-xs, color rgba(255,255,255,.75) */

.actionList / .actionItem / .actionBadgeGood / .actionBadgeWarn / .actionBadgeAlert / .actionTitle / .actionEvidence  /* per §4 */

.emptyState / .errorState / .loadingSpinner  /* per §7 */

.footer                   /* font-sans, text-xs, color var(--color-text-light), line-height 1.8, max-width: 60ch */
```

Responsive: follow existing `globals.css` breakpoints exactly — `max-width: 768px` (mobile, single-column stat grid, horizontal-scroll tables/strips) and `769px–1024px` (2-col). No new breakpoints invented. CEO views this on phone, so mobile-first authoring order in the CSS module (base rules = mobile, `@media (min-width: 769px)` scales up), matching how `about`/`blog` modules are structured.

---

## 6. Typography scale

| Role | Font | Size token | Weight |
|---|---|---|---|
| Page title (h1) | `var(--font-serif)` | `--text-xl` (32px desktop) / clamp down ~24px mobile via existing 768px override | 600, `tracking-tight` |
| Section title (h2-equivalent, `.sectionTitle`) | `var(--font-serif)` | `--text-lg` (24px) | 600 |
| Card title | `var(--font-sans)` (resolves to Noto Serif TC primary per existing tokens — intentional, keeps the site's serif-forward body voice even on the utility page) | `--text-sm` (16px) | 600 |
| Body / table / notes | `var(--font-sans)` | `--text-xs` (14px) for dense data, `--text-sm` (16px) for anything meant as primary reading (e.g. verdict headline copy, empty states) | 400–500 |
| All numeric values (stats, amounts, %, dates, counts) | `var(--font-en)` (Inter) | scales with context, always `tabular-nums` | 500–700 |
| Eyebrow/tag labels | `var(--font-en)` | 11px, uppercase, `letter-spacing: 0.08em` | 700 |

Rationale for keeping `--font-sans` (which is Noto Serif TC first, not a true sans) on card titles rather than forcing Inter/Noto Sans TC: this is intentional continuity with the rest of Offland's site voice, not an oversight — the dashboard should still feel like it belongs to offland-yilan.com, not like an imported generic admin template. Only *numbers* switch to Inter, per the brief's explicit "字型：Noto Serif TC + Inter" instruction — numbers need tabular alignment and legibility at a glance; Chinese labels don't.

---

## 7. Empty / error / loading states

Reuse the pattern already established in `app/blog/page.module.css` `.emptyState` (icon, opacity 0.4, h2 + p, `--color-text-light`) rather than inventing a new one:

- **No data for a section** (e.g. "今天沒有入住", "近 7 天沒有訂單"): inline within the card, `--text-sm`, `--color-text-light`, no icon needed at this small scale (matches sweetfun-web reference behavior).
- **Full-page loading**: centered spinner — a simple rotating ring using `var(--color-accent)` track / `var(--color-primary)` active arc (CSS `@keyframes`, reuse the rotate pattern, no new animation library), plus "載入中…" in `--color-text-secondary`.
- **Full-page error** (fetch failed / 401): centered card, `background: var(--color-alert-bg)`, `color: var(--color-alert-text)`, icon + message + a `.navPill`-style "重試" button in `var(--color-primary)`. Per ux-guidelines #61/#78: always show explicit state, never a silently frozen UI.
- **Skeleton over spinner** where a section reloads in place (e.g. "刷新" button clicked): keep existing card layout, dim content to 50% opacity + disable interaction, rather than swapping in a spinner and causing content jump (ux-guidelines "content-jumping" rule from the skill's Performance category).

---

## 8. Explicit deviations / additions to the existing design system

For architect/frontend awareness — these are new tokens or intentional departures, everything else strictly reuses existing `globals.css`:

1. **New tokens**: `--color-good/-bg/-border/-text`, `--color-warn/-bg/-border/-text`, `--color-alert/-bg/-border/-text` (§2) — add to `:root` in `globals.css`, not scoped to the dashboard module, since other admin surfaces will likely need the same semantic system later.
2. **Pill radius (999px)** for nav/badge/button elements — the token scale only goes to `--radius-lg` (16px); pills use a literal `border-radius: 999px` (or a new `--radius-pill` token if architect prefers a named variable).
3. **Narrower container** (`max-width: 720px` vs. the site's `--container-max: 1400px`) — this page is mobile-first utility content read primarily on a phone, not a wide marketing layout.
4. No hero band, no video, no fade-in scroll animations from `globals.css` (`.fade-in`, `.slide-down`) — those are marketing-page flourishes; a dashboard needs to render fast and static (ties back to ui-ux-pro-max Style #1 "Enterprise apps, dashboards" guidance: subtle transitions only, no scroll choreography).
