import Papa from 'papaparse'

import { COHORT_CSV_URL, FEED_CSV_URL, MIN_TEAM_ROWS } from '@/config'
import type { Cohort, CsvCache, Snapshot, Team } from '@/lib/types'

/**
 * Turning published CSV into a `Snapshot`, and deciding whether to trust it.
 *
 * The contract with the sheet is checked here and nowhere else: a missing
 * header or a missing cohort key throws, loudly, and the caller discards the
 * whole tick. There is no guessing at a column — that is how a wall ends up
 * confidently wrong for a week.
 */

export const FEED_HEADERS = [
  'team_id',
  'venture_name',
  'total_revenue',
  'total_units',
  'streak_days',
] as const

export const COHORT_KEYS = [
  'as_of',
  'biggest_sale_today_team',
  'biggest_sale_today_amount',
  'most_units_today_team',
  'most_units_today_count',
  'biggest_revenue_day_team',
  'biggest_revenue_day_amount',
  'biggest_revenue_day_date',
  'closed_week_number',
  'closed_week_revenue_team',
  'closed_week_revenue_amount',
  'closed_week_climb_team',
  'closed_week_climb_ranks',
  'closed_week_improved_team',
  'closed_week_improved_delta',
] as const

export class TvSchemaError extends Error {
  constructor(
    readonly source: 'feed' | 'cohort',
    readonly missing: string,
    readonly found: readonly string[],
  ) {
    super(`TV ${source} CSV is missing "${missing}". Found: ${found.join(', ') || '(nothing)'}`)
    this.name = 'TvSchemaError'
  }
}

/**
 * Sheet cells reach us as *formatted* values, so a revenue can arrive as
 * `₹1,04,500` rather than `104500`. Strip currency and separators, then require
 * a finite number.
 *
 * Blank is 0 — a team with no sales yet is normal. `null` means the cell did not
 * parse at all, which makes the whole row unusable; see `toTeam`.
 */
function toNumber(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, '')
  if (cleaned === '') return 0
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/**
 * One CSV row to one team, or `null` for a row the wall cannot use: no team id,
 * or a number that did not parse. `#REF!` and `#N/A` are what a formula tab
 * exports while it is mid-recalculation.
 *
 * **Unusable rows are dropped, not thrown on, because the count of usable rows
 * *is* the sanity gate.** A garbled cell and a missing row are the same event
 * seen from two angles, and routing both into `passesRowGate` keeps one decision
 * point for "is this fetch trustworthy". Throwing here would instead let a single
 * bad cell discard a fetch that is 41 rows good — the gate's whole job is to
 * judge that, and it cannot judge what never reaches it.
 */
function toTeam(row: Record<string, string>): Team | null {
  const teamId = (row.team_id ?? '').trim()
  if (teamId === '') return null

  const totalRevenue = toNumber(row.total_revenue ?? '')
  const totalUnits = toNumber(row.total_units ?? '')
  const streakDays = toNumber(row.streak_days ?? '')
  if (totalRevenue === null || totalUnits === null || streakDays === null) return null

  return {
    teamId,
    ventureName: (row.venture_name ?? '').trim(),
    totalRevenue,
    totalUnits,
    streakDays,
  }
}

function rows(csv: string): Record<string, string>[] {
  // papaparse strips the UTF-8 BOM Google prepends and the CR of its CRLF
  // endings, both of which would otherwise make `team_id` unmatchable and leave
  // a stray "\r" on the last field of every row. Verified, and pinned by tests.
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
  })
  return parsed.data
}

export function parseTeams(csv: string): Team[] {
  const data = rows(csv)
  const found = Object.keys(data[0] ?? {})
  for (const header of FEED_HEADERS) {
    if (!found.includes(header)) throw new TvSchemaError('feed', header, found)
  }

  return data.map(toTeam).filter((team): team is Team => team !== null)
}

export function parseCohort(csv: string): Cohort {
  const data = rows(csv)
  const found = Object.keys(data[0] ?? {})
  for (const header of ['key', 'value'] as const) {
    if (!found.includes(header)) throw new TvSchemaError('cohort', header, found)
  }

  const cohort: Record<string, string> = {}
  for (const row of data) {
    const key = (row.key ?? '').trim()
    if (key !== '') cohort[key] = (row.value ?? '').trim()
  }

  // Every key must be present. A value may legitimately be empty — nobody has
  // made a sale today yet — but a *missing* key means the sheet's shape drifted.
  for (const key of COHORT_KEYS) {
    if (!(key in cohort)) throw new TvSchemaError('cohort', key, Object.keys(cohort))
  }
  return cohort
}

/** The only thing that ever produces a `Snapshot`, from cache and network alike. */
export function parseSnapshot(raw: CsvCache): Snapshot {
  return { teams: parseTeams(raw.feedCsv), cohort: parseCohort(raw.cohortCsv) }
}

/**
 * **Short, not exact.**
 *
 * The master itself is never readable in a torn state — the consolidator builds
 * in memory and writes under `LockService`. What this guards is narrower: a full
 * rebuild does `clearContent` then `setValues`, and Google's CSV export can
 * re-read the sheet inside that window. The export that comes back is short.
 *
 * A short feed is the one input that can put nonsense on the wall without any
 * error anywhere — teams vanish, ranks reshuffle around the hole, and the
 * animations treat all of it as news. So a fetch carrying fewer than the
 * competing cohort is rejected whole, and the last good data stays on screen.
 *
 * An exact `=== 42` check would instead freeze every wall the day a 43rd
 * workbook is added: permanently, silently, with no spinner and no error state
 * to notice. A short export cannot *add* rows, so short-checking is both
 * strictly correct and strictly safer. The admin dashboard's gate reasons the
 * same way.
 */
export function passesRowGate(teams: readonly Team[]): boolean {
  return teams.length >= MIN_TEAM_ROWS
}

/**
 * Fetches both CSVs as one unit and returns the raw text.
 *
 * Raw, not parsed, because the caller caches exactly these bytes: keeping
 * `parseSnapshot` the single path from text to data means a field rename cannot
 * leave a shape-stale cached object yielding `undefined` with no error.
 *
 * `cache: 'no-store'` is load-bearing. This page can run for days without a
 * manual reload, and without it the browser HTTP cache would serve one body for
 * the life of the page — the wall would freeze with nothing logged anywhere.
 *
 * Note a revoked or re-published sheet answers with an HTML login page and
 * HTTP 200, so a status check passes it. The row gate is what catches that.
 */
export async function fetchCsv(signal?: AbortSignal): Promise<CsvCache> {
  if (FEED_CSV_URL === '' || COHORT_CSV_URL === '') {
    // Fail with the actual problem rather than letting `fetch('')` resolve
    // against the page's own URL and hand the parser an HTML document.
    throw new Error(
      'FEED_CSV_URL and COHORT_CSV_URL are unset in config.ts. Publish TV_Feed and TV_Cohort to the web as CSV and paste the URLs there.',
    )
  }

  const [feedCsv, cohortCsv] = await Promise.all(
    [FEED_CSV_URL, COHORT_CSV_URL].map(async (url) => {
      const response = await fetch(url, { cache: 'no-store', signal })
      if (!response.ok) throw new Error(`TV feed fetch failed: ${response.status} ${url}`)
      return response.text()
    }),
  )
  return { feedCsv, cohortCsv }
}
