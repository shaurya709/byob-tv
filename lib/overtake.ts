import type { BoardState, OvertakeEvent, Team, TeamId } from '@/lib/types'

/**
 * Detecting a rank changing hands. One pure function.
 *
 * **This module reads no clock, no storage, no network and no DOM.** Not by
 * convention — a source-scan test fails the build if `Date`, `Math.random`,
 * `localStorage`, `fetch`, `window` or `document` appear here. Whether a boot
 * kick fires has to depend on the data and nothing else; a detector that could
 * consult the machine's clock would animate differently on two TVs showing the
 * same board. The 6pm question is answered in `lib/schedule.ts`, deliberately
 * far away from this file.
 *
 * ── Seeding is the same code path as running ──
 *
 * A wall with no stored state records what it sees and animates nothing. So does
 * a wall whose stored state is from a different challenge week. Both route into
 * `prev === null`-shaped behaviour rather than a separate seed routine, which is
 * what makes "a TV plugged in during week five behaves like one running since
 * day one" true rather than aspirational.
 */

/** The rank each team currently holds, 1-based, in the order given. */
function ranksOf(ranked: readonly Team[]): Record<TeamId, number> {
  const ranks: Record<TeamId, number> = {}
  ranked.forEach((team, index) => {
    ranks[team.teamId] = index + 1
  })
  return ranks
}

function earnedOf(ranked: readonly Team[], earned: (team: Team) => number): Record<TeamId, number> {
  const values: Record<TeamId, number> = {}
  for (const team of ranked) values[team.teamId] = earned(team)
  return values
}

export type DetectInput = {
  /** Already sorted by the board's own comparator. */
  ranked: readonly Team[]
  /** From `TV_Cohort`. `null` means the sheet did not say. */
  week: number | null
  /** How far down the board a change is worth animating. */
  watchTo: number
  /** The figure that earned the climb — week revenue on `/weekly`, all-time on `/podium`. */
  earned: (team: Team) => number
  /**
   * Rows per rendered column, for a board laid out in columns. The weekly board
   * is two columns of 20; the podium is one list and omits this entirely.
   */
  columnLength?: number
}

export type DetectResult = {
  state: BoardState
  events: OvertakeEvent[]
}

export function detect(prev: BoardState | null, input: DetectInput): DetectResult {
  const { ranked, week, watchTo, earned, columnLength } = input
  const state: BoardState = { week, ranks: ranksOf(ranked), earned: earnedOf(ranked, earned) }

  // Nothing to compare against, or the week rolled over and every figure on the
  // board reset to zero together. Record and stay silent.
  if (prev === null || prev.week !== week) return { state, events: [] }

  const events: OvertakeEvent[] = []
  const previousHolder = new Map<number, TeamId>()
  for (const [teamId, rank] of Object.entries(prev.ranks)) previousHolder.set(rank, teamId)

  for (const team of ranked) {
    const toRank = state.ranks[team.teamId]
    const fromRank = prev.ranks[team.teamId]

    // Not previously on the board at all — a team appearing for the first time
    // has not overtaken anyone, it has arrived.
    if (fromRank === undefined) continue
    if (toRank >= fromRank) continue
    if (toRank > watchTo) continue

    // **A kick that would cross a column boundary never fires.**
    //
    // The animation renders a kick as vertical slides inside one column: the
    // attacker climbs its column, the defender falls one row straight down. A
    // climb starting in one column and ending in the other has no vertical line
    // to travel, so the event is skipped — silently, with no bespoke motion and
    // no fallback. The data still re-sorts on the next applied snapshot.
    //
    // This one check also retires every boundary defender. A defender at a
    // column's last rank — 20, or 40 at the board's bottom edge — whose fall
    // would cross into the next column (or off the board) can only have been
    // attacked *from* that next column, because every rank above it is in its
    // own column. That attack is exactly the crossing suppressed here.
    if (columnLength !== undefined) {
      const columnOf = (rank: number) => Math.ceil(rank / columnLength)
      if (columnOf(fromRank) !== columnOf(toRank)) continue
    }

    // **You overtake by scoring, not by someone else stumbling.**
    //
    // A rank can improve with no effort at all: when a leader's revenue is
    // corrected downward, every team below rises a place, and reading rank alone
    // that is nineteen simultaneous overtakes of teams nobody passed. Requiring
    // the attacker's own figure to have gone *up* is the difference between news
    // and arithmetic — and it subsumes the zero floor, since a team that gained
    // is above zero by construction.
    if (earned(team) <= (prev.earned[team.teamId] ?? 0)) continue

    const defender = previousHolder.get(toRank)
    // Whoever was standing in the slot this team just took. If nobody was — the
    // board was shorter last time — there is no contest to show.
    if (defender === undefined || defender === team.teamId) continue

    const defenderTeam = ranked.find((row) => row.teamId === defender)
    events.push({
      id: `${week ?? 'x'}:${team.teamId}:${toRank}`,
      attacker: team.teamId,
      attackerName: team.ventureName,
      defender,
      defenderName: defenderTeam?.ventureName ?? '',
      fromRank,
      toRank,
    })
  }

  // Biggest climb first. When several land in one fetch the queue is capped, so
  // what survives should be the one most worth watching rather than whichever
  // team id happened to sort first.
  events.sort((a, b) => b.fromRank - b.toRank - (a.fromRank - a.toRank))
  return { state, events }
}
