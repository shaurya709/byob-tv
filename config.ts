/**
 * Every hardcoded value in the project. Nothing else carries a magic number.
 *
 * Changed by commit, not by an admin UI — there is nobody at the wall to click.
 *
 * **No dates live here.** The Mesa Flea instant and the current challenge week
 * both arrive in `TV_Cohort`, so correcting either is one sheet edit rather than
 * a commit and a redeploy — which matters for a 10:00 opening time that is still
 * unconfirmed weeks out.
 */

import type { TeamId } from '@/lib/types'

// ── Data source ─────────────────────────────────────────────────────────────

/**
 * Published-to-web CSV URLs for `TV_Feed` and `TV_Cohort`.
 *
 * In config rather than env vars on purpose. They carry no secret — the sheet is
 * published publicly and the data is already going onto public TVs — and putting
 * them here means a fresh clone or a new Vercel project just works, rather than
 * deploying a wall that renders perfectly and fetches nothing.
 */
export const FEED_CSV_URL: string =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZTHFUyVPNGcV0rsFtd45y9KxvT2Yh2Bj8qs6qMqIFrY8rTtqc9sqb_fKOUyi_Us1hnJWZhHN0n-_z/pub?gid=917272830&single=true&output=csv'
export const COHORT_CSV_URL: string =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZTHFUyVPNGcV0rsFtd45y9KxvT2Yh2Bj8qs6qMqIFrY8rTtqc9sqb_fKOUyi_Us1hnJWZhHN0n-_z/pub?gid=359094552&single=true&output=csv'

/**
 * The fewest usable rows a fetch may carry and still be trusted.
 *
 * 40, not 42: `SLE-C441` and `SLE-C442` are spares and the wall does not compete
 * them, so forty is the real cohort. The gate checks *short*, never exact — see
 * `passesRowGate` in lib/feed.ts.
 */
export const MIN_TEAM_ROWS = 40

/** The consolidator writes every 10 minutes and Google caches the CSV ~5 min; polling faster only burns cycles. */
export const POLL_INTERVAL_MS = 60_000

/**
 * Workbooks that exist but do not compete.
 *
 * `TV_Feed` publishes all 42 because it reads `Team Links`; these two are spares
 * and are filtered out for display. They still count toward `MIN_TEAM_ROWS`,
 * which asks whether a whole fetch arrived, not who is racing.
 */
export const SPARE_TEAM_IDS: readonly TeamId[] = ['SLE-C441', 'SLE-C442']

// ── Weekly board ────────────────────────────────────────────────────────────

/**
 * A day's revenue at or above this reads as a strong day and is emphasised.
 *
 * One threshold, one emphasis. It is a display decision, not a milestone — the
 * wall no longer fires anything on crossing it, so a team moving above and below
 * it through the day is free to.
 */
export const HOT_TODAY_MIN = 5_000

// ── Data quality ────────────────────────────────────────────────────────────

/**
 * The team-workbook template's placeholder venture name, lowercased.
 *
 * Treated as no name at all. Compared in lowercase because it is typed by hand
 * in 42 separate workbooks and the capitalisation drifts.
 */
export const UNNAMED_VENTURE = 'type your venture name'

// ── Mesa Flea strip ─────────────────────────────────────────────────────────

/**
 * When the strip changes state. The instant it counts to lives in `TV_Cohort`;
 * only the *shape* of the escalation is a build decision.
 */
export const AWARE_AT_MS = 14 * 24 * 60 * 60 * 1000
export const URGENT_AT_MS = 7 * 24 * 60 * 60 * 1000
export const FINAL_HOUR_AT_MS = 60 * 60 * 1000

/** One second normally; ~30fps in the final hour, where milliseconds are shown. */
export const TICK_MS = 1_000
export const TICK_FAST_MS = 33

// ── Logos ───────────────────────────────────────────────────────────────────

/**
 * Team IDs that have a logo committed at `public/logos/<TEAM_ID>.png`.
 *
 * The list lives here rather than in a sheet column for two reasons. `Team
 * Links` columns C:I are rewritten by the consolidator every 10 minutes, so a
 * filename put there would be wiped; and the file itself arrives by commit
 * anyway, so listing it in the same commit is one action rather than two in two
 * systems that would drift.
 *
 * Because presence is known ahead of the render, no broken image is ever
 * requested and there is no error-handler flash. A team not in this list gets
 * the coloured initial square, which is a first-class treatment — currently
 * **zero of 42 logos exist**, so it is carrying the entire wall.
 */
export const LOGOS: readonly TeamId[] = []
