import { describe, expect, it } from 'vitest'

import { MIN_MARKET_ROWS } from '@/config'
import {
  MarketSchemaError,
  cacheBust,
  parseMarket,
  passesMarketRowGate,
} from '@/lib/marketFeed'
import { MARKET_WINDOW, marketCsv, marketRow, marketRows } from '@/test/fixtures'

describe('parseMarket', () => {
  it('reads a whole tab', () => {
    const snapshot = parseMarket(marketCsv(marketRows([{ teamId: 'SLE-C415', takings: 9110, txns: 16 }])))
    expect(snapshot.rows).toHaveLength(40)
    expect(snapshot.rows.find((row) => row.teamId === 'SLE-C415')).toMatchObject({
      takings: 9110,
      txns: 16,
      ventureName: 'Stall 15',
    })
  })

  it('survives the BOM and CRLF endings Google publishes', () => {
    // `﻿team_id` is not `team_id`, and a stray CR rides the last field of
    // every row. Both would break this on the very first fetch from deploy.
    const csv = `﻿${marketCsv(marketRows()).replace(/\n/g, '\r\n')}`
    const snapshot = parseMarket(csv)
    expect(snapshot.rows).toHaveLength(40)
    expect(snapshot.rows[0]?.teamId).toBe('SLE-C401')
    expect(snapshot.asOf).toBe('13 Sep 18:45')
  })

  it('tolerates hand-typed header case and spacing', () => {
    const csv = marketCsv(marketRows()).replace(
      'team_id,venture_name',
      ' Team_ID , Venture_Name',
    )
    expect(parseMarket(csv).rows).toHaveLength(40)
  })

  it('reads a formatted rupee figure', () => {
    const csv = marketCsv(marketRows()).replace(',0,0,', ',"₹9,110",16,')
    expect(parseMarket(csv).rows[0]).toMatchObject({ takings: 9110, txns: 16 })
  })

  it('treats a blank figure as zero, because a stall that has not sold is normal', () => {
    // Built by hand rather than by replacing into a fixture: the expected value
    // is the fixture's own default, so a replacement that silently missed would
    // let this pass while testing nothing.
    const csv = [
      'team_id,venture_name,flea_revenue,flea_txns,window_start_iso,window_end_iso,as_of',
      `SLE-C401,Dosa Crisps,,,${MARKET_WINDOW.start},${MARKET_WINDOW.end},13 Sep 18:45`,
    ].join('\n')
    expect(parseMarket(csv).rows[0]).toMatchObject({ takings: 0, txns: 0 })
  })

  it('drops an unreadable row rather than throwing on it', () => {
    // `#REF!` is what a formula tab exports mid-recalculation. One bad cell must
    // not discard a fetch that is 39 rows good — that judgement belongs to the
    // row gate, which cannot judge what never reaches it.
    const csv = marketCsv(marketRows()).replace('SLE-C401,Stall 1,0,0', 'SLE-C401,Stall 1,#REF!,0')
    const snapshot = parseMarket(csv)
    expect(snapshot.rows).toHaveLength(39)
    expect(snapshot.rows.some((row) => row.teamId === 'SLE-C401')).toBe(false)
  })

  it('throws when a required column is missing', () => {
    const csv = marketCsv(marketRows()).replace('flea_revenue', 'takings')
    expect(() => parseMarket(csv)).toThrow(MarketSchemaError)
  })

  it('does not throw when the optional last_sale_at column is absent', () => {
    // Nothing in v1 reads it, so a tab published without it must still produce
    // a board — the same reasoning that keeps challenge_revenue out of FEED_HEADERS.
    const snapshot = parseMarket(marketCsv(marketRows(), { lastSaleColumn: false }))
    expect(snapshot.rows).toHaveLength(40)
    expect(snapshot.rows[0]?.lastSaleAt).toBeNull()
  })

  it('reads a last_sale_at that carries an offset', () => {
    const csv = [
      'team_id,venture_name,flea_revenue,flea_txns,last_sale_at,window_start_iso,window_end_iso,as_of',
      `SLE-C401,Dosa Crisps,600,1,2026-09-13T18:40:00+05:30,${MARKET_WINDOW.start},${MARKET_WINDOW.end},13 Sep 18:45`,
    ].join('\n')
    expect(parseMarket(csv).rows[0]?.lastSaleAt?.toISOString()).toBe('2026-09-13T13:10:00.000Z')
  })

  it('refuses a last_sale_at with no offset', () => {
    // Without the offset the browser parses it in its OWN timezone, so a
    // stallholder's phone set to anything but IST reads a different instant and
    // looks completely healthy doing it. The positive case above is what stops
    // this passing vacuously.
    const csv = [
      'team_id,venture_name,flea_revenue,flea_txns,last_sale_at,window_start_iso,window_end_iso,as_of',
      `SLE-C401,Dosa Crisps,600,1,2026-09-13T18:40:00,${MARKET_WINDOW.start},${MARKET_WINDOW.end},13 Sep 18:45`,
    ].join('\n')
    expect(parseMarket(csv).rows[0]?.lastSaleAt).toBeNull()
  })
})

