import type { TeamId } from '@/lib/types'

/**
 * Types for the Mesa Flea market board.
 *
 * Separate from `lib/types.ts` because the two describe different worlds and
 * must not be allowed to blend. `Team` comes from `TV_Feed` in `BYOB_MASTER` and
 * every figure on it is proof-gated logged revenue; `MarketRow` comes from
 * `MesaFlea_TV` in the Razorpay workbook and its figure is captured payments.
 * They are not the same money, and one file holding both invites a `Team &
 * MarketRow` that adds them together.
 */

/**
 * One row of `MesaFlea_TV`.
 *
 * **The figure is `takings`, and deliberately not `revenue`.** `Team.totalRevenue`
 * is logged revenue: proof-gated upstream, the only figure `/podium` and
 * `/weekly` will show. This is what Razorpay captured — no cash, and no
 * correction for a refund, since the ingestion never revisits a payment it has
 * already written. Same event, different number, and naming both `revenue` is
 * how someone ends up summing them.
 */
export type MarketRow = {
  teamId: TeamId
  /** Empty for a stall whose name has not been typed into the tab yet. */
  ventureName: string
  /** Razorpay captured payments inside the window, in rupees. */
  takings: number
  /** How many of them. The first tie-break. */
  txns: number
  /**
   * When this stall last took a payment, or `null`.
   *
   * Read optionally and used by nothing in v1 — the "just sold" pulse was
   * deliberately not shipped, because at a five-minute cadence it fires as a
   * wave rather than as an event. Parsed anyway so the column can be trusted
   * before anything depends on it.
   */
  lastSaleAt: Date | null
}

/**
 * One market fetch, parsed.
 *
 * The window travels **with the figures** rather than beside them: the same two
 * `Flea_Config` cells drive the sheet's `SUMIFS` and these two columns, so the
 * board can never disagree with its own data about what it is measuring. That
 * is why there is no flea window in `config.ts`.
 *
 * `null` bounds mean the sheet did not say, or said two different things — see
 * `parseMarket`. A board that cannot name its window shows no countdown rather
 * than a guessed one.
 */
export type MarketSnapshot = {
  rows: readonly MarketRow[]
  /** Epoch ms, from `window_start_iso`. */
  opensAt: number | null
  /** Epoch ms, from `window_end_iso`. */
  closesAt: number | null
  /**
   * When the ingestion last spoke to Razorpay, verbatim from the sheet.
   *
   * Rendered as-is, never reformatted, and shown beside the countdown. On a
   * board whose whole claim is freshness, a stalled pipeline behind a
   * confidently ticking clock is the worst available failure; the two on screen
   * together are what make it visible.
   */
  asOf: string
}
