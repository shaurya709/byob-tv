import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { WATCH_RANKS_WEEKLY } from '@/config'
import { detect } from '@/lib/overtake'
import { rankByWeek } from '@/lib/ranking'
import { teams } from '@/test/fixtures'
import type { BoardState, Team } from '@/lib/types'

/** A board where team n has week revenue (42 - n) thousand: C401 leads, C442 last. */
function board(overrides: Partial<Team>[] = []): Team[] {
  return teams(overrides).map((team, index) => ({
    ...team,
    weekRevenue: team.weekRevenue || 1_000 * (42 - index),
    totalRevenue: team.totalRevenue || 1_000 * (42 - index),
  }))
}

function run(
  prev: BoardState | null,
  rows: readonly Team[],
  week: number | null = 4,
  watchTo: number = WATCH_RANKS_WEEKLY,
) {
  return detect(prev, {
    ranked: rankByWeek(rows),
    week,
    watchTo,
    earned: (team) => team.weekRevenue,
    columnLength: 20,
  })
}

describe('seeding', () => {
  it('records everything and animates nothing on a wall with no memory', () => {
    const { state, events } = run(null, board())
    expect(events).toEqual([])
    expect(state.ranks['SLE-C401']).toBe(1)
    expect(state.week).toBe(4)
  })

  /**
   * The reason a TV plugged in during week five behaves like one that has been
   * running since day one. Seeding and steady state are one computation with a
   * gate on the output, so they cannot drift apart.
   */
  it('is idempotent — the same fetch twice emits nothing the second time', () => {
    const rows = board()
    const first = run(null, rows)
    expect(run(first.state, rows).events).toEqual([])
  })
})

describe('detection', () => {
  it('emits one event for one climb, naming the team whose slot was taken', () => {
    const before = run(null, board()).state
    // C405 was 5th; enough week revenue to take 2nd.
    const { events } = run(before, board([{ teamId: 'SLE-C405', weekRevenue: 41_500 }]))
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      attacker: 'SLE-C405',
      defender: 'SLE-C402',
      fromRank: 5,
      toRank: 2,
    })
  })

  /**
   * A climb past eight teams shifts eight rows. Emitting one event per changed
   * *position* would fire eight kicks for one piece of news.
   */
  it('emits one event, not one per row that shifted', () => {
    const before = run(null, board()).state
    const { events } = run(before, board([{ teamId: 'SLE-C412', weekRevenue: 41_500 }]))
    expect(events).toHaveLength(1)
    expect(events[0].attacker).toBe('SLE-C412')
  })

  it('emits one event per team when two climb in the same fetch', () => {
    const before = run(null, board()).state
    const { events } = run(
      before,
      board([
        { teamId: 'SLE-C410', weekRevenue: 41_500 },
        { teamId: 'SLE-C415', weekRevenue: 40_500 },
      ]),
    )
    expect(events.map((event) => event.attacker).sort()).toEqual(['SLE-C410', 'SLE-C415'])
  })

  it('orders the biggest climb first, since the queue is capped', () => {
    const before = run(null, board()).state
    const { events } = run(
      before,
      board([
        { teamId: 'SLE-C403', weekRevenue: 41_500 },
        { teamId: 'SLE-C420', weekRevenue: 40_500 },
      ]),
    )
    expect(events[0].attacker).toBe('SLE-C420')
  })

  it('ignores a change below the watched depth', () => {
    const before = run(null, board()).state
    // C440 climbs to 25th — real, but nobody is reading that far down.
    const { events } = run(before, board([{ teamId: 'SLE-C440', weekRevenue: 17_500 }]))
    expect(events).toEqual([])
  })

  /**
   * Found by this test, not by reading the code. When a leader's revenue is
   * corrected downward every team below rises a place, and on rank alone that is
   * nineteen simultaneous overtakes of teams nobody passed.
   */
  it('says nothing when the whole board is lifted by one team falling', () => {
    const before = run(null, board()).state
    const { events } = run(before, board([{ teamId: 'SLE-C401', weekRevenue: 1 }]))
    expect(events).toEqual([])
  })

  it('says nothing when a team is overtaken and takes its place back with no new sales', () => {
    const seeded = run(null, board()).state
    const climbed = run(seeded, board([{ teamId: 'SLE-C405', weekRevenue: 41_500 }]))
    expect(climbed.events).toHaveLength(1)
    // C402's revenue never moved; it is back at 2nd only because C405's was
    // restated. Nobody overtook anybody.
    const back = run(climbed.state, board())
    expect(back.events).toEqual([])
  })
})

