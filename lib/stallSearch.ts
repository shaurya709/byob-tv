import type { MarketRow } from '@/lib/marketTypes'
import { nameOf } from '@/lib/team'

/**
 * Finding your own stall in a list of forty, on a phone, mid-transaction.
 *
 * ── One rule, not four ──
 *
 * A stallholder might type their venture, their full team code, the code
 * without its prefix, or just the number — and on the day, whichever is fastest
 * with one thumb. Rather than four match modes, both sides are stripped to
 * letters and digits and compared as substrings. `SLE-C407` becomes `SLEC407`,
 * so `sle-c407`, `C407`, `407` and `07` all hit it, and `Dosa Crisps` becomes
 * `DOSACRISPS`, so `dosa`, `crisps` and `dosa crisps` all do too.
 *
 * That the number is a substring of the code is what makes a digits-only query
 * work with no special case: `7` is inside `SLEC407`. It matches `417`, `427`
 * and `437` as well, which is correct for a filter — the list narrows, the
 * reader picks.
 */

function normalise(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function matchesStall(row: MarketRow, query: string): boolean {
  const q = normalise(query)
  if (q === '') return true
  return normalise(row.teamId).includes(q) || normalise(nameOf(row)).includes(q)
}

/** The stalls to show, in the order given. An empty query shows everything. */
export function filterStalls(rows: readonly MarketRow[], query: string): MarketRow[] {
  return rows.filter((row) => matchesStall(row, query))
}
