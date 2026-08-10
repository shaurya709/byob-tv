import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { cohort, teams } from '@/test/fixtures'
import { reconcile } from '@/lib/triggers'
import type { Ledger, Snapshot, Team, WallEvent } from '@/lib/types'

function snapshot(rows: Team[], values: Record<string, string> = {}): Snapshot {
  return { teams: rows, cohort: cohort(values) }
}

/** Seed against a snapshot, returning the ledger a running TV would hold. */
function seed(input: Snapshot): Ledger {
  return reconcile(null, input).ledger
}

function ids(events: WallEvent[]): string[] {
  return events.map((event) => event.id)
}

describe('seeding', () => {
  it('emits nothing on a quiet cohort', () => {
    expect(reconcile(null, snapshot(teams())).events).toEqual([])
  })

  /**
   * The case that matters: a TV plugged in during week five, or a localStorage
   * wipe. Without the seed gate this fires roughly 250 animations in one tick,
   * in public.
   */
  it('emits nothing even when every team is past every threshold', () => {
    const loud = teams().map((team) => ({
      ...team,
      totalRevenue: 450_000,
      totalUnits: 900,
      streakDays: 20,
    }))
    const result = reconcile(
      null,
      snapshot(loud, {
        closed_week_number: '3',
        closed_week_revenue_team: 'SLE-C401',
        closed_week_climb_team: 'SLE-C402',
        closed_week_improved_team: 'SLE-C403',
        biggest_sale_today_team: 'SLE-C404',
        most_units_today_team: 'SLE-C405',
        biggest_revenue_day_team: 'SLE-C406',
      }),
    )
    expect(result.events).toEqual([])
    // But it did record all of it, so none of it can fire later.
    expect(result.ledger.fired.length).toBeGreaterThan(250)
    expect(result.ledger.holders.rank1).not.toBe('')
  })
})

/**
 * The single property that *proves* seeding and steady state are the same code
 * path. They cannot drift apart, because there is one computation and a gate on
 * its output rather than two branches that must be kept in step.
 */
describe('idempotence', () => {
  const fixtures: [string, Snapshot][] = [
    ['quiet cohort', snapshot(teams())],
    ['one team trading', snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 120_000, streakDays: 9 }]))],
    [
      'everything at once',
      snapshot(
        teams([
          { teamId: 'SLE-C407', totalRevenue: 450_000, totalUnits: 800, streakDays: 20 },
          { teamId: 'SLE-C412', totalRevenue: 260_000, totalUnits: 400, streakDays: 15 },
        ]),
        {
          closed_week_number: '2',
          closed_week_revenue_team: 'SLE-C407',
          closed_week_climb_team: 'SLE-C412',
          closed_week_improved_team: 'SLE-C407',
          biggest_sale_today_team: 'SLE-C412',
          most_units_today_team: 'SLE-C407',
          biggest_revenue_day_team: 'SLE-C407',
        },
      ),
    ],
    ['nameless teams', snapshot(teams().map((team) => ({ ...team, ventureName: '', totalRevenue: 90_000 })))],
  ]

  for (const [name, input] of fixtures) {
    it(`re-running over the same snapshot emits nothing — ${name}`, () => {
      expect(reconcile(seed(input), input).events).toEqual([])
    })
  }
})

describe('revenue milestones', () => {
  it('fires a sub-card at ₹25,000 and ₹50,000', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(before, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 60_000 }])))
    expect(ids(after.events)).toEqual(['rev:SLE-C407:25000', 'rev:SLE-C407:50000'])
    expect(after.events.every((event) => event.kind === 'card')).toBe(true)
  })

  it('fires a hero at ₹1,00,000 and above', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(before, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 210_000 }])))
    const heroes = after.events.filter((event) => event.kind === 'hero')
    expect(ids(heroes)).toEqual(['rev:SLE-C407:100000', 'rev:SLE-C407:200000'])
  })

  it('does not re-fire on the next tick', () => {
    const before = seed(snapshot(teams()))
    const crossed = snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 120_000 }]))
    const first = reconcile(before, crossed)
    expect(first.events.length).toBeGreaterThan(0)
    expect(reconcile(first.ledger, crossed).events).toEqual([])
  })

  /**
   * Corrections happen. Set membership gives "once per team ever" for free,
   * where a delta check would fire again on the re-crossing.
   */
  it('does not re-fire after revenue is corrected down and back up', () => {
    let ledger = seed(snapshot(teams()))
    ledger = reconcile(ledger, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 110_000 }]))).ledger
    ledger = reconcile(ledger, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 90_000 }]))).ledger
    const again = reconcile(ledger, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 110_000 }])))
    expect(again.events).toEqual([])
  })

  /**
   * A tick discarded by the row gate, or a page that was closed over the
   * weekend, means the wall never observes the intermediate value. Membership
   * cannot miss it; a delta check would.
   */
  it('fires every threshold crossed while the wall was not looking', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(before, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 410_000 }])))
    expect(ids(after.events)).toEqual([
      'rev:SLE-C407:25000',
      'rev:SLE-C407:50000',
      'rev:SLE-C407:100000',
      'rev:SLE-C407:200000',
      'rev:SLE-C407:300000',
      'rev:SLE-C407:400000',
    ])
  })
})