describe('the floor and the rollover', () => {
  /**
   * Without the floor, the first real sale of a week sends one team past thirty
   * still on ₹0 and the wall calls it thirty overtakes of teams that were never
   * ahead in any sense a passer-by would recognise.
   */
  it('does not credit a climb to a team still on zero', () => {
    const flat = teams().map((team) => ({ ...team, weekRevenue: 0, totalRevenue: 0 }))
    const before = run(null, flat).state
    // C442 sorts last on team id alone; give it all-time revenue but no week.
    const { events } = run(
      before,
      flat.map((team) => (team.teamId === 'SLE-C442' ? { ...team, totalRevenue: 99_000 } : team)),
    )
    expect(events).toEqual([])
  })

  /**
   * Monday 00:00 IST zeroes every team's week revenue at once. That is a reset,
   * not forty overtakes, and the week number is what tells them apart.
   */
  it('re-seeds silently when the challenge week rolls over', () => {
    const before = run(null, board(), 4).state
    const monday = teams().map((team) => ({ ...team, weekRevenue: 0 }))
    const { state, events } = run(before, monday, 5)
    expect(events).toEqual([])
    expect(state.week).toBe(5)
  })

  it('still animates normally on the fetch after a rollover', () => {
    const monday = teams().map((team) => ({ ...team, weekRevenue: 0, totalRevenue: 1_000 }))
    const seeded = run(run(null, board(), 4).state, monday, 5).state
    // C410, not a right-column team: on the all-tied Monday board ranks follow
    // team id, so a deeper climber would cross the column boundary and be
    // suppressed — which is its own test below, not this one.
    const { events } = run(
      seeded,
      monday.map((team) => (team.teamId === 'SLE-C410' ? { ...team, weekRevenue: 9_000 } : team)),
      5,
    )
    expect(events).toHaveLength(1)
    expect(events[0].attacker).toBe('SLE-C410')
  })

  it('treats a team that was not on the board before as arriving, not overtaking', () => {
    const before: BoardState = { week: 4, ranks: { 'SLE-C401': 1 }, earned: { 'SLE-C401': 41_000 } }
    const { events } = run(before, board())
    expect(events).toEqual([])
  })
})

/**
 * The kick renders as vertical slides inside one column. Ranks 1-20 are the left
 * column, 21-40 the right; a climb from one into the other has no vertical line
 * to travel and must not fire. The board still re-sorts silently.
 */
describe('cross-column suppression', () => {
  it('suppresses a climb from the right column into the left', () => {
    const before = run(null, board()).state
    // C425 was 25th; enough to take 18th — a real overtake, but its motion
    // would cross the column boundary.
    const { events } = run(before, board([{ teamId: 'SLE-C425', weekRevenue: 25_500 }]))
    expect(events).toEqual([])
  })

  /**
   * Rank 20 is never a defender: its attacker can only come from rank 21 or
   * deeper, which is the right column, which is the crossing above.
   */
  it('suppresses the attack on a rank-20 defender', () => {
    const before = run(null, board()).state
    // C424 was 24th; enough to take 20th exactly.
    const { events } = run(before, board([{ teamId: 'SLE-C424', weekRevenue: 23_500 }]))
    expect(events).toEqual([])
  })

  /**
   * Rank 40 is never a defender either: watched that deep, its attacker can
   * only come from rank 41+, a third "column" past the board's edge — the same
   * crossing arithmetic, at the bottom instead of the seam.
   */
  it('suppresses the attack on a rank-40 defender even when watched that deep', () => {
    const before = run(null, board(), 4, 40).state
    // C441 was 41st; enough to take 40th.
    const climbed = board([{ teamId: 'SLE-C441', weekRevenue: 3_500 }])
    expect(rankByWeek(climbed)[39].teamId).toBe('SLE-C441') // the climb is real
    const { events } = run(before, climbed, 4, 40)
    expect(events).toEqual([])
  })

  it('fires normally for a climb held inside one column', () => {
    const before = run(null, board()).state
    // C408 was 8th; enough to take 5th. Entirely inside the left column.
    const { events } = run(before, board([{ teamId: 'SLE-C408', weekRevenue: 38_500 }]))
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ attacker: 'SLE-C408', fromRank: 8, toRank: 5 })
  })

  it('does not suppress anything when the board declares no columns', () => {
    const before = run(null, board()).state
    const { events } = detect(before, {
      ranked: rankByWeek(board([{ teamId: 'SLE-C425', weekRevenue: 25_500 }])),
      week: 4,
      watchTo: WATCH_RANKS_WEEKLY,
      earned: (team) => team.weekRevenue,
    })
    expect(events).toHaveLength(1)
    expect(events[0].attacker).toBe('SLE-C425')
  })
})

/** The executable form of "whether a kick fires depends on the data and nothing else". */
describe('purity', () => {
  it('lib/overtake.ts touches no clock, randomness, storage, network or DOM', () => {
    const source = readFileSync(new URL('./overtake.ts', import.meta.url), 'utf8')
    const body = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(body).not.toMatch(
      /\bDate\b|Math\.random|localStorage|sessionStorage|\bfetch\b|\bwindow\b|\bdocument\b/,
    )
  })
})
