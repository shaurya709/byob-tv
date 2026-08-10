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

/** Titles exactly one team can hold at a time. Empty string means nobody holds it. */
export type HolderKey = 'rank1' | 'biggestSaleToday' | 'mostUnitsToday' | 'biggestRevenueDay'

/**
 * What the wall has already accounted for.
 *
 * `fired` is a grow-only set of event ids. Membership, rather than comparing
 * this fetch against the last one, because a delta check breaks the moment a
 * tick is discarded by the row gate or a poll is missed, and re-fires if a
 * team's revenue is corrected downward and then back up. `>= threshold &&
 * !fired.has(id)` cannot miss and cannot double-fire whatever the poll history.
 *
 * Grow-only also means concurrent writes from two tabs commute.
 */
export type Ledger = {
  /** Serialised sorted, so the persisted form is stable and diffable. */
  fired: readonly string[]
  holders: Readonly<Record<HolderKey, TeamId>>
}

export type PendingKind = 'hero' | 'card' | 'overtake'

type EventBase = {
  /**
   * Doubles as the dedup key. The choice of id *is* the staleness policy:
   * milestone ids are unique forever so they accumulate, while title and
   * overtake ids are constant so a newer holder replaces an older one.
   */
  id: string
  kind: PendingKind
  teamId: TeamId
  ventureName: string
}

export type HeroEvent = EventBase &
  { kind: 'hero' } & (
    | { type: 'revenue'; threshold: number; totalRevenue: number }
    | { type: 'streak'; days: number }
    | { type: 'weekly'; week: number; award: WeeklyAward; value: number }
  )

export type WeeklyAward = 'revenue' | 'climb' | 'improved'

export type CardEvent = EventBase &
  { kind: 'card' } & (
    | { type: 'revenue'; threshold: number; totalRevenue: number }
    | { type: 'streak'; days: number }
    | { type: 'title'; title: Exclude<HolderKey, 'rank1'>; value: number }
  )

export type OvertakeEvent = EventBase & {
  kind: 'overtake'
  /** The team that just lost rank 1. Empty string if nobody held it before. */
  fromTeamId: TeamId
  fromVentureName: string
}

export type WallEvent = HeroEvent | CardEvent | OvertakeEvent
