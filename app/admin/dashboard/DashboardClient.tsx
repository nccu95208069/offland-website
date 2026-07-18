'use client';

// Offland 晨報 client 元件。Spec §7 的 7 區塊、DESIGN.md 的視覺規格。
// 資料由 GET /api/admin/dashboard 供給（?refresh=1 手動刷新）；型別搬自 @/lib/dashboard-utils。
// 語意色（好/觀察/警示）永遠 icon + 文字雙編碼，不靠顏色單一（DESIGN §2，a11y）。
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
    OfflandData,
    OfflandAction,
    OfflandBookingRow,
    OfflandStripNight,
    OfflandPlatformShare,
} from '@/lib/dashboard-utils';
import styles from './dashboard.module.css';

// API envelope（route 回 { success, data } / { success, error }；utils 未 export，前端本地定義）。
type DashboardResponse =
    | { success: true; data: OfflandData }
    | { success: false; error: string };

const WEEKDAY_CH = ['日', '一', '二', '三', '四', '五', '六'];

function nt(n: number): string {
    return `NT$${n.toLocaleString('en-US')}`;
}

function formatFullDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const wd = WEEKDAY_CH[new Date(y, m - 1, d).getDay()];
    return `${m}月${d}日 週${wd}`;
}

function mdFromIso(iso: string): string {
    const [, m, d] = iso.split('-').map(Number);
    return `${m}/${d}`;
}

/** booked 格顯示的客名縮寫（取前 2 字）。 */
function nameAbbr(name: string | null): string {
    if (!name) return '';
    return name.replace(/[（(].*$/, '').trim().slice(0, 2);
}

// ─── 語意 icon（SVG，非 emoji；DESIGN §2）────────────────────────
function IconGood() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
            <path d="M4.5 8.2l2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconWarn() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1.5l6.5 11.5H1.5L8 1.5z" fill="currentColor" opacity="0.15" />
            <path d="M8 3.5l5.5 9.5h-11L8 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M8 6.5v2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.9" fill="currentColor" />
        </svg>
    );
}
function IconAlert() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5.4 1.7h5.2l3.7 3.7v5.2l-3.7 3.7H5.4L1.7 10.6V5.4L5.4 1.7z" fill="currentColor" opacity="0.15" />
            <path d="M5.6 2.2h4.8l3.4 3.4v4.8l-3.4 3.4H5.6l-3.4-3.4V5.6l3.4-3.4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M8 5v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.9" fill="currentColor" />
        </svg>
    );
}
function IconStar() {
    return (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            <path d="M5 0l1.3 3.1L9.5 3.4 7 5.6l.8 3.4L5 7.2 2.2 9l.8-3.4L.5 3.4l3.2-.3z" />
        </svg>
    );
}

const LEVEL_META: Record<OfflandAction['level'], { badge: string; label: string; Icon: () => React.JSX.Element }> = {
    act: { badge: styles.actionBadgeAlert, label: '建議行動', Icon: IconAlert },
    watch: { badge: styles.actionBadgeWarn, label: '先觀察', Icon: IconWarn },
    ok: { badge: styles.actionBadgeGood, label: '不需行動', Icon: IconGood },
};

// ─── 小元件 ──────────────────────────────────────────────────────
function SectionHead({ tag, title, date }: { tag: string; title: string; date?: string }) {
    return (
        <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>{tag}</span>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {date && <span className={styles.sectionDate}>{date}</span>}
        </div>
    );
}

function PlatformChips({ platforms }: { platforms: { name: string; orders: number }[] }) {
    if (platforms.length === 0) return null;
    return (
        <div className={styles.chipRow}>
            {platforms.map((p) => (
                <span key={p.name} className={styles.chip}>
                    {p.name}
                    <span className={styles.chipNum}>×{p.orders}</span>
                </span>
            ))}
        </div>
    );
}

