import Papa from 'papaparse'

import { MARKET_CSV_URL, MIN_MARKET_ROWS, UNNAMED_VENTURE } from '@/config'
import type { MarketRow, MarketSnapshot } from '@/lib/marketTypes'

/**
 * Turning `MesaFlea_TV` into a `MarketSnapshot`, and deciding whether to trust
 * it.
 *
 * ── Why this transcribes `lib/feed.ts` rather than importing it ──
 *
 * The shapes below — papaparse with a header transform, currency-tolerant
 * numbers, drop-the-row-don't-throw, a short-not-exact gate — are all lifted
 * from that module, which earned each of them the hard way. What is *not*
 * shared is the plumbing: `fetchCsv` is a `Promise.all` over two URLs, so a
 * market fetch joining it would take both live boards down with it, and
 * `writeCsvCache` overwrites one blob holding both CSVs behind one type guard.
 * This board has a twelve-hour life and sits beside two that are on a wall right
 * now. The duplication is the price of not being able to break them.
 */

/**
 * Required columns. A missing one throws and the caller discards the fetch —
 * the board cannot be honest about a figure whose column it cannot find.
 *
 * `last_sale_at` is deliberately absent from this list: nothing in v1 reads it,
 * so a tab published without it must still produce a board. Same reasoning that
 * keeps `challenge_revenue` out of `FEED_HEADERS`.
 */
export const MARKET_HEADERS = [
  'team_id',
  'venture_name',
  'flea_revenue',
  'flea_txns',
  'window_start_iso',
  'window_end_iso',
  'as_of',
] as const

export class MarketSchemaError extends Error {
  constructor(
    readonly missing: string,
    readonly found: readonly string[],
  ) {
    super(`Market CSV is missing "${missing}". Found: ${found.join(', ') || '(nothing)'}`)
    this.name = 'MarketSchemaError'
  }
}

/** An ISO instant must carry `Z` or an explicit ±HH:MM offset — see `cohortInstant`. */
const ABSOLUTE_INSTANT = /(?:Z|[+-]\d{2}:\d{2})$/

/**
 * Sheet cells arrive *formatted*, so a figure can come as `₹9,110` rather than
 * `9110`. Blank is 0 — a stall that has not sold is normal. `null` means the
 * cell did not parse, which makes the whole row unusable.
 */
function toNumber(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, '')
  if (cleaned === '') return 0
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function ventureNameOf(raw: string): string {
  const name = raw.trim()
  return name.toLowerCase() === UNNAMED_VENTURE ? '' : name
}

/**
 * An absolute instant, or `null`.
 *
 * **The offset is mandatory.** `new Date('2026-09-13T09:00:00')` — no offset —
 * is parsed in the *browser's* timezone, so a stallholder's phone set to
 * anything but IST computes a different window and looks completely healthy
 * doing it. Requiring `+05:30` is what lets `marketClock` do no timezone
 * arithmetic at all.
 */
function toInstant(raw: string): Date | null {
  const trimmed = raw.trim()
  if (!ABSOLUTE_INSTANT.test(trimmed)) return null
  const at = new Date(trimmed)
  return Number.isFinite(at.getTime()) ? at : null
}

/**
 * One CSV row to one stall, or `null` for a row the board cannot use.
 *
 * **Unusable rows are dropped rather than thrown on, because the count of usable
 * rows *is* the sanity gate.** A garbled cell and a missing row are the same
 * event from two angles, and routing both into `passesMarketRowGate` keeps one
 * decision point for "is this fetch trustworthy". Throwing here would let a
 * single `#REF!` mid-recalculation discard a fetch that is 39 rows good.
 */
function toRow(row: Record<string, string>): MarketRow | null {
  const teamId = (row.team_id ?? '').trim()
  if (teamId === '') return null

  const takings = toNumber(row.flea_revenue ?? '')
  const txns = toNumber(row.flea_txns ?? '')
  if (takings === null || txns === null) return null

  return {
    teamId,
    ventureName: ventureNameOf(row.venture_name ?? ''),
    takings,
    txns,
    lastSaleAt: toInstant(row.last_sale_at ?? ''),
  }
}