describe('streaks', () => {
  it('fires a sub-card at 7 days and a hero at 14', () => {
    const before = seed(snapshot(teams()))
    const seven = reconcile(before, snapshot(teams([{ teamId: 'SLE-C407', streakDays: 7 }])))
    expect(ids(seven.events)).toEqual(['streak:SLE-C407:7'])

    const fourteen = reconcile(seven.ledger, snapshot(teams([{ teamId: 'SLE-C407', streakDays: 14 }])))
    expect(ids(fourteen.events)).toEqual(['streak:SLE-C407:14'])
    expect(fourteen.events[0].kind).toBe('hero')
  })

  it('does not re-fire when a streak keeps growing', () => {
    let ledger = seed(snapshot(teams()))
    ledger = reconcile(ledger, snapshot(teams([{ teamId: 'SLE-C407', streakDays: 14 }]))).ledger
    expect(reconcile(ledger, snapshot(teams([{ teamId: 'SLE-C407', streakDays: 21 }]))).events).toEqual([])
  })
})

/**
 * `claim` runs BEFORE the venture-name check, and the order is load-bearing.
 *
 * Skipping nameless teams entirely would mean that the day someone fills in a
 * venture name, that team detonates six triggers at once as a single burst of
 * stale news — and a transiently blank cell mid-edit would re-fire a milestone
 * already shown. The ledger records facts about the data; the name check governs
 * what is fit to display.
 */
describe('teams without a venture name', () => {
  it('records the milestone but shows nothing', () => {
    const before = seed(snapshot(teams()))
    const nameless = teams([{ teamId: 'SLE-C407', ventureName: '', totalRevenue: 120_000 }])
    const after = reconcile(before, snapshot(nameless))

    expect(after.events).toEqual([])
    expect(after.ledger.fired).toContain('rev:SLE-C407:100000')
  })

  it('still shows nothing once the name is filled in later', () => {
    const before = seed(snapshot(teams()))
    const nameless = reconcile(
      before,
      snapshot(teams([{ teamId: 'SLE-C407', ventureName: '', totalRevenue: 120_000 }])),
    )
    const named = reconcile(
      nameless.ledger,
      snapshot(teams([{ teamId: 'SLE-C407', ventureName: 'Aurora', totalRevenue: 120_000 }])),
    )
    expect(named.events).toEqual([])
  })
})

describe('weekly winners', () => {
  const week3 = {
    closed_week_number: '3',
    closed_week_revenue_team: 'SLE-C407',
    closed_week_revenue_amount: '48000',
    closed_week_climb_team: 'SLE-C412',
    closed_week_climb_ranks: '9',
    closed_week_improved_team: 'SLE-C403',
    closed_week_improved_delta: '21000',
  }

  it('fires all three awards once when a week closes', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(before, snapshot(teams(), week3))
    expect(ids(after.events)).toEqual(['week:3:revenue', 'week:3:climb', 'week:3:improved'])
  })

  /**
   * The reason the closed-week block is held stable for seven days rather than
   * read at the midnight rollover: the wall can first see it on Wednesday and
   * still be correct, and every later tick that week is silent.
   */
  it('does not re-fire on later ticks in the same week', () => {
    const before = seed(snapshot(teams()))
    const fired = reconcile(before, snapshot(teams(), week3))
    expect(reconcile(fired.ledger, snapshot(teams(), week3)).events).toEqual([])
  })

  it('fires again when the next week closes', () => {
    const before = seed(snapshot(teams()))
    const third = reconcile(before, snapshot(teams(), week3))
    const fourth = reconcile(
      third.ledger,
      snapshot(teams(), { ...week3, closed_week_number: '4' }),
    )
    expect(ids(fourth.events)).toEqual(['week:4:revenue', 'week:4:climb', 'week:4:improved'])
  })

  it('stays silent before the first week closes', () => {
    const before = seed(snapshot(teams()))
    expect(reconcile(before, snapshot(teams(), { closed_week_number: '0' })).events).toEqual([])
  })

  it('skips an award with no winner', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(
      before,
      snapshot(teams(), { ...week3, closed_week_climb_team: '' }),
    )
    expect(ids(after.events)).toEqual(['week:3:revenue', 'week:3:improved'])
  })

  /** A mid-week correction is not news. */
  it('does not replay when a winner is corrected mid-week', () => {
    const before = seed(snapshot(teams()))
    const fired = reconcile(before, snapshot(teams(), week3))
    const corrected = reconcile(
      fired.ledger,
      snapshot(teams(), { ...week3, closed_week_revenue_team: 'SLE-C420' }),
    )
    expect(corrected.events).toEqual([])
  })
})