function StatCell({ k, value, dim, note, hot }: { k: string; value: string; dim?: string; note?: string; hot?: boolean }) {
    return (
        <div className={hot ? `${styles.statCell} ${styles.statCellHot}` : styles.statCell}>
            <div className={styles.statKey}>{k}</div>
            <div className={styles.statValueRow}>
                <span className={styles.statValue}>{value}</span>
                {dim && <span className={styles.statDim}>{dim}</span>}
            </div>
            {note && <div className={styles.statNote}>{note}</div>}
        </div>
    );
}

function DeltaText({ delta, unit }: { delta: number; unit: string }) {
    const cls = delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaFlat;
    const sign = delta > 0 ? '+' : '';
    return <span className={cls}>{sign}{delta.toLocaleString('en-US')}{unit}</span>;
}

// ─── strip（檔期條，14 晚：今−6 … 今+7；DESIGN §3）──────────────
function OccupancyStrip({ nights }: { nights: OfflandStripNight[] }) {
    return (
        <div className={styles.stripWrap}>
            <div className={styles.stripGrid} style={{ gridTemplateColumns: `repeat(${nights.length}, minmax(34px, 1fr))` }}>
                {nights.map((n) => {
                    const cellClasses = [styles.stripCell];
                    if (n.booked) cellClasses.push(styles.stripCellOccupied);
                    else cellClasses.push(styles.stripCellVacant);
                    if (n.phase === 'today') cellClasses.push(styles.stripCellTonight);
                    return (
                        <div key={n.date} className={styles.stripCol}>
                            <div className={styles.stripHeadDate}>{mdFromIso(n.date)}</div>
                            <div className={n.phase === 'today' ? `${styles.stripHeadDay} ${styles.stripHeadDayToday}` : styles.stripHeadDay}>
                                {WEEKDAY_CH[n.weekday]}
                                {n.isWeekend && <span className={styles.weekendDot} aria-hidden="true" />}
                            </div>
                            <div className={cellClasses.join(' ')} title={n.booked ? `${n.guestName ?? ''}${n.comp ? '（招待）' : ''}` : '空檔'}>
                                {n.booked && <span className={styles.stripCellName}>{nameAbbr(n.guestName)}</span>}
                                {n.comp && (
                                    <span className={styles.stripCompStar} title="招待">
                                        <IconStar />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── 平台佔比橫條（DESIGN §5 hbar / charts.csv #2）───────────────
function PlatformShareBars({ platforms }: { platforms: OfflandPlatformShare[] }) {
    if (platforms.length === 0) {
        return <div className={styles.inlineEmpty}>近 7 天沒有訂單</div>;
    }
    const max = Math.max(...platforms.map((p) => p.sharePct), 1);
    return (
        <div className={styles.hbarList}>
            {platforms.map((p) => (
                <div key={p.name} className={styles.hbarRow}>
                    <span className={styles.hbarLabel}>{p.name}</span>
                    <span className={styles.hbarTrack}>
                        <span
                            className={p.amount > 0 ? styles.hbarFill : styles.hbarFillFlat}
                            style={{ width: `${(p.sharePct / max) * 100}%` }}
                        />
                    </span>
                    <span className={styles.hbarValue}>
                        {Math.round(p.sharePct)}%
                        {p.deltaPp !== null && (
                            <span className={styles.hbarDelta}>
                                {' '}
                                <DeltaText delta={Math.round(p.deltaPp)} unit="pp" />
                            </span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── daily14 純 div 長條（不引圖表庫；spec §7-5）─────────────────
function Daily14Bars({ daily14 }: { daily14: { date: string; orders: number; amount: number }[] }) {
    const max = Math.max(...daily14.map((d) => d.amount), 1);
    return (
        <div className={styles.daily14}>
            {daily14.map((d) => (
                <div key={d.date} className={styles.daily14Col} title={`${mdFromIso(d.date)}：${d.orders} 組・${nt(d.amount)}`}>
                    <div className={styles.daily14Track}>
                        <div className={styles.daily14Fill} style={{ height: `${(d.amount / max) * 100}%` }} />
                    </div>
                    <div className={styles.daily14Label}>{mdFromIso(d.date)}</div>
                </div>
            ))}
        </div>
    );
}

// ─── 明細表（last7.detail / yesterday.detail）────────────────────
function DetailTable({ rows }: { rows: OfflandBookingRow[] }) {
    if (rows.length === 0) {
        return <div className={styles.inlineEmpty}>沒有明細</div>;
    }
    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>接單日</th>
                        <th className={styles.th}>平台</th>
                        <th className={styles.th}>客名</th>
                        <th className={styles.th}>入住</th>
                        <th className={styles.thNum}>晚</th>
                        <th className={styles.thNum}>人</th>
                        <th className={styles.thNum}>提前</th>
                        <th className={styles.thNum}>金額</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={`${r.guestName}-${r.checkIn}-${i}`}>
                            <td className={styles.td}>{r.bookingDate ? mdFromIso(r.bookingDate) : '—'}</td>
                            <td className={styles.td}>{r.platform}</td>
                            <td className={styles.td}>
                                {r.guestName}
                                {r.comp && <span className={styles.compTag}>招待</span>}
                            </td>
                            <td className={styles.td}>{mdFromIso(r.checkIn)}</td>
                            <td className={styles.tdNum}>{r.nights}</td>
                            <td className={styles.tdNum}>{r.headcount ?? '—'}</td>
                            <td className={styles.tdNum}>{r.leadDays !== null ? `${r.leadDays}天` : '—'}</td>
                            <td className={styles.tdNum}>{r.comp ? '招待' : nt(r.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── 主元件 ──────────────────────────────────────────────────────
export default function DashboardClient() {
    const router = useRouter();
    const [data, setData] = useState<OfflandData | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(
        async (refresh = false) => {
            if (refresh) setRefreshing(true);
            else setStatus('loading');
            try {
                const res = await fetch(`/api/admin/dashboard${refresh ? '?refresh=1' : ''}`, {
                    cache: 'no-store',
                });
                if (res.status === 401) {
                    router.push('/admin/login?next=/admin/dashboard');
                    return;
                }
                const body: DashboardResponse = await res.json();
                if (!res.ok || !body.success) {
                    setStatus('error');
                    return;
                }
                setData(body.data);
                setStatus('ready');
            } catch {
                setStatus('error');
            } finally {
                setRefreshing(false);
            }
        },
        [router]
    );

    useEffect(() => {
        load();
    }, [load]);

    if (status === 'loading') {
        return (
            <div className={styles.page}>
                <div className={styles.centerState}>
                    <div className={styles.spinner} aria-hidden="true" />
                    <p className={styles.centerStateText}>載入中…</p>
                </div>
            </div>
        );
    }

    if (status === 'error' || !data) {
        return (
            <div className={styles.page}>
                <div className={styles.errorState}>
                    <IconAlert />
                    <p className={styles.errorStateText}>晨報載入失敗，請稍後再試。</p>
                    <button type="button" className={styles.refreshPill} onClick={() => load()}>
                        重試
                    </button>
                </div>
            </div>
        );
    }

    const { yesterday, today, last7, occupancy, strip, verdict, upcoming } = data;

    return (
        <div className={styles.page}>
            <div className={`${styles.container} ${refreshing ? styles.refreshing : ''}`}>
                {/* 1. Header */}
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.headerTitle}>Offland 晨報</h1>
                        <div className={styles.headerMeta}>
                            {formatFullDate(today.date)}　資料時間 {today.asOf}
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.refreshPill}
                        onClick={() => load(true)}
                        disabled={refreshing}
                    >
                        {refreshing ? '更新中…' : '刷新'}
                    </button>
                </header>

                {/* 2. 昨日卡 */}
                <SectionHead tag="YESTERDAY" title="昨日狀況" date={formatFullDate(yesterday.date)} />
                <div className={styles.card}>
                    <div className={styles.statGrid}>
                        <StatCell k="昨日接單" value={String(yesterday.orders)} dim="組" />
                        <StatCell k="訂到晚數" value={String(yesterday.nights)} dim="晚" />
                        <StatCell k="接單金額" value={nt(yesterday.amount)} />
                    </div>
                    <PlatformChips platforms={yesterday.platforms} />
                    <div className={styles.nightLine}>
                        <span className={styles.nightLabel}>昨晚</span>
                        {yesterday.lastNight.occupied ? (
                            <span className={styles.nightOccupied}>
                                <IconGood /> 有客・{yesterday.lastNight.guestName}
                                {yesterday.lastNight.platform ? `（${yesterday.lastNight.platform}）` : ''}
                                {yesterday.lastNight.comp && <span className={styles.compTag}>招待</span>}
                                {!yesterday.lastNight.comp && (
                                    <span className={styles.nightRevenue}>{nt(yesterday.lastNight.revenue)}</span>
                                )}
                            </span>
                        ) : (
                            <span className={styles.nightVacant}>
                                <IconWarn /> 空檔
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. 今日卡 */}
                <SectionHead tag="TODAY" title="今日入住" date={formatFullDate(today.date)} />
                <div className={styles.card}>
                    <div className={styles.tonightBox}>
                        <span className={styles.tonightLabel}>今晚</span>
                        {today.tonight.occupied ? (
                            <span className={styles.tonightOccupied}>
                                <IconGood /> 已訂・{today.tonight.guestName}
                                {today.tonight.platform ? `（${today.tonight.platform}）` : ''}
                                {today.tonight.comp && <span className={styles.compTag}>招待</span>}
                            </span>
                        ) : (
                            <span className={styles.tonightVacant}>
                                <IconAlert /> 今晚空檔
                            </span>
                        )}
                    </div>
                    <div className={styles.statGridSmall}>
                        <StatCell k="今日入住" value={String(today.checkIns.length)} dim="組" hot={today.checkIns.length > 0} />
                        <StatCell k="今日退房" value={String(today.checkOutsCount)} dim="組" />
                    </div>
                    {today.checkIns.length > 0 ? (
                        <div className={styles.checkInList}>
                            {today.checkIns.map((c, i) => (
                                <div key={`${c.guestName}-${i}`} className={styles.checkInItem}>
                                    <div className={styles.checkInHead}>
                                        <span className={styles.checkInName}>{c.guestName}</span>
                                        <span className={styles.checkInPlatform}>{c.platform}</span>
                                        {c.comp && <span className={styles.compTag}>招待</span>}
                                    </div>
                                    <div className={styles.checkInMeta}>
                                        <span>{c.headcount !== null ? `${c.headcount} 人` : '人數未填'}</span>
                                        <span className={styles.metaDivider}>·</span>
                                        <span>住 {c.nights} 晚</span>
                                        <span className={styles.metaDivider}>·</span>
                                        <span>退房 {mdFromIso(c.checkOut)}</span>
                                        <span className={styles.metaDivider}>·</span>
                                        <span className={styles.checkInAmount}>{c.comp ? '招待' : nt(c.amount)}</span>
                                    </div>
                                    {c.notes.length > 0 && (
                                        <div className={styles.checkInNotes}>備註：{c.notes.join('；')}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.inlineEmpty}>今天沒有入住</div>
                    )}
                </div>

                {/* 4. 檔期條 */}
                <SectionHead tag="OCCUPANCY" title="檔期概況" date="今−6 … 今+7" />
                <div className={styles.card}>
                    <OccupancyStrip nights={strip.nights} />
                    <div className={styles.occSummary}>
                        <span>
                            未來 7 晚已訂 <strong className={styles.occNum}>{occupancy.next7Booked}</strong>/7
                        </span>
                        <span className={styles.metaDivider}>·</span>
                        <span>
                            未來 14 晚已訂 <strong className={styles.occNum}>{occupancy.next14Booked}</strong>/14
                        </span>
                        {occupancy.weekendEmptyNext7.length > 0 && (
                            <>
                                <span className={styles.metaDivider}>·</span>
                                <span className={styles.occWeekend}>
                                    <IconWarn /> 週末還空：{occupancy.weekendEmptyNext7.map(mdFromIso).join('、')}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 5. 近 7 天接單 */}
                <SectionHead tag="LAST 7 DAYS" title="近 7 天接單" date={`${mdFromIso(last7.from)} – ${mdFromIso(last7.to)}`} />
                <div className={styles.card}>
                    <div className={styles.statGrid}>
                        <StatCell
                            k="接單組數"
                            value={String(last7.orders)}
                            dim="組"
                            note={`前 7 天 ${last7.orders - last7.vsPrev7.ordersDelta} 組`}
                        />
                        <StatCell k="房晚" value={String(last7.nights)} dim="晚" />
                        <StatCell
                            k="接單金額"
                            value={nt(last7.amount)}
                            note={
                                last7.vsPrev7.amountDeltaPct !== null
                                    ? `較前 7 天 ${last7.vsPrev7.amountDeltaPct >= 0 ? '+' : ''}${Math.round(last7.vsPrev7.amountDeltaPct)}%`
                                    : '前 7 天無接單'
                            }
                        />
                    </div>
                    <div className={styles.deltaRow}>
                        <span>組數 </span>
                        <DeltaText delta={last7.vsPrev7.ordersDelta} unit=" 組" />
                        <span className={styles.metaDivider}>·</span>
                        <span>金額 </span>
                        <DeltaText delta={last7.vsPrev7.amountDelta} unit="" />
                        {last7.leadTimeMedianDays !== null && (
                            <>
                                <span className={styles.metaDivider}>·</span>
                                <span>提前訂中位數 {last7.leadTimeMedianDays} 天</span>
                            </>
                        )}
                    </div>

                    <div className={styles.subHead}>平台金額佔比</div>
                    <PlatformShareBars platforms={last7.platforms} />

                    <div className={styles.subHead}>近 14 天每日接單金額</div>
                    <Daily14Bars daily14={last7.daily14} />

                    {upcoming.orders > 0 && (
                        <div className={styles.upcomingLine}>
                            未來已接單 {upcoming.orders} 組・{upcoming.nights} 晚・{nt(upcoming.amount)}
                        </div>
                    )}
                </div>

                {/* 6. AI 判讀卡 */}
                <SectionHead tag="VERDICT" title="AI 判讀" />
                <div className={styles.verdictBanner}>
                    <span className={styles.verdictChip}>
                        {verdict.level === 'up' ? '動能回升' : verdict.level === 'down' ? '動能轉弱' : verdict.level === 'quiet' ? '無新訂單' : '大致持平'}
                    </span>
                    <div className={styles.verdictHeadline}>{verdict.headline}</div>
                    <div className={styles.verdictBasis}>{verdict.basis}</div>
                </div>
                <div className={styles.actionList}>
                    {data.actions.map((a, i) => {
                        const meta = LEVEL_META[a.level];
                        const Icon = meta.Icon;
                        return (
                            <div key={i} className={styles.actionItem}>
                                <span className={`${styles.actionBadge} ${meta.badge}`}>
                                    <Icon />
                                    {meta.label}
                                </span>
                                <div className={styles.actionBody}>
                                    <div className={styles.actionTitle}>{a.title}</div>
                                    <div className={styles.actionEvidence}>{a.evidence}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 7. 明細表 */}
                <SectionHead tag="DETAIL" title="近 7 天接單明細" />
                <div className={styles.card}>
                    <DetailTable rows={last7.detail} />
                </div>

                <footer className={styles.footer}>
                    Offland 營運晨報・資料來源：訂單工作表（唯讀）・時區 Asia/Taipei・
                    每 5 分鐘更新，可按「刷新」立即重抓。
                </footer>
            </div>
        </div>
    );
}
