import { COHORT_KEYS } from '@/lib/feed'
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
    totalUnits: 0,
    streakDays: 0,
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
  base.closed_week_number = '0'
  base.as_of = '2026-08-11 09:00'
  return { ...base, ...overrides }
}

export function feedCsv(rows: readonly Team[]): string {
  const header = 'team_id,venture_name,total_revenue,total_units,streak_days'
  const body = rows.map(
    (row) =>
      `${row.teamId},${row.ventureName},${row.totalRevenue},${row.totalUnits},${row.streakDays}`,
  )
  return [header, ...body].join('\n')
}

export function cohortCsv(values: Record<string, string>): string {
  const body = Object.entries(values).map(([key, value]) => `${key},${value}`)
  return ['key,value', ...body].join('\n')
}