function rows(csv: string): Record<string, string>[] {
  // papaparse strips the UTF-8 BOM Google prepends and the CR of its CRLF
  // endings, either of which would make `team_id` unmatchable. The header
  // transform is here for the same reason `parseCohort` has one: these headers
  // are typed by hand into a spreadsheet, and case and stray spaces are not part
  // of the contract — the names are.
  return Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase(),
  }).data
}

/**
 * The one value a column carries across every row, or `null`.
 *
 * `window_start_iso`, `window_end_iso` and `as_of` are each **one sheet cell
 * published forty times**, so all forty should agree. Reading "the first row"
 * would make the board's window depend on CSV row order, and a sheet caught
 * mid-edit publishing two different windows would produce a countdown that is
 * confidently wrong. Disagreement means the sheet is not in a state worth
 * reading, so it returns `null` and the board says nothing.
 */
function agreedValue(data: readonly Record<string, string>[], column: string): string | null {
  const seen = new Set<string>()
  for (const row of data) {
    const value = (row[column] ?? '').trim()
    if (value !== '') seen.add(value)
  }
  return seen.size === 1 ? [...seen][0] : null
}

/**
 * A whole market fetch, parsed. Throws `MarketSchemaError` on a missing required
 * column; never throws on a value.
 */
export function parseMarket(csv: string): MarketSnapshot {
  const data = rows(csv)
  const found = Object.keys(data[0] ?? {})
  for (const header of MARKET_HEADERS) {
    if (!found.includes(header)) throw new MarketSchemaError(header, found)
  }

  const start = agreedValue(data, 'window_start_iso')
  const end = agreedValue(data, 'window_end_iso')

  return {
    rows: data.map(toRow).filter((row): row is MarketRow => row !== null),
    opensAt: start === null ? null : (toInstant(start)?.getTime() ?? null),
    closesAt: end === null ? null : (toInstant(end)?.getTime() ?? null),
    asOf: agreedValue(data, 'as_of') ?? '',
  }
}

/**
 * **Short, not exact**, for the reason `passesRowGate` gives.
 *
 * What it guards is specific and measured: a 25-minute sample of the live
 * published CSV on an ordinary Monday returned **three empty exports and two
 * multi-minute hangs**. Google's export can re-read a sheet inside a rebuild's
 * `clearContent` → `setValues` window, and what comes back is short. Acting on
 * it would empty the board in front of the whole market, with no error anywhere.
 *
 * An exact `=== 40` would instead freeze the board permanently and silently the
 * day a 41st stall is added. A short export cannot *add* rows, so short-checking
 * is both strictly correct and strictly safer.
 */
export function passesMarketRowGate(rows: readonly MarketRow[]): boolean {
  return rows.length >= MIN_MARKET_ROWS
}

/**
 * Defeat any cache keyed on the URL.
 *
 * `cache: 'no-store'` stops the *browser* reusing a body; it says nothing about
 * an edge cache. Measurement could not separate the two, so the board does not
 * depend on the answer.
 *
 * **The separator is conditional, and that is not fussiness.** A published
 * Google URL already carries a query string, but the local fixture path does
 * not — and a bare `&_=` turns `/mock/market.csv` into `/mock/market.csv&_=123`,
 * which 404s. That breaks only the local path, so it presents as a broken
 * fixture rather than as a broken fetch, which is a bad afternoon.
 */
export function cacheBust(url: string, now: number): string {
  return `${url}${url.includes('?') ? '&' : '?'}_=${now}`
}

/**
 * The raw CSV text.
 *
 * Raw rather than parsed, because the caller caches exactly these bytes:
 * keeping `parseMarket` the single path from text to data means a field rename
 * cannot leave a shape-stale cached object yielding `undefined` with no error.
 *
 * Note a revoked or re-published sheet answers with an HTML login page and HTTP
 * 200, so a status check passes it. The row gate is what catches that.
 */
export async function fetchMarketCsv(signal?: AbortSignal): Promise<string> {
  if (MARKET_CSV_URL === '') {
    throw new Error(
      'MARKET_CSV_URL is empty. The MesaFlea_TV tab has not been published — set the default in config.ts, or NEXT_PUBLIC_MARKET_CSV_URL for local fixtures.',
    )
  }
  const response = await fetch(cacheBust(MARKET_CSV_URL, Date.now()), {
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(`Market fetch failed: ${response.status} ${MARKET_CSV_URL}`)
  return response.text()
}
