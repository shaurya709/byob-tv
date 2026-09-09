import { describe, expect, it } from 'vitest'

import { filterStalls, matchesStall } from '@/lib/stallSearch'
import { marketRow, marketRows } from '@/test/fixtures'

const dosa = marketRow({ teamId: 'SLE-C401', ventureName: 'Dosa Crisps' })
const chakhana = marketRow({ teamId: 'SLE-C415', ventureName: 'CHAKHANA' })
const unnamed = marketRow({ teamId: 'SLE-C422', ventureName: '' })

describe('matchesStall', () => {
  it('matches the full team code, however it is typed', () => {
    for (const q of ['SLE-C401', 'sle-c401', 'SLE C401', 'slec401']) {
      expect(matchesStall(dosa, q)).toBe(true)
    }
  })

  it('matches the code without its prefix', () => {
    expect(matchesStall(dosa, 'C401')).toBe(true)
    expect(matchesStall(dosa, 'c401')).toBe(true)
  })

  it('matches on the number alone', () => {
    expect(matchesStall(dosa, '401')).toBe(true)
    expect(matchesStall(dosa, '01')).toBe(true)
    // A single digit is a filter, not a lookup: it narrows and the reader picks.
    expect(matchesStall(dosa, '1')).toBe(true)
    expect(matchesStall(chakhana, '1')).toBe(true)
    expect(matchesStall(chakhana, '15')).toBe(true)
    expect(matchesStall(dosa, '15')).toBe(false)
  })

  it('matches the venture name, in any case and part', () => {
    for (const q of ['dosa', 'CRISPS', 'Dosa Crisps', 'dosacrisps']) {
      expect(matchesStall(dosa, q)).toBe(true)
    }
    expect(matchesStall(dosa, 'chakhana')).toBe(false)
  })

  it('falls back to the team code for a stall with no name', () => {
    // `nameOf` prints the code when the tab has no venture name, so searching
    // for what is on screen has to find it.
    expect(matchesStall(unnamed, '422')).toBe(true)
    expect(matchesStall(unnamed, 'SLE-C422')).toBe(true)
  })

  it('ignores whitespace and punctuation on both sides', () => {
    expect(matchesStall(dosa, '  dosa  ')).toBe(true)
    expect(matchesStall(dosa, 's.l.e-c401')).toBe(true)
  })

  it('shows everything for an empty query', () => {
    expect(matchesStall(dosa, '')).toBe(true)
    expect(matchesStall(dosa, '   ')).toBe(true)
  })
})

describe('filterStalls', () => {
  it('narrows the list and keeps its order', () => {
    const rows = marketRows()
    expect(filterStalls(rows, '')).toHaveLength(40)
    expect(filterStalls(rows, '4').length).toBe(40)
    const ones = filterStalls(rows, '41')
    expect(ones.map((r) => r.teamId)).toEqual([
      'SLE-C410', 'SLE-C411', 'SLE-C412', 'SLE-C413', 'SLE-C414',
      'SLE-C415', 'SLE-C416', 'SLE-C417', 'SLE-C418', 'SLE-C419',
    ])
  })

  it('returns nothing when nothing matches', () => {
    expect(filterStalls(marketRows(), 'zzzz')).toEqual([])
  })
})