describe('rank 1', () => {
  /**
   * The tie-break makes the sort total, so without a revenue floor the "leader"
   * before anyone trades would be whichever team ID sorts first — and the first
   * real sale would announce "X overtakes SLE-C401", naming a team that never
   * led anything.
   */
  it('has no leader while every team is on zero', () => {
    expect(seed(snapshot(teams())).holders.rank1).toBe('')
  })

  /**
   * An overtake needs a defender. The first team to sell takes rank 1 from
   * nobody, and the sequence is built around one venture displacing another —
   * there would be no second venture to animate.
   */
  it('records the first leader without firing an overtake', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(before, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 30_000 }])))

    expect(after.events.filter((event) => event.kind === 'overtake')).toEqual([])
    expect(after.ledger.holders.rank1).toBe('SLE-C407')
  })

  it('fires an overtake when rank 1 changes hands', () => {
    const before = seed(snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 100_000 }])))
    expect(before.holders.rank1).toBe('SLE-C407')

    const after = reconcile(
      before,
      snapshot(
        teams([
          { teamId: 'SLE-C407', totalRevenue: 100_000 },
          { teamId: 'SLE-C412', totalRevenue: 150_000 },
        ]),
      ),
    )
    const overtake = after.events.find((event) => event.kind === 'overtake')
    expect(overtake).toMatchObject({ teamId: 'SLE-C412', fromTeamId: 'SLE-C407' })
  })

  it('does not fire while the same team stays ahead', () => {
    const ahead = snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 100_000 }]))
    const before = seed(ahead)
    const after = reconcile(before, snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 180_000 }])))
    expect(after.events.filter((event) => event.kind === 'overtake')).toEqual([])
  })

  it('breaks a revenue tie on units, then on team ID', () => {
    const before = seed(snapshot(teams([{ teamId: 'SLE-C407', totalRevenue: 100_000, totalUnits: 10 }])))
    const after = reconcile(
      before,
      snapshot(
        teams([
          { teamId: 'SLE-C407', totalRevenue: 100_000, totalUnits: 10 },
          { teamId: 'SLE-C412', totalRevenue: 100_000, totalUnits: 25 },
        ]),
      ),
    )
    expect(after.ledger.holders.rank1).toBe('SLE-C412')
  })
})

describe('daily titles', () => {
  it('fires when a title is taken', () => {
    const before = seed(snapshot(teams()))
    const after = reconcile(
      before,
      snapshot(teams(), { biggest_sale_today_team: 'SLE-C412', biggest_sale_today_amount: '9500' }),
    )
    expect(ids(after.events)).toEqual(['title:biggestSaleToday'])
    expect(after.events[0]).toMatchObject({ kind: 'card', teamId: 'SLE-C412' })
  })

  /**
   * Titles legitimately reset to empty at midnight and refill with the day's
   * first sale, so each fires about once a day. That is the intended ambient
   * news, not a bug — and it needs no date logic anywhere.
   */
  it('fires once across a midnight reset, on the refill', () => {
    let ledger = seed(snapshot(teams()))
    const held = { biggest_sale_today_team: 'SLE-C412' }

    ledger = reconcile(ledger, snapshot(teams(), held)).ledger
    const midnight = reconcile(ledger, snapshot(teams(), { biggest_sale_today_team: '' }))
    expect(midnight.events).toEqual([])

    const refilled = reconcile(midnight.ledger, snapshot(teams(), held))
    expect(ids(refilled.events)).toEqual(['title:biggestSaleToday'])
  })

  it('does not fire while the same team holds it', () => {
    const held = { most_units_today_team: 'SLE-C412' }
    const ledger = reconcile(seed(snapshot(teams())), snapshot(teams(), held)).ledger
    expect(reconcile(ledger, snapshot(teams(), held)).events).toEqual([])
  })
})

/**
 * The executable form of "the trigger system reads no clock".
 *
 * Every clock-dependent question was pushed into the sheet — which week closed,
 * whether a daily title reset — precisely so a TV with a wrong timezone cannot
 * change what fires. That claim is only true while it stays true, so it is
 * asserted rather than documented.
 */
describe('purity', () => {
  it('reads no clock, storage, network or DOM', () => {
    const source = readFileSync(new URL('./triggers.ts', import.meta.url), 'utf8')
    const body = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(body).not.toMatch(/\bDate\b|Math\.random|localStorage|sessionStorage|\bfetch\b|\bwindow\b|\bdocument\b/)
  })
})
