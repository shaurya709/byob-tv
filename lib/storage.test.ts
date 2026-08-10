// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QUEUE_CAP } from '@/config'
import { KEYS, enqueue, readCsvCache, readLedger, takePending, writeCsvCache, writeLedger } from '@/lib/storage'
import type { CardEvent, HeroEvent, Ledger, OvertakeEvent } from '@/lib/types'

const NO_HOLDERS = { rank1: '', biggestSaleToday: '', mostUnitsToday: '', biggestRevenueDay: '' }

function ledger(fired: string[], holders = NO_HOLDERS): Ledger {
  return { fired, holders }
}

function hero(id: string): HeroEvent {
  return { id, kind: 'hero', teamId: 'SLE-C401', ventureName: 'Aurora', type: 'streak', days: 14 }
}

function card(id: string): CardEvent {
  return {
    id,
    kind: 'card',
    teamId: 'SLE-C401',
    ventureName: 'Aurora',
    type: 'title',
    title: 'biggestSaleToday',
    value: 5_000,
  }
}

function overtake(id: string, from: string): OvertakeEvent {
  return {
    id,
    kind: 'overtake',
    teamId: 'SLE-C401',
    ventureName: 'Aurora',
    fromTeamId: from,
    fromVentureName: 'Beacon',
  }
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('readLedger', () => {
  it('returns null when absent', () => {
    expect(readLedger()).toBeNull()
  })

  /**
   * Absent, unparseable and wrong-shaped all route into the same seed branch,
   * with no repair code. The direction of failure is the point: a corrupt
   * ledger read as "empty, but replay everything" would fire hundreds of hero
   * animations in one tick, in public.
   */
  it('returns null on corrupt JSON rather than throwing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(KEYS.ledger, '{not json')
    expect(readLedger()).toBeNull()
  })

  it('returns null on a wrong-shaped value', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(KEYS.ledger, JSON.stringify({ fired: 'nope' }))
    expect(readLedger()).toBeNull()
  })
})

describe('writeLedger', () => {
  it('round-trips', () => {
    writeLedger(ledger(['rev:SLE-C401:25000']))
    expect(readLedger()?.fired).toEqual(['rev:SLE-C401:25000'])
  })

  /**
   * If the slideshow keeps both pages open as tabs, two renderers each run a
   * read-compute-write cycle on this key. Because `fired` only ever grows, the
   * union is the same under any interleaving — which is what makes a lock, a
   * `storage` listener or a BroadcastChannel unnecessary.
   */
  it('unions with what is already stored, so a concurrent tab cannot clobber it', () => {
    writeLedger(ledger(['rev:SLE-C401:25000']))
    writeLedger(ledger(['rev:SLE-C402:50000']))
    expect(readLedger()?.fired).toEqual(['rev:SLE-C401:25000', 'rev:SLE-C402:50000'])
  })

  it('stores fired ids sorted, so the persisted form is stable', () => {
    writeLedger(ledger(['streak:SLE-C409:7', 'rev:SLE-C401:25000']))
    expect(readLedger()?.fired).toEqual(['rev:SLE-C401:25000', 'streak:SLE-C409:7'])
  })
})

describe('enqueue', () => {
  it('appends events with distinct ids', () => {
    enqueue([hero('rev:SLE-C401:100000'), hero('rev:SLE-C402:100000')])
    expect(takePending(['hero'])).toHaveLength(2)
  })

  /**
   * Title and overtake ids are *constant*, so a newer holder replaces the older
   * entry. A card announcing a title its team no longer holds is a lie on
   * screen, and latest-wins is the only truthful policy.
   */
  it('replaces an entry sharing an id instead of queueing both', () => {
    enqueue([card('title:biggestSaleToday')])
    const newer = { ...card('title:biggestSaleToday'), teamId: 'SLE-C412', ventureName: 'Kite' }
    enqueue([newer])

    const taken = takePending(['card'])
    expect(taken).toHaveLength(1)
    expect(taken[0]).toMatchObject({ teamId: 'SLE-C412', ventureName: 'Kite' })
  })

  it('caps each kind at the newest QUEUE_CAP', () => {
    enqueue(Array.from({ length: QUEUE_CAP + 3 }, (_, index) => hero(`rev:SLE-C4${index}:100000`)))
    const taken = takePending(['hero'])
    expect(taken).toHaveLength(QUEUE_CAP)
    // Oldest dropped, newest kept.
    expect(taken.at(-1)?.id).toBe(`rev:SLE-C4${QUEUE_CAP + 2}:100000`)
  })

  it('caps kinds independently', () => {
    enqueue(Array.from({ length: QUEUE_CAP + 2 }, (_, index) => hero(`h${index}`)))
    enqueue([card('title:mostUnitsToday')])
    expect(takePending(['card'])).toHaveLength(1)
    expect(takePending(['hero'])).toHaveLength(QUEUE_CAP)
  })
})

describe('takePending', () => {
  /**
   * Only /countdown takes hero and card; only /podium takes overtake. Two tabs
   * therefore never compete for the same event.
   */
  it('takes only the requested kinds and leaves the rest queued', () => {
    enqueue([hero('h1'), card('c1'), overtake('overtake:rank1', 'SLE-C402')])

    expect(takePending(['hero', 'card']).map((event) => event.id)).toEqual(['h1', 'c1'])
    expect(takePending(['overtake']).map((event) => event.id)).toEqual(['overtake:rank1'])
  })

  it('is destructive — taken means consumed, not "about to play"', () => {
    enqueue([hero('h1')])
    expect(takePending(['hero'])).toHaveLength(1)
    expect(takePending(['hero'])).toHaveLength(0)
  })

  it('returns an empty array when nothing is queued', () => {
    expect(takePending(['hero'])).toEqual([])
  })
})

describe('csv cache', () => {
  it('round-trips raw text so parseSnapshot stays the only path from bytes to data', () => {
    writeCsvCache({ feedCsv: 'team_id\nSLE-C401', cohortCsv: 'key,value\nas_of,now' })
    expect(readCsvCache()).toEqual({ feedCsv: 'team_id\nSLE-C401', cohortCsv: 'key,value\nas_of,now' })
  })

  it('returns null when absent, which is a valid first-paint state', () => {
    expect(readCsvCache()).toBeNull()
  })
})
