/**
 * Shared types for the wall.
 *
 * Everything lives here so `feed`, `ranking`, `storage` and the animation
 * modules never import each other merely to borrow a type, and therefore cannot
 * form an import cycle. This file holds no logic.
 */

export type TeamId = string

/**
 * One row of `TV_Feed`. Six columns; nothing else is published per team.
 *
 * All three revenue figures are **logged (proof-backed)** revenue — `Daily Dump`
 * column N filtered to `Type = "Sale"` — differing only in their date window.
 * One definition across the whole system, so two figures on the same row can
 * never quietly disagree.
 */
export type Team = {
  teamId: TeamId
  /** Empty string for a workbook with no venture name filled in yet. */
  ventureName: string
  /** All-time. Ranks `/podium`, and breaks ties everywhere else. */
  totalRevenue: number
  /** Since Monday 00:00 IST. Ranks `/weekly`. */
  weekRevenue: number
  /** Today, IST. Shown on `/weekly`; never a sort key. */
  todayRevenue: number
  /** First tie-break for absolute ranking only. */
  totalUnits: number
}

/**
 * `TV_Cohort` as a flat key/value map.
 *
 * Deliberately not a typed struct: every value arrives as a string and may
 * legitimately be empty, and a struct would invite treating a missing key and
 * an empty value as the same thing. They are not — an empty value means the
 * sheet does not know yet, which is normal and renders as nothing, while a
 * missing key means the sheet's shape has drifted, which throws.
 *
 * Read it through `openWeek` and `fleaInstant` in `lib/feed.ts` rather than
 * indexing it directly; those are where a string becomes a checked value.
 */
export type Cohort = Readonly<Record<string, string>>

/**
 * Both CSVs, parsed together, and always constructed as a unit.
 *
 * `current_open_week` is what tells the wall a week rolled over and the weekly
 * board reset to zero — the moment it must *not* animate. Pairing it with a
 * stale feed, or the reverse, would either animate that reset or suppress a real
 * week of overtakes.
 */
export type Snapshot = {
  teams: readonly Team[]
  cohort: Cohort
}

/** Raw CSV text, cached verbatim so `parseSnapshot` is the only thing that ever builds a Snapshot. */
export type CsvCache = {
  feedCsv: string
  cohortCsv: string
}
