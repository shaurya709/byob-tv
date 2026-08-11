/**
 * Shared types for the wall.
 *
 * Everything lives here so `feed`, `triggers`, `storage` and `player` never
 * import each other merely to borrow a type, and therefore cannot form an
 * import cycle. This file holds no logic.
 */

export type TeamId = string

/** One row of `TV_Feed`. Five columns; nothing else is published per team. */
export type Team = {
  teamId: TeamId
  /** Empty string for a workbook with no venture name filled in yet. */
  ventureName: string
  /** Logged (proof-backed) revenue. The only revenue figure this project uses. */
  totalRevenue: number
  totalUnits: number
  streakDays: number
}

/**
 * `TV_Cohort` as a flat key/value map.
 *
 * Deliberately not a typed struct: every value arrives as a string and may
 * legitimately be empty, and a struct would invite treating a missing key and
 * an empty value as the same thing. They are not — an empty value means "no
 * team holds this title right now", which is normal, while a missing key means
 * the sheet's shape has drifted, which throws.
 */
export type Cohort = Readonly<Record<string, string>>

/**
 * Both CSVs, parsed together. Always constructed as a unit: triggers that name
 * a cohort title holder look that team's venture name up in `teams`, so a fresh
 * cohort reconciled against a stale feed would put the wrong name on screen.
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
