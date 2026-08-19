import { describe, expect, it } from 'vitest'

import { baselineLabel, challengeDay } from '@/lib/challenge'

const start = new Date('2026-08-18T00:00:00+05:30')
const end = new Date('2026-08-31T23:59:59+05:30')

describe('challengeDay', () => {
  it('counts a fourteen-day challenge from day one', () => {
    expect(challengeDay(start, end, Date.parse('2026-08-18T09:00:00+05:30'))).toEqual({
      day: 1,
      total: 14,
    })
    expect(challengeDay(start, end, Date.parse('2026-08-19T12:41:00+05:30'))).toEqual({
      day: 2,
      total: 14,
    })
    expect(challengeDay(start, end, Date.parse('2026-08-31T23:00:00+05:30'))).toEqual({
      day: 14,
      total: 14,
    })
  })

  /**
   * ── The reason this module has no timezone arithmetic ──
   *
   * `challenge_start_iso` carries `+05:30`, so the instant it names *is* IST
   * midnight, and differencing two absolute instants rolls the day there
   * automatically. The last two assertions are the same two instants named from
   * UTC rather than IST: a laptop set to London must produce the same day
   * number as one set to Kolkata, or the wall is wrong on any machine but one.
   */
  it('rolls the day at IST midnight, whatever the machine is set to', () => {
    expect(challengeDay(start, end, Date.parse('2026-08-19T23:59:00+05:30'))?.day).toBe(2)
    expect(challengeDay(start, end, Date.parse('2026-08-20T00:01:00+05:30'))?.day).toBe(3)
    expect(challengeDay(start, end, Date.parse('2026-08-19T18:29:00Z'))?.day).toBe(2)
    expect(challengeDay(start, end, Date.parse('2026-08-19T18:31:00Z'))?.day).toBe(3)
  })

  /**
   * Four cases that all render as nothing and all mean the same thing: no claim
   * to make. A wall between challenges says nothing rather than counting a day
   * that does not exist — the convention the Flea countdown already follows once
   * its event is over.
   */
  it('is null before it opens, after it closes, and when the sheet is silent', () => {
    expect(challengeDay(start, end, Date.parse('2026-08-17T23:00:00+05:30'))).toBeNull()
    expect(challengeDay(start, end, Date.parse('2026-09-01T00:30:00+05:30'))).toBeNull()
    expect(challengeDay(null, end, Date.now())).toBeNull()
    expect(challengeDay(start, null, Date.now())).toBeNull()
  })

  /** Challenge 2, which the sheet rolls to on 1 September. Same arithmetic. */
  it('counts the next challenge without a code change', () => {
    const nextStart = new Date('2026-09-01T00:00:00+05:30')
    const nextEnd = new Date('2026-09-14T23:59:59+05:30')
    expect(challengeDay(nextStart, nextEnd, Date.parse('2026-09-01T08:00:00+05:30'))).toEqual({
      day: 1,
      total: 14,
    })
  })
})

describe('baselineLabel', () => {
  /**
   * The day *before* the window opens, deliberately. The figure on the cards is
   * the all-time total minus a snapshot taken at the close of the previous day,
   * so "since 17 Aug" is what it measures — and derived rather than typed, so
   * 1 September reads "since 31 Aug" with no deploy.
   */
  it('names the day the baseline was photographed, not the day trading opened', () => {
    expect(baselineLabel(start)).toBe('17 Aug')
    expect(baselineLabel(new Date('2026-09-01T00:00:00+05:30'))).toBe('31 Aug')
  })

  it('is null when the sheet has not said', () => {
    expect(baselineLabel(null)).toBeNull()
  })
})
