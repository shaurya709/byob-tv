import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { compareTeams, compareWeek, competingTeams, rankByWeek, rankTeams } from '@/lib/ranking'
import { teams } from '@/test/fixtures'

describe('rankTeams', () => {
  it('orders by revenue, then units, then team id', () => {
    const ranked = rankTeams(
      teams([
        { teamId: 'SLE-C403', totalRevenue: 50_000, totalUnits: 10 },
        { teamId: 'SLE-C401', totalRevenue: 50_000, totalUnits: 25 },
        { teamId: 'SLE-C402', totalRevenue: 90_000 },
      ]),
    )
    expect(ranked.slice(0, 3).map((team) => team.teamId)).toEqual([
      'SLE-C402',
      'SLE-C401',
      'SLE-C403',
    ])
  })

  it('does not mutate its input', () => {
    const input = teams([{ teamId: 'SLE-C442', totalRevenue: 1 }])
    rankTeams(input)
    expect(input[0].teamId).toBe('SLE-C401')
  })
})

describe('rankByWeek', () => {
  it('orders by week revenue, then all-time revenue, then team id', () => {
    const ranked = rankByWeek(
      teams([
        { teamId: 'SLE-C401', weekRevenue: 4_000, totalRevenue: 10_000 },
        { teamId: 'SLE-C402', weekRevenue: 9_000, totalRevenue: 9_000 },
        { teamId: 'SLE-C403', weekRevenue: 4_000, totalRevenue: 80_000 },
      ]),
    )
    expect(ranked.slice(0, 3).map((team) => team.teamId)).toEqual([
      'SLE-C402',
      'SLE-C403',
      'SLE-C401',
    ])
  })

  /**
   * Monday morning: every team on ₹0 for the week. The order still has to be
   * *the same* order on the next fetch, or the board reshuffles for no reason
   * and every shuffle reads as an overtake.
   */
  it('is total when the whole cohort is on zero for the week', () => {
    const monday = teams().map((team, index) => ({ ...team, totalRevenue: 1_000 * (42 - index) }))
    const once = rankByWeek(monday).map((team) => team.teamId)
    const again = rankByWeek([...monday].reverse()).map((team) => team.teamId)
    expect(again).toEqual(once)
    // and it falls back to the standing the wall showed all last week
    expect(once[0]).toBe('SLE-C401')
  })

  it('never returns 0 for two different teams', () => {
    const [a, b] = teams()
    expect(compareWeek(a, b)).not.toBe(0)
    expect(compareTeams(a, b)).not.toBe(0)
  })

  /**
   * Two teams identical on both revenue keys. `Array.sort` is stable, so without
   * the team-id key their order is *input* order — and input order is CSV row
   * order, which the wall does not control.
   */
  it('orders teams tied on both revenues by team id, whatever order they arrive in', () => {
    const tied = teams([
      { teamId: 'SLE-C401', weekRevenue: 5_000, totalRevenue: 5_000 },
      { teamId: 'SLE-C402', weekRevenue: 5_000, totalRevenue: 5_000 },
    ]).slice(0, 2)
    expect(rankByWeek(tied)[0].teamId).toBe('SLE-C401')
    expect(rankByWeek([...tied].reverse())[0].teamId).toBe('SLE-C401')
  })
})

describe('competingTeams', () => {
  it('drops the two spare workbooks', () => {
    const competing = competingTeams(teams())
    expect(competing).toHaveLength(40)
    expect(competing.map((team) => team.teamId)).not.toContain('SLE-C441')
    expect(competing.map((team) => team.teamId)).not.toContain('SLE-C442')
  })
})

/**
 * The executable form of "ranking reads no clock".
 *
 * Without this the claim is a comment, and a comment does not stop the next
 * change from reaching for `Date.now()` to break a tie. A rank that varies with
 * the machine it ran on fires boot kicks that no data change justifies.
 */
describe('purity', () => {
  it('lib/ranking.ts touches no clock, randomness, storage, network or DOM', () => {
    const source = readFileSync(new URL('./ranking.ts', import.meta.url), 'utf8')
    const body = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(body).not.toMatch(
      /\bDate\b|Math\.random|localStorage|sessionStorage|\bfetch\b|\bwindow\b|\bdocument\b/,
    )
  })
})