describe('parseMarket window', () => {
  it('reads the window the sheet published on every row', () => {
    const snapshot = parseMarket(marketCsv(marketRows()))
    expect(snapshot.opensAt).toBe(Date.parse(MARKET_WINDOW.start))
    expect(snapshot.closesAt).toBe(Date.parse(MARKET_WINDOW.end))
  })

  it('says nothing when the rows disagree about the window', () => {
    // One cell published forty times, so all forty should agree. Reading "the
    // first row" would make the countdown depend on CSV row order, and a sheet
    // caught mid-edit would produce one that is confidently wrong.
    const csv = marketCsv(marketRows()).replace(
      `${MARKET_WINDOW.end},13 Sep 18:45\nSLE-C402`,
      `2026-09-13T18:00:00+05:30,13 Sep 18:45\nSLE-C402`,
    )
    expect(parseMarket(csv).closesAt).toBeNull()
  })

  it('says nothing when the window carries no offset', () => {
    const csv = marketCsv(marketRows(), { start: '2026-09-13T09:00:00' })
    expect(parseMarket(csv).opensAt).toBeNull()
  })

  it('says nothing when the window is blank', () => {
    const csv = marketCsv(marketRows(), { start: '', end: '' })
    expect(parseMarket(csv).opensAt).toBeNull()
    expect(parseMarket(csv).closesAt).toBeNull()
  })
})

describe('passesMarketRowGate', () => {
  it('accepts a whole tab', () => {
    expect(passesMarketRowGate(marketRows())).toBe(true)
  })

  it('rejects a short export', () => {
    // Three empty exports and two multi-minute hangs in a 25-minute sample of
    // the live published CSV. Acting on one would empty the board in front of
    // the whole market, with no error anywhere.
    expect(passesMarketRowGate(marketRows().slice(0, MIN_MARKET_ROWS - 1))).toBe(false)
    expect(passesMarketRowGate([])).toBe(false)
  })

  it('accepts a longer tab, so a 41st stall does not freeze the board', () => {
    expect(passesMarketRowGate([...marketRows(), marketRow({ teamId: 'SLE-C441' })])).toBe(true)
  })
})

describe('cacheBust', () => {
  it('appends to a URL that already has a query string', () => {
    expect(cacheBust('https://docs.google.com/x/pub?gid=1&output=csv', 42)).toBe(
      'https://docs.google.com/x/pub?gid=1&output=csv&_=42',
    )
  })

  it('opens a query string on a URL that has none', () => {
    // A bare `&_=` turns /mock/market.csv into /mock/market.csv&_=42, which
    // 404s — breaking only the local fixture path, so it presents as a broken
    // fixture rather than a broken fetch.
    expect(cacheBust('/mock/market.csv', 42)).toBe('/mock/market.csv?_=42')
  })
})
