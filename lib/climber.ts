import type { Team } from '@/lib/types'

/**
 * Who to put in `/podium`'s mover panel, and what it can honestly say about them.
 *
 * ── Three states, and the panel is never blank ──
 *
 * `/podium` shortens first place's card permanently to make room for this panel,
 * so a panel that disappeared would leave a hole in the composition rather than
 * a quiet space. It always has something true to say instead:
 *
 * 1. `climb` — somebody has gained places since last week closed.
 * 2. `earn`  — nobody has gained, but somebody has traded this week. The panel
 *              relabels itself; it never claims a climb that did not happen.
 *              **This is also the state that runs before the sheet publishes
 *              `prev_week_rank` at all**, which is what lets the panel ship
 *              ahead of the column.
 * 3. `null`  — nobody has traded this week. The caller draws the label and an
 *              em dash, which is the convention the podium cards already use for
 *              "no figure yet".
 *
 * ── THE ₹0 RULE. Do not simplify this away. ──
 *
 * **A climb is measured only among teams that have banked something, on both
 * sides of the comparison.**
 *
 * Teams on ₹0 are separated from each other by the tie-break alone — units, then
 * team ID — so the bottom of the board is an arbitrary but stable ordering of
 * teams that have all done exactly the same amount of trading, which is none.
 * Without this rule a team logging its first ₹500 sale climbs fifteen places and
 * wins this panel every Monday, over ventures that actually moved. That is
 * noise, and a wall nobody is watching would repeat it for a week.
 *
 * The rule has two halves and both are needed:
 *
 * - **Now:** only teams with `totalRevenue > 0` are candidates. Cheap to check,
 *   because `compareTeams` sorts on revenue first, so every earning team already
 *   occupies the top of the board and its board rank *is* its rank among
 *   earners. No second ranking pass exists, and none is needed — if one ever
 *   appears here, the invariant it was working around has been broken instead.
 * - **Then:** `prevWeekRank` is `undefined` for a team that had banked nothing
 *   at last week's close, and a team with no previous standing has no climb
 *   rather than a large one. The sheet is what enforces this half, by leaving
 *   the cell blank; `lib/feed.ts` treats blank and `0` alike.
 */

export type Climb = {
  kind: 'climb'
  team: Team
  /** Where they stood when last week closed, among teams with revenue. */
  fromRank: number
  /** Where they stand now. */
  toRank: number
  weekRevenue: number
  /** `fromRank - toRank`, always at least 1. */
  gained: number
}

export type Earn = {
  kind: 'earn'
  team: Team
  toRank: number
  weekRevenue: number
}

/** The two are separate types rather than one wide shape, so a reader that
    forgets to check `kind` cannot reach `gained` on a team that did not climb. */
export type Mover = Climb | Earn

/**
 * The biggest mover, given the board's own ranked list.
 *
 * `ranked` must already be in board order — this function ranks nothing, which
 * keeps `lib/ranking.ts` the single authority on who is ahead of whom.
 */
export function biggestMover(ranked: readonly Team[]): Mover | null {
  let climb: Climb | null = null

  ranked.forEach((team, index) => {
    // The ₹0 rule, half one. Not a guard against bad data — a team on zero is
    // perfectly valid, it simply has no standing that can be improved on.
    if (team.totalRevenue <= 0) return
    // The ₹0 rule, half two.
    if (team.prevWeekRank === undefined) return

    const toRank = index + 1
    const gained = team.prevWeekRank - toRank
    if (gained < 1) return

    // Ties go to the bigger week. Two ventures up four places each is a real
    // possibility on a board of forty, and "whichever the sort happened to reach
    // first" is not an answer the wall should give twice differently.
    if (
      climb === null ||
      gained > climb.gained ||
      (gained === climb.gained && team.weekRevenue > climb.weekRevenue)
    ) {
      climb = {
        kind: 'climb',
        team,
        fromRank: team.prevWeekRank,
        toRank,
        weekRevenue: team.weekRevenue,
        gained,
      }
    }
  })

  if (climb !== null) return climb

  // Nobody climbed. Fall back to the best week anyone has had — which is a
  // different claim, and the panel's label says so.
  let earn: Earn | null = null
  ranked.forEach((team, index) => {
    if (team.weekRevenue <= 0) return
    if (earn === null || team.weekRevenue > earn.weekRevenue) {
      earn = { kind: 'earn', team, toRank: index + 1, weekRevenue: team.weekRevenue }
    }
  })

  return earn
}
