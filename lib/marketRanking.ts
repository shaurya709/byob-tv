import type { MarketRow } from '@/lib/marketTypes'

/**
 * Ordering for the market board, and how many places it shows. Nothing else.
 *
 * **This module reads no clock, no storage, no network and no DOM** — pinned by
 * a source scan in the test beside it, the same way `lib/ranking.ts` is. Ranking
 * has to be a pure function of a fetch: an order that could vary with the
 * machine it ran on would reshuffle the board for no reason anybody could see.
 */

/**
 * Takings desc → transactions desc → team ID asc.
 *
 * **A total order, and that is the load-bearing part.** At 09:00 every stall is
 * on ₹0 and stays there for a while — the 29 August sample had 17 of 40 still on
 * zero at a quarter to seven in the evening. Without a final tie-break their
 * order would be whatever the CSV row order happened to be that minute, and a
 * board that reshuffles between two identical fetches is indistinguishable from
 * forty stalls overtaking each other.
 *
 * Transactions before team ID because it is the one thing the board already
 * knows that means something: two stalls on ₹600 are separated by whether that
 * was one sale or six.
 */
export function compareMarket(a: MarketRow, b: MarketRow): number {
  if (b.takings !== a.takings) return b.takings - a.takings
  if (b.txns !== a.txns) return b.txns - a.txns
  return a.teamId.localeCompare(b.teamId)
}

export function rankMarket(rows: readonly MarketRow[]): MarketRow[] {
  return [...rows].sort(compareMarket)
}

/**
 * Exactly `count` slots, padded with `null`.
 *
 * The board is always twenty rows. A rank nobody has reached yet is an empty
 * slot rather than a shorter board, which costs a lot of white space through the
 * morning and buys two things worth more: the ranking says what it means — 14th
 * of twenty places, not 14th of the fourteen stalls that happen to have sold —
 * and the layout never moves. On a board that fills up over twelve hours, rows
 * arriving and pushing everything below them down would read as movement, on a
 * wall whose whole grammar is that movement means something happened.
 *
 * Longer input is truncated: `MARKET_TOP_N` is what the frame holds.
 */
export function slotsOf(ranked: readonly MarketRow[], count: number): (MarketRow | null)[] {
  return Array.from({ length: count }, (_, index) => ranked[index] ?? null)
}

/**
 * What a stall outside the shown places has to make up to reach the last one.
 *
 * `null` when the board is not full — with nineteen stalls trading there is no
 * twentieth place to be behind, and "₹0 behind 20th" would be a sentence about
 * nothing. Never negative: a stall inside the places is not behind anything.
 */
export function gapToLastPlace(
  ranked: readonly MarketRow[],
  count: number,
  teamId: string,
): number | null {
  if (ranked.length < count) return null
  const last = ranked[count - 1]
  const mine = ranked.find((row) => row.teamId === teamId)
  if (last === undefined || mine === undefined) return null
  const gap = last.takings - mine.takings
  return gap > 0 ? gap : null
}
