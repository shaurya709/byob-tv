import { COHORT_KEYS } from '@/lib/feed'
import type { MarketRow } from '@/lib/marketTypes'
import type { Team } from '@/lib/types'

/**
 * Test-only builders. Nothing under `app/`, `components/` or `lib/` may import
 * this file — the wall has exactly one data source and a fixture reachable from
 * the running app is a screenshot waiting to be mistaken for real performance.
 */

export function team(overrides: Partial<Team> = {}): Team {
  return {
    teamId: 'SLE-C401',
    ventureName: 'Aurora',
    totalRevenue: 0,
    weekRevenue: 0,
    todayRevenue: 0,
    totalUnits: 0,
    challengeRevenue: 0,
    ...overrides,
  }
}

/** 42 teams, all named, all on zero — the shape of the cohort before trading. */
export function teams(overrides: Partial<Team>[] = []): Team[] {
  const rows = Array.from({ length: 42 }, (_, index) =>
    team({
      teamId: `SLE-C4${String(index + 1).padStart(2, '0')}`,
      ventureName: `Venture ${index + 1}`,
    }),
  )
  for (const override of overrides) {
    const at = rows.findIndex((row) => row.teamId === override.teamId)
    if (at === -1) throw new Error(`fixture: unknown teamId ${override.teamId}`)
    rows[at] = { ...rows[at], ...override }
  }
  return rows
}

/** Every cohort key present and empty, which is the state before any sale. */
export function cohort(overrides: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = {}
  for (const key of COHORT_KEYS) base[key] = ''
  base.as_of = '11 Aug 14:23'
  base.current_open_week = '4'
  base.flea_datetime_iso = '2026-09-06T10:00:00+05:30'
  return { ...base, ...overrides }
}

export function feedCsv(rows: readonly Team[]): string {
  const header = 'team_id,venture_name,total_revenue,week_revenue,today_revenue,total_units'
  const body = rows.map(
    (row) =>
      `${row.teamId},${row.ventureName},${row.totalRevenue},${row.weekRevenue},${row.todayRevenue},${row.totalUnits}`,
  )
  return [header, ...body].join('\n')
}

export function cohortCsv(values: Record<string, string>): string {
  const body = Object.entries(values).map(([key, value]) => `${key},${value}`)
  return ['key,value', ...body].join('\n')
}

// ── Mesa Flea market board ──────────────────────────────────────────────────

/** The window the real board runs: 13 September 2026, 09:00–21:00 IST. */
export const MARKET_WINDOW = {
  start: '2026-09-13T09:00:00+05:30',
  end: '2026-09-13T21:00:00+05:30',
} as const

export function marketRow(overrides: Partial<MarketRow> = {}): MarketRow {
  return {
    teamId: 'SLE-C401',
    ventureName: 'Dosa Crisps',
    takings: 0,
    txns: 0,
    lastSaleAt: null,
    ...overrides,
  }
}

/**
 * 40 stalls, all named, all on zero — the shape of the market at the opening
 * bell, and the case the comparator's total order exists for.
 */
export function marketRows(overrides: Partial<MarketRow>[] = []): MarketRow[] {
  const rows = Array.from({ length: 40 }, (_, index) =>
    marketRow({
      teamId: `SLE-C4${String(index + 1).padStart(2, '0')}`,
      ventureName: `Stall ${index + 1}`,
    }),
  )
  for (const override of overrides) {
    const at = rows.findIndex((row) => row.teamId === override.teamId)
    if (at === -1) throw new Error(`fixture: unknown teamId ${override.teamId}`)
    rows[at] = { ...rows[at], ...override }
  }
  return rows
}

/**
 * `MesaFlea_TV` as text. The window and stamp repeat on every row because the
 * sheet publishes one cell forty times — which is exactly what `parseMarket`'s
 * agreement check is written against.
 */
export function marketCsv(
  rows: readonly MarketRow[],
  options: { start?: string; end?: string; asOf?: string; lastSaleColumn?: boolean } = {},
): string {
  const {
    start = MARKET_WINDOW.start,
    end = MARKET_WINDOW.end,
    asOf = '13 Sep 18:45',
    lastSaleColumn = true,
  } = options
  const header = [
    'team_id',
    'venture_name',
    'flea_revenue',
    'flea_txns',
    ...(lastSaleColumn ? ['last_sale_at'] : []),
    'window_start_iso',
    'window_end_iso',
    'as_of',
  ].join(',')
  const body = rows.map((row) =>
    [
      row.teamId,
      row.ventureName,
      row.takings,
      row.txns,
      ...(lastSaleColumn ? [row.lastSaleAt === null ? '' : row.lastSaleAt.toISOString()] : []),
      start,
      end,
      asOf,
    ].join(','),
  )
  return [header, ...body].join('\n')
}
