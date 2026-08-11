import type { Team } from '@/lib/types'

/**
 * Absolute ranking. Extracted verbatim from the v1 trigger engine when that
 * engine was deleted — this is ordering, not a trigger, and both v2 slides need
 * it while neither needs anything else that file did.
 *
 * Logged revenue desc → units desc → team ID asc. Identical to the admin
 * dashboard's `compareTieBreak`, so the wall and the dashboard can never
 * disagree about who is ahead.
 *
 * The tie-break makes the sort **total**, which is load-bearing: an order that
 * can shuffle between two identical fetches reads as a rank change, and a rank
 * change is what fires the boot kick.
 */
export function compareTeams(a: Team, b: Team): number {
  if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue
  if (b.totalUnits !== a.totalUnits) return b.totalUnits - a.totalUnits
  return a.teamId.localeCompare(b.teamId)
}

export function rankTeams(teams: readonly Team[]): Team[] {
  return [...teams].sort(compareTeams)
}
