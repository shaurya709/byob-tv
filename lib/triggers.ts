import {
  CARD_REVENUE_THRESHOLDS,
  CARD_STREAK_DAYS,
  HERO_REVENUE_THRESHOLDS,
  HERO_STREAK_DAYS,
} from '@/config'
import type {
  CardEvent,
  HeroEvent,
  HolderKey,
  Ledger,
  OvertakeEvent,
  Snapshot,
  Team,
  TeamId,
  WallEvent,
  WeeklyAward,
} from '@/lib/types'

/**
 * The whole trigger system: one exported pure function.
 *
 * **This module reads no clock, no storage and no network.** Not by convention
 * — a source-scan test fails the build if `Date`, `Math.random`, `localStorage`,
 * `fetch`, `window` or `document` appear here. That is what makes the wall
 * immune to a TV with the wrong timezone: every question that would need a
 * clock is answered by the sheet instead.
 *
 * All fifteen triggers reduce to **two** mechanisms, `claim` and `handover`,
 * which is what keeps this file short.
 */

export const EMPTY_HOLDERS: Record<HolderKey, TeamId> = {
  rank1: '',
  biggestSaleToday: '',
  mostUnitsToday: '',
  biggestRevenueDay: '',
}

export type ReconcileResult = {
  ledger: Ledger
  /** Empty on the seed pass, always. */
  events: WallEvent[]
}

/** Records the id unconditionally; returns whether *this* call was the one that recorded it. */
function claim(fired: Set<string>, id: string): boolean {
  if (fired.has(id)) return false
  fired.add(id)
  return true
}

/**
 * Records the holder unconditionally; returns whether that is news worth showing.
 *
 * One rule covering rank 1 and all three daily titles, including the midnight
 * reset. A title going team → empty at midnight is *recorded* and shows nothing;
 * empty → team shows a card. That is why the daily titles fire about once a day
 * once trading starts, which is the intent — "the first sale of the day lands"
 * is genuine news on a wall.
 */
function handover(
  holders: Record<HolderKey, TeamId>,
  key: HolderKey,
  next: TeamId,
): boolean {
  const previous = holders[key]
  holders[key] = next
  return next !== '' && next !== previous
}

/**
 * Lenient on purpose. `reconcile` never throws: schema drift already threw in
 * `feed.ts` and discarded the tick, so anything reaching here is a *value*
 * oddity, and blanking a wall in front of 42 teams over one bad cell is worse
 * than showing a zero.
 */
function amount(raw: string | undefined): number {
  const value = Number((raw ?? '').replace(/[₹,\s]/g, ''))
  return Number.isFinite(value) ? value : 0
}

/**
 * Logged revenue desc → units desc → team ID asc.
 *
 * Identical to the admin dashboard's `compareTieBreak`, so the wall and the
 * dashboard can never disagree about who is ahead.
 */
export function compareTeams(a: Team, b: Team): number {
  if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue
  if (b.totalUnits !== a.totalUnits) return b.totalUnits - a.totalUnits
  return a.teamId.localeCompare(b.teamId)
}

export function rankTeams(teams: readonly Team[]): Team[] {
  return [...teams].sort(compareTeams)
}

/**
 * Who currently holds rank 1, or `''` if nobody does.
 *
 * **A team on zero revenue is not the leader.** The tie-break makes the sort
 * total, so without this the "leader" before anyone trades would be whichever
 * team ID sorts first — and the first real sale of the programme would fire an
 * overtake reading "X overtakes SLE-C401", naming a team that never led
 * anything. There is no leader until someone has sold something.
 */
function leaderOf(ranked: readonly Team[]): TeamId {
  const top = ranked[0]
  return top && top.totalRevenue > 0 ? top.teamId : ''
}

const WEEKLY_AWARDS: readonly { award: WeeklyAward; teamKey: string; valueKey: string }[] = [
  { award: 'revenue', teamKey: 'closed_week_revenue_team', valueKey: 'closed_week_revenue_amount' },
  { award: 'climb', teamKey: 'closed_week_climb_team', valueKey: 'closed_week_climb_ranks' },
  { award: 'improved', teamKey: 'closed_week_improved_team', valueKey: 'closed_week_improved_delta' },
]

const DAILY_TITLES: readonly { key: Exclude<HolderKey, 'rank1'>; teamKey: string; valueKey: string }[] = [
  { key: 'biggestSaleToday', teamKey: 'biggest_sale_today_team', valueKey: 'biggest_sale_today_amount' },
  { key: 'mostUnitsToday', teamKey: 'most_units_today_team', valueKey: 'most_units_today_count' },
  { key: 'biggestRevenueDay', teamKey: 'biggest_revenue_day_team', valueKey: 'biggest_revenue_day_amount' },
]

/**
 * `prev === null` is the seed pass: absent, unparseable or wrong-shaped storage,
 * and a brand-new TV. It computes exactly the same ledger and throws the events
 * away, so a wall coming online in week five records everything as already seen
 * and animates nothing — and a TV added mid-programme behaves identically to one
 * running since day one.
 *
 * Because seeding and steady state are the same computation with a gate on the
 * *output*, they cannot drift apart. The idempotence test asserts exactly that.
 */
