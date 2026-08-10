/**
 * Every hardcoded value in the project. Nothing else carries a magic number.
 *
 * Changed by commit, not by an admin UI — there is nobody at the wall to click.
 */

import type { TeamId } from '@/lib/types'

// ── Dates ───────────────────────────────────────────────────────────────────

/**
 * Stored as **absolute instants**, with the IST offset written out.
 *
 * This is why the client needs no timezone logic at all: `FLEA.getTime() -
 * Date.now()` is the same number of milliseconds on a laptop set to IST, UTC or
 * America/Los_Angeles. Every "today" and "this week" question is answered by the
 * sheet, which runs in Asia/Kolkata.
 */
export const FLEA_DATE = new Date('2026-09-06T10:00:00+05:30')

/**
 * 20 July 2026, not the 21st.
 *
 * The build brief said the 21st, but `CHAL_START` in the master's Apps Script
 * and `WEEK_1_START` in the admin dashboard both anchor to the 20th, and every
 * challenge week number derives from it. Anchoring the ticker anywhere else
 * would put it one day out of step with every other number in the programme.
 */
export const PROGRAMME_START = new Date('2026-07-20T00:00:00+05:30')

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

/** 42 workbooks, SLE-C401..SLE-C442. The gate checks *short*, never exact — see lib/feed.ts. */
export const EXPECTED_TEAM_ROWS = 42

/** The consolidator writes every 10 minutes and Google caches the CSV ~5 min; polling faster only burns cycles. */
export const POLL_INTERVAL_MS = 60_000

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

// ── Trigger thresholds ──────────────────────────────────────────────────────

/** Rupee milestones that take over the frame. ₹2,00,000 is the programme's working target. */
export const HERO_REVENUE_THRESHOLDS = [100_000, 200_000, 300_000, 400_000] as const

/** Rupee milestones that rotate as a sub-card. */
export const CARD_REVENUE_THRESHOLDS = [25_000, 50_000] as const

export const HERO_STREAK_DAYS = 14
export const CARD_STREAK_DAYS = 7

/**
 * Deliberately not imported from anywhere.
 *
 * The admin dashboard has a `PACING_SCHEDULE` whose first checkpoint is also
 * ₹25,000, and a test there fails the build on a new importer because its
 * checkpoint *weeks* were never confirmed. The numeric coincidence is not a
 * shared concept: these are "the wall celebrates this", those are "the cohort is
 * paced against this". They are free to diverge.
 */

// ── Playback timing ─────────────────────────────────────────────────────────

export const HERO_HOLD_MS = 8_000
export const CARD_HOLD_MS = 6_000
/** The overtake's five beats sum to this; the choreography lives in the component. */
export const OVERTAKE_HOLD_MS = 2_400

export const GAP_AFTER_HERO_MS = 2_000
export const GAP_AFTER_CARD_MS = 1_000
export const GAP_AFTER_OVERTAKE_MS = 1_000

/**
 * Per-kind queue cap, drop-oldest.
 *
 * Constant ids mean flapping titles cannot grow the queue, so this only binds
 * when a page has been off screen for a long stretch — by which point the
 * contents are stale anyway. Without it, a day of podium-only rotation would
 * take over the countdown for seven straight minutes.
 */
export const QUEUE_CAP = 6

// ── Countdown ───────────────────────────────────────────────────────────────

/** The microsecond ticker, at 30fps. Never the hero, always visible. */
export const TICKER_INTERVAL_MS = 33

export const AWARE_AT_MS = 14 * 24 * 60 * 60 * 1000
export const URGENT_AT_MS = 7 * 24 * 60 * 60 * 1000
export const FINAL_HOUR_AT_MS = 60 * 60 * 1000

/**
 * The brief tabulated Urgent as "7 days to 24 hours" and Final hour as "under 1
 * hour", which leaves 24h→1h with no state defined. Urgent covers down to the
 * final hour here, which is the only reading that keeps the states total.
 */

/**
 * Flea opening time — **assumed, not confirmed.**
 *
 * The brief asked for 10:00 IST to be confirmed before hardcoding and it has
 * not been. Correcting it is a one-line change to FLEA_DATE above; every
 * countdown state derives from it.
 *
 * This uncertainty must never reach the screen. Students read this wall, and a
 * hedge next to the countdown would undermine the date the whole programme is
 * being driven toward. It stays a comment.
 */
