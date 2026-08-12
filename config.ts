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
 * The published URLs are the **defaults**, written here in the clear. They carry
 * no secret — the sheet is published publicly and the data is already going onto
 * public TVs — and keeping them as the fallback means a fresh clone or a new
 * Vercel project just works, rather than deploying a wall that renders perfectly
 * and fetches nothing. That was the original reason for putting them in config,
 * and it still holds.
 *
 * What it did not survive is **local development**. Pointing the wall at
 * `scripts/dev-feed.mjs`'s fixtures used to mean editing the two literals below,
 * which puts a `/mock/…` path into a *tracked* file — one `git commit -a` away
 * from deploying a wall that fetches a URL that does not exist in production.
 * That edit was made and discarded once already (`b5af89b`, "Restore the
 * published CSV URLs"); a rule that has to be remembered every time is not a
 * rule, it is a trap with good intentions.
 *
 * So the override is an environment variable and the fixture path never touches
 * a tracked file:
 *
 * ```bash
 * # .env.local — gitignored by the `.env*` rule, and cannot be committed
 * NEXT_PUBLIC_FEED_CSV_URL=/mock/feed.csv
 * NEXT_PUBLIC_COHORT_CSV_URL=/mock/cohort.csv
 * ```
 *
 * `NEXT_PUBLIC_`, necessarily: both fetches happen in the browser, so the value
 * has to be inlined into the client bundle at build time. That also means these
 * are **build-time**, not runtime — changing one on Vercel needs a redeploy, and
 * changing one in `.env.local` needs `next dev` restarting. No secret is exposed
 * by the prefix; a published CSV URL is public by construction.
 *
 * The reads below are written out longhand on purpose. Next.js inlines
 * `process.env.NEXT_PUBLIC_*` by *textual* substitution of the member
 * expression, so a dynamic lookup — `process.env[name]` — silently yields
 * `undefined` in the browser and the wall would fall back forever without
 * saying so.
 */
function feedUrl(override: string | undefined, published: string): string {
  // Trimmed, and empty treated as absent: an unset `NEXT_PUBLIC_` var inlines as
  // `undefined` in some builds and `''` in others, and a var left declared but
  // blank on Vercel is the same intent as not setting it. All three must reach
  // the published default rather than `fetch('')`, which resolves against the
  // page's own URL and hands the parser an HTML document.
  const trimmed = override?.trim() ?? ''
  return trimmed === '' ? published : trimmed
}

export const FEED_CSV_URL: string = feedUrl(
  process.env.NEXT_PUBLIC_FEED_CSV_URL,
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZTHFUyVPNGcV0rsFtd45y9KxvT2Yh2Bj8qs6qMqIFrY8rTtqc9sqb_fKOUyi_Us1hnJWZhHN0n-_z/pub?gid=917272830&single=true&output=csv',
)
export const COHORT_CSV_URL: string = feedUrl(
  process.env.NEXT_PUBLIC_COHORT_CSV_URL,
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZTHFUyVPNGcV0rsFtd45y9KxvT2Yh2Bj8qs6qMqIFrY8rTtqc9sqb_fKOUyi_Us1hnJWZhHN0n-_z/pub?gid=359094552&single=true&output=csv',
)

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

// ── Mesa Flea calendar countdown ────────────────────────────────────────────

/**
 * When the calendar changes mode. The instant it counts to lives in `TV_Cohort`;
 * only the *shape* of the escalation is a build decision. The transitions
 * themselves are computed in one place: `computeCountdownState` in
 * lib/countdown.ts.
 */
export const DAYS_ONLY_FROM_MS = 15 * 24 * 60 * 60 * 1000
export const TIMER_UNDER_MS = 24 * 60 * 60 * 1000

/**
 * Where `/podium`'s masthead countdown changes what it counts.
 *
 * **A second set of thresholds on one brain, not a second brain.** The dial in
 * the shared header escalates at 15 days and 24 hours; the masthead escalates at
 * 7 days, 3 days and 24 hours, and shows whole weeks above the first of those —
 * a mode the dial has never had. Both read the same
 * `computeCountdownState`, which is where every comparison against the clock
 * still happens; only the banding differs, and it differs because the two are
 * different sizes on the frame. The dial is a 48px ring in a header and can
 * afford one figure; the masthead figure is the third-largest thing on the
 * slide and can afford to change shape.
 *
 * The final band deliberately reuses `TIMER_UNDER_MS` rather than declaring its
 * own 24 hours. The two boards must not disagree about when the last day starts.
 */
export const PODIUM_WEEKS_FROM_MS = 7 * 24 * 60 * 60 * 1000
export const PODIUM_CLOCK_UNDER_MS = 3 * 24 * 60 * 60 * 1000

/**
 * How long the Flea itself runs — 10:00 to 18:00 IST assumed, like the opening
 * time. While it runs the calendar says LIVE NOW; after it ends the calendar
 * leaves the wall entirely.
 */
export const FLEA_EVENT_DURATION_MS = 8 * 60 * 60 * 1000

/**
 * When the programme started — 20 July 2026, 00:00 IST.
 *
 * **This is a third copy of a date that already lives in two sheet cells**
 * (`TV_Feed!D2` — see docs/SHEET_SETUP.md) and in docs/DESIGN.md. It is here
 * only because the Flea dial measures progress *from* somewhere, and the sheet
 * publishes the Flea instant but not the programme's start. If the anchor ever
 * moves, it moves here too.
 *
 * Publishing it as a cohort key would remove the duplication, and was
 * deliberately not done: it changes the sheet contract for one decorative arc.
 */
export const PROGRAMME_START_ISO = '2026-07-20T00:00:00+05:30'
export const PROGRAMME_START_MS = Date.parse(PROGRAMME_START_ISO)

/** Once a second while the live timer shows seconds; once a minute before that. */
export const TICK_MS = 1_000
export const TICK_SLOW_MS = 60_000

// ── End of day ──────────────────────────────────────────────────────────────

/**
 * The sheet's timezone, hardcoded.
 *
 * Every "today" and "this week" figure on the wall was computed by a spreadsheet
 * running in Asia/Kolkata, so the wall's own day has to start and end there too.
 * Never the browser's locale — see `lib/schedule.ts`.
 */
export const IST_TIMEZONE = 'Asia/Kolkata'

/** The podium marks the end of the trading day from this hour, IST, until midnight. */
export const EOD_FROM_HOUR_IST = 18

// ── Overtakes ───────────────────────────────────────────────────────────────

/**
 * How far down each board a rank change is worth animating.
 *
 * The weekly board watches its whole first column; a change at rank 34 is real
 * but nobody is watching that far down, and animating it would spend the wall's
 * one interrupt on it. The podium animates rank 1 and nothing else.
 */
export const WATCH_RANKS_WEEKLY = 20
export const WATCH_RANKS_PODIUM = 1

/**
 * How many overtakes may be waiting at once. FIFO, oldest dropped.
 *
 * Four, not ten. Each kick runs about three seconds, so ten would mean half a
 * minute of continuous animation after one busy fetch — and by the end of it the
 * board underneath would be two fetches stale. Currency beats completeness.
 */
export const KICK_QUEUE_CAP = 4

/**
 * One kick, start to finish, in milliseconds.
 *
 * The seven beats inside `BootKick` are declarative delays that sum to this; the
 * playback hook only needs the total. Three seconds is the ceiling: the wall's
 * job is to be a leaderboard, and it should be one again quickly.
 */
export const KICK_MS = 3_000

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
 * the coloured initial, which is a first-class treatment — **32 of 42 logos
 * exist**, so it now carries three quarters of the wall.
 *
 * These files are generated, not dropped in by hand: `scripts/prepare-logos.py`
 * masks every circular source logo to a disc with transparent corners, so it
 * sits on `/weekly`'s green panel and in `/podium`'s frame without a baked-in
 * background square behind it. Re-run it when the source folder changes, and
 * paste its output here.
 *
 * **The team-number mapping is confirmed.** The source files are named "Team
 * 17", not "SLE-C417", and this assumption went unverified for a long time. On
 * 12 August 2026 all 24 numbered logos were read against the live `TV_Feed`
 * venture names and every one agrees — Team 1 is Dosa Crisps, Team 15 is
 * CHAKHA NA?, Team 34 is In Between Sips by Kaappitalism, and so on.
 *
 * ROLLIN and UNHINGED were the two that could not be placed from the feed — no
 * such venture names are published — and they are now assigned by hand to
 * `SLE-C422` and `SLE-C435` respectively, by the person who knows. `Team 30` and
 * `Team 7` arrived in the same batch, and both re-confirm the mapping
 * independently: 30 is The Chips n Dip Story against `SLE-C430`'s "The Chips n
 * Dips Story", and 7 is Wake & Wyze against `SLE-C407`'s.
 *
 * Teams 11, 12, 13 and 21 arrived later and confirm it four more times over,
 * with no interpretation needed: Moh, XOCO, Honest Sweet and SoleMate are the
 * published `venture_name` of `SLE-C411`, `SLE-C412`, `SLE-C413` and
 * `SLE-C421` exactly. Twelve independent confirmations and no contradiction.
 */
export const LOGOS: readonly TeamId[] = [
  'SLE-C401',
  'SLE-C402',
  'SLE-C403',
  'SLE-C404',
  'SLE-C405',
  'SLE-C406',
  'SLE-C407',
  'SLE-C408',
  'SLE-C409',
  'SLE-C410',
  'SLE-C411',
  'SLE-C412',
  'SLE-C413',
  'SLE-C414',
  'SLE-C415',
  'SLE-C416',
  'SLE-C418',
  'SLE-C419',
  'SLE-C420',
  'SLE-C421',
  'SLE-C422',
  'SLE-C423',
  'SLE-C426',
  'SLE-C427',
  'SLE-C429',
  'SLE-C430',
  'SLE-C433',
  'SLE-C434',
  'SLE-C435',
  'SLE-C436',
  'SLE-C438',
  'SLE-C440',
]
