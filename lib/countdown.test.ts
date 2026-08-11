import { describe, expect, it } from 'vitest'

import { computeCountdownState } from '@/lib/countdown'

/** The real target: Mesa Flea, 6 September 2026, 10:00 IST. */
const FLEA = Date.parse('2026-09-06T10:00:00+05:30')

const at = (iso: string) => computeCountdownState(FLEA, Date.parse(iso))

describe('computeCountdownState', () => {
  it('shows the IST calendar-day count when the Flea is 15 or more days out', () => {
    // 12 Aug, midday IST — 24d 22h remain, said aloud as "25 days away".
    expect(at('2026-08-12T12:00:00+05:30')).toEqual({
      display: '25',
      mode: 'days',
      numeric: 25,
    })
    // Still 25 at three in the morning of the same IST date: the count is
    // calendar days, so it changes at midnight IST, never mid-morning.
    expect(at('2026-08-12T03:22:00+05:30').display).toBe('25')
    expect(at('2026-08-11T23:59:00+05:30').display).toBe('26')
    // Exactly 15 days: still the plain count.
    expect(at('2026-08-22T10:00:00+05:30')).toEqual({
      display: '15',
      mode: 'days',
      numeric: 15,
    })
  })

  it('shows days and hours inside 15 days, floored like a clock', () => {
    expect(at('2026-08-27T10:00:00+05:30')).toEqual({
      display: '10D 0H',
      mode: 'daysHours',
      numeric: 10,
    })
    expect(at('2026-08-31T05:30:00+05:30')).toEqual({
      display: '6D 4H',
      mode: 'daysHours',
      numeric: 6,
    })
    // Exactly 24 hours left is still this mode; the ticking timer starts below it.
    expect(at('2026-09-05T10:00:00+05:30')).toEqual({
      display: '1D 0H',
      mode: 'daysHours',
      numeric: 1,
    })
  })

  it('ticks a live HH:MM:SS timer inside the final 24 hours', () => {
    expect(at('2026-09-05T23:00:00+05:30')).toEqual({
      display: '11:00:00',
      mode: 'timer',
      numeric: 11 * 3600,
    })
    const state = at('2026-09-06T05:47:27+05:30')
    expect(state.display).toBe('04:12:33')
    expect(state.mode).toBe('timer')
    expect(state.numeric).toBe(4 * 3600 + 12 * 60 + 33)
  })

  it('says LIVE NOW from the opening bell to the end of the event', () => {
    expect(at('2026-09-06T10:00:00+05:30').mode).toBe('live')
    const mid = at('2026-09-06T12:00:00+05:30')
    expect(mid).toEqual({ display: 'LIVE NOW', mode: 'live', numeric: null })
    // 17:59 IST — the eighth hour is still running.
    expect(at('2026-09-06T17:59:59+05:30').mode).toBe('live')
  })

  it('hides entirely once the event has ended', () => {
    // 18:00 IST on the day — exactly flea + 8 hours.
    expect(at('2026-09-06T18:00:00+05:30')).toEqual({
      display: '',
      mode: 'hidden',
      numeric: null,
    })
    expect(at('2026-09-07T10:00:00+05:30').mode).toBe('hidden')
  })

  it('defaults `now` to the real clock', () => {
    // Target one hour ahead of whatever now is: must land in timer mode.
    const state = computeCountdownState(Date.now() + 3_600_000 + 500)
    expect(state.mode).toBe('timer')
  })
})
