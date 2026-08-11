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
export const FEED_CSV_URL: string = ''
export const COHORT_CSV_URL: string = ''

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