export function reconcile(prev: Ledger | null, snapshot: Snapshot): ReconcileResult {
  const fired = new Set(prev?.fired ?? [])
  const holders: Record<HolderKey, TeamId> = { ...EMPTY_HOLDERS, ...(prev?.holders ?? {}) }
  const events: WallEvent[] = []

  const byId = new Map(snapshot.teams.map((team) => [team.teamId, team]))

  // Sorted by team ID rather than by rank, so the emitted order is stable
  // regardless of how the sheet happened to order its rows.
  const teams = [...snapshot.teams].sort((a, b) => a.teamId.localeCompare(b.teamId))

  for (const team of teams) {
    const named = team.ventureName !== ''

    for (const threshold of CARD_REVENUE_THRESHOLDS) {
      if (team.totalRevenue >= threshold && claim(fired, `rev:${team.teamId}:${threshold}`) && named) {
        events.push(revenueCard(team, threshold))
      }
    }
    for (const threshold of HERO_REVENUE_THRESHOLDS) {
      if (team.totalRevenue >= threshold && claim(fired, `rev:${team.teamId}:${threshold}`) && named) {
        events.push(revenueHero(team, threshold))
      }
    }
    if (team.streakDays >= CARD_STREAK_DAYS && claim(fired, `streak:${team.teamId}:${CARD_STREAK_DAYS}`) && named) {
      events.push(streakCard(team))
    }
    if (team.streakDays >= HERO_STREAK_DAYS && claim(fired, `streak:${team.teamId}:${HERO_STREAK_DAYS}`) && named) {
      events.push(streakHero(team))
    }
  }

  // ── Weekly winners ──
  //
  // Keyed off the sheet's `closed_week_number`, which is written at rollover and
  // held stable for the following seven days. That dwell time is the point: a TV
  // loading at any moment during the next week fires each award exactly once,
  // with no client-side week maths and no dependence on being switched on at
  // midnight. A mid-week correction to a winner does not replay, which is right
  // — a correction is not news.
  const week = Math.trunc(amount(snapshot.cohort.closed_week_number))
  if (week >= 1) {
    for (const { award, teamKey, valueKey } of WEEKLY_AWARDS) {
      const teamId = snapshot.cohort[teamKey] ?? ''
      if (teamId === '') continue
      if (!claim(fired, `week:${week}:${award}`)) continue
      const team = byId.get(teamId)
      if (team && team.ventureName !== '') {
        events.push(weeklyHero(team, week, award, amount(snapshot.cohort[valueKey])))
      }
    }
  }

  // ── Rank 1 ──
  //
  // An overtake needs a defender. The first team to sell anything takes rank 1
  // from nobody, which is not a change of hands — the holder is recorded and
  // nothing plays, because the sequence is built around one venture displacing
  // another and there would be no second venture to show.
  const previousLeader = holders.rank1
  const leader = leaderOf(rankTeams(snapshot.teams))
  if (handover(holders, 'rank1', leader) && previousLeader !== '') {
    const team = byId.get(leader)
    const defender = byId.get(previousLeader)
    if (team && team.ventureName !== '') {
      events.push(overtakeEvent(team, previousLeader, defender?.ventureName ?? ''))
    }
  }

  // ── Daily and all-time titles ──
  for (const { key, teamKey, valueKey } of DAILY_TITLES) {
    const teamId = snapshot.cohort[teamKey] ?? ''
    if (!handover(holders, key, teamId)) continue
    const team = byId.get(teamId)
    if (team && team.ventureName !== '') {
      events.push(titleCard(team, key, amount(snapshot.cohort[valueKey])))
    }
  }

  const ledger: Ledger = { fired: [...fired].sort(), holders }
  return prev === null ? { ledger, events: [] } : { ledger, events }
}

// ── Event constructors ──────────────────────────────────────────────────────
//
// The id doubles as the dedup key, and choosing it *is* the staleness policy.
// Milestone ids are unique forever, so they accumulate in the queue. Title and
// overtake ids are constant, so a newer holder replaces an older entry — a card
// announcing a title its team no longer holds would be a lie on screen.

function revenueCard(team: Team, threshold: number): CardEvent {
  return {
    id: `rev:${team.teamId}:${threshold}`,
    kind: 'card',
    teamId: team.teamId,
    ventureName: team.ventureName,
    type: 'revenue',
    threshold,
    totalRevenue: team.totalRevenue,
  }
}

function revenueHero(team: Team, threshold: number): HeroEvent {
  return {
    id: `rev:${team.teamId}:${threshold}`,
    kind: 'hero',
    teamId: team.teamId,
    ventureName: team.ventureName,
    type: 'revenue',
    threshold,
    totalRevenue: team.totalRevenue,
  }
}

function streakCard(team: Team): CardEvent {
  return {
    id: `streak:${team.teamId}:${CARD_STREAK_DAYS}`,
    kind: 'card',
    teamId: team.teamId,
    ventureName: team.ventureName,
    type: 'streak',
    days: CARD_STREAK_DAYS,
  }
}

function streakHero(team: Team): HeroEvent {
  return {
    id: `streak:${team.teamId}:${HERO_STREAK_DAYS}`,
    kind: 'hero',
    teamId: team.teamId,
    ventureName: team.ventureName,
    type: 'streak',
    days: HERO_STREAK_DAYS,
  }
}

function weeklyHero(team: Team, week: number, award: WeeklyAward, value: number): HeroEvent {
  return {
    id: `week:${week}:${award}`,
    kind: 'hero',
    teamId: team.teamId,
    ventureName: team.ventureName,
    type: 'weekly',
    week,
    award,
    value,
  }
}

function titleCard(team: Team, title: Exclude<HolderKey, 'rank1'>, value: number): CardEvent {
  return {
    id: `title:${title}`,
    kind: 'card',
    teamId: team.teamId,
    ventureName: team.ventureName,
    type: 'title',
    title,
    value,
  }
}

function overtakeEvent(team: Team, fromTeamId: TeamId, fromVentureName: string): OvertakeEvent {
  return {
    id: 'overtake:rank1',
    kind: 'overtake',
    teamId: team.teamId,
    ventureName: team.ventureName,
    fromTeamId,
    fromVentureName,
  }
}
