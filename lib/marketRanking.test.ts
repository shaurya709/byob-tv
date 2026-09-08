import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { compareMarket, gapToLastPlace, rankMarket, slotsOf } from '@/lib/marketRanking'
import { marketRow, marketRows } from '@/test/fixtures'

describe('compareMarket', () => {
  it('ranks on takings first', () => {
    const ranked = rankMarket([
      marketRow({ teamId: 'SLE-C401', takings: 3150 }),
      marketRow({ teamId: 'SLE-C415', takings: 9110 }),
      marketRow({ teamId: 'SLE-C411', takings: 6275 }),
    ])
    expect(ranked.map((row) => row.teamId)).toEqual(['SLE-C415', 'SLE-C411', 'SLE-C401'])
  })

  it('breaks a tie on transactions — six sales beat one', () => {
    const ranked = rankMarket([
      marketRow({ teamId: 'SLE-C427', takings: 600, txns: 1 }),
      marketRow({ teamId: 'SLE-C403', takings: 600, txns: 6 }),
    ])
    expect(ranked.map((row) => row.teamId)).toEqual(['SLE-C403', 'SLE-C427'])
  })

  it('does not mutate its input', () => {
    const rows = [marketRow({ teamId: 'SLE-C402', takings: 1 }), marketRow({ teamId: 'SLE-C401' })]
    const before = rows.map((row) => row.teamId)
    rankMarket(rows)
    expect(rows.map((row) => row.teamId)).toEqual(before)
  })

  /**
   * The most important test here.
   *
   * At 09:00 all forty stalls are on ₹0, and on the 29 August sample seventeen
   * were still on zero at a quarter to seven. Without a final tie-break their
   * order is whatever the CSV row order happened to be that minute — and a board
   * that reshuffles between two identical fetches is indistinguishable from
   * forty stalls overtaking each other.
   */
  it('is a total order when the whole market is on zero', () => {
    const rows = marketRows()
    const forwards = rankMarket(rows).map((row) => row.teamId)
    const backwards = rankMarket([...rows].reverse()).map((row) => row.teamId)
    expect(backwards).toEqual(forwards)
  })

  it('is a total order when takings and transactions both tie', () => {
    const rows = marketRows().map((row) => ({ ...row, takings: 500, txns: 2 }))
    expect(rankMarket([...rows].reverse()).map((r) => r.teamId)).toEqual(
      rankMarket(rows).map((r) => r.teamId),
    )
  })

  it('sorts a negative figure below a stall that has not traded', () => {
    // Not reachable from Razorpay today, but the comparator must not invent an
    // ordering if it ever is.
    const ranked = rankMarket([
      marketRow({ teamId: 'SLE-C401', takings: -100 }),
      marketRow({ teamId: 'SLE-C402', takings: 0 }),
    ])
    expect(ranked[0]?.teamId).toBe('SLE-C402')
  })

  it('returns 0 only for a row against itself', () => {
    const row = marketRow()
    expect(compareMarket(row, row)).toBe(0)
    expect(compareMarket(row, marketRow({ teamId: 'SLE-C402' }))).not.toBe(0)
  })
})

describe('slotsOf', () => {
  it('always returns exactly the count asked for', () => {
    for (const length of [0, 3, 7, 20, 40]) {
      expect(slotsOf(marketRows().slice(0, length), 20)).toHaveLength(20)
    }
  })

  it('pads the tail with null when the market has not filled up', () => {
    const slots = slotsOf(rankMarket(marketRows().slice(0, 3)), 20)
    expect(slots.slice(0, 3).every((slot) => slot !== null)).toBe(true)
    expect(slots.slice(3).every((slot) => slot === null)).toBe(true)
  })

  it('truncates a fuller market to the places the frame holds', () => {
    const slots = slotsOf(rankMarket(marketRows()), 20)
    expect(slots).toHaveLength(20)
    expect(slots.every((slot) => slot !== null)).toBe(true)
  })
})

describe('gapToLastPlace', () => {
  const ranked = rankMarket(
    marketRows(
      Array.from({ length: 21 }, (_, index) => ({
        teamId: `SLE-C4${String(index + 1).padStart(2, '0')}`,
        takings: (21 - index) * 100,
      })),
    ),
  )

  it('measures what a stall outside the places has to make up', () => {
    // 20th place holds 200; SLE-C421 holds 100.
    expect(gapToLastPlace(ranked, 20, 'SLE-C421')).toBe(100)
  })

  it('says nothing for a stall already inside the places', () => {
    expect(gapToLastPlace(ranked, 20, 'SLE-C401')).toBeNull()
  })

  it('says nothing while the board is not yet full', () => {
    // With nineteen stalls trading there is no twentieth place to be behind,
    // and "₹0 behind 20th" is a sentence about nothing.
    expect(gapToLastPlace(rankMarket(marketRows().slice(0, 19)), 20, 'SLE-C401')).toBeNull()
  })

  it('says nothing for a stall it cannot find', () => {
    expect(gapToLastPlace(ranked, 20, 'NONSENSE')).toBeNull()
  })
})

describe('marketRanking is pure', () => {
  it('reads no clock, no storage, no network and no DOM', () => {
    const source = readFileSync(new URL('./marketRanking.ts', import.meta.url), 'utf8')
    const body = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
    expect(body).not.toMatch(/\bDate\b|Math\.random|localStorage|fetch|window|document/)
  })
})
