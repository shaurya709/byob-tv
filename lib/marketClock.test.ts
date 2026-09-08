import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { marketClock } from '@/lib/marketClock'

/** The real window: 13 September 2026, 09:00–21:00 IST. */
const OPEN = Date.parse('2026-09-13T09:00:00+05:30')
const CLOSE = Date.parse('2026-09-13T21:00:00+05:30')

const at = (iso: string) => marketClock(OPEN, CLOSE, Date.parse(iso))

describe('marketClock phases', () => {
  it('counts to the opening bell before the market opens', () => {
    expect(at('2026-09-13T08:00:00+05:30')).toMatchObject({
      phase: 'before',
      display: '01:00:00',
      label: 'Opens in',
    })
  })

  it('is open at the opening instant, showing the whole window', () => {
    // Inclusive at the open: the doors are open at 09:00:00 exactly.
    expect(at('2026-09-13T09:00:00+05:30')).toMatchObject({
      phase: 'open',
      display: '12:00:00',
      label: 'Closes in',
    })
  })

  it('counts down through the day', () => {
    expect(at('2026-09-13T18:45:00+05:30').display).toBe('02:15:00')
  })

  it('is still open in the final second', () => {
    expect(at('2026-09-13T20:59:59+05:30')).toMatchObject({ phase: 'open', display: '00:00:01' })
  })

  it('is closed at the closing instant, and says nothing', () => {
    // Exclusive at the close: a board still counting at 21:00:00 would be
    // counting to a moment that has already arrived.
    expect(at('2026-09-13T21:00:00+05:30')).toMatchObject({
      phase: 'closed',
      display: '',
      label: 'Closed',
      remainingMs: 0,
    })
  })

  it('stays closed the following morning', () => {
    expect(at('2026-09-14T09:00:00+05:30').phase).toBe('closed')
  })
})

describe('marketClock display', () => {
  it('zero-pads every field', () => {
    // 09:05:03 remaining — each field needs its own padding.
    const now = CLOSE - (9 * 3600 + 5 * 60 + 3) * 1000
    expect(marketClock(OPEN, CLOSE, now).display).toBe('09:05:03')
  })

  it('floors rather than rounds, so the last second reads zero', () => {
    expect(marketClock(OPEN, CLOSE, CLOSE - 999).display).toBe('00:00:00')
    expect(marketClock(OPEN, CLOSE, CLOSE - 1000).display).toBe('00:00:01')
  })

  it('does not wrap hours at 24', () => {
    // A board loaded well before the day. Ugly and true beats a countdown that
    // silently repeats itself every 24 hours.
    expect(marketClock(OPEN, CLOSE, OPEN - 30 * 3600 * 1000).display).toBe('30:00:00')
  })
})

describe('marketClock refuses a window it cannot describe', () => {
  it('says nothing when the end is at or before the start', () => {
    expect(marketClock(CLOSE, OPEN, OPEN).phase).toBe('closed')
    expect(marketClock(OPEN, OPEN, OPEN).display).toBe('')
  })

  it('says nothing for an unparseable bound', () => {
    expect(marketClock(NaN, CLOSE, OPEN).phase).toBe('closed')
    expect(marketClock(OPEN, NaN, OPEN).phase).toBe('closed')
  })
})

describe('marketClock is pure', () => {
  /**
   * The executable form of "the clock is a parameter". Every boundary above is
   * only testable because this module never reads the machine's clock, and a
   * `Date.now()` default added later would make the same tests pass while the
   * board's behaviour depended on when it was rendered.
   */
  it('reads no clock, no storage, no DOM', () => {
    const source = readFileSync(new URL('./marketClock.ts', import.meta.url), 'utf8')
    const body = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
    expect(body).not.toMatch(/\bDate\b|Math\.random|localStorage|fetch|window|document/)
  })
})
