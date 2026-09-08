// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { KEYS, readCsvCache, readMarketCsv, writeCsvCache, writeMarketCsv } from '@/lib/storage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('csv cache', () => {
  it('round-trips raw text so parseSnapshot stays the only path from bytes to data', () => {
    writeCsvCache({ feedCsv: 'team_id\nSLE-C401', cohortCsv: 'key,value\nas_of,now' })
    expect(readCsvCache()).toEqual({ feedCsv: 'team_id\nSLE-C401', cohortCsv: 'key,value\nas_of,now' })
  })

  it('returns null when absent, which is a valid first-paint state', () => {
    expect(readCsvCache()).toBeNull()
  })
})

describe('the market cache is isolated from the wall cache', () => {
  it('uses a key of its own', () => {
    expect(KEYS.market).not.toBe(KEYS.csv)
  })

  it('leaves the wall cache alone when it is written', () => {
    writeCsvCache({ feedCsv: 'feed', cohortCsv: 'cohort' })
    writeMarketCsv('market')
    expect(readCsvCache()).toEqual({ feedCsv: 'feed', cohortCsv: 'cohort' })
    expect(readMarketCsv()).toBe('market')
  })

  /**
   * The isolation claim, asserted rather than assumed. This is the whole reason
   * the market board has its own key: the two wall CSVs share one blob behind
   * one guard, so a corrupt value there takes both boards' first paint with it.
   */
  it('survives a corrupt market value without disturbing the wall cache', () => {
    writeCsvCache({ feedCsv: 'feed', cohortCsv: 'cohort' })
    localStorage.setItem(KEYS.market, '{ not json')
    expect(readMarketCsv()).toBeNull()
    expect(readCsvCache()).toEqual({ feedCsv: 'feed', cohortCsv: 'cohort' })
  })
})
