import { describe, expect, it } from 'vitest'

import { isEndOfDay, istHour } from '@/lib/schedule'

/** 17:59 and 18:00 IST, written as the absolute instants they are. */
const BEFORE_SIX = new Date('2026-08-11T17:59:00+05:30')
const AT_SIX = new Date('2026-08-11T18:00:00+05:30')
const LATE = new Date('2026-08-11T23:59:00+05:30')
const AFTER_MIDNIGHT = new Date('2026-08-12T00:01:00+05:30')

describe('istHour', () => {
  /**
   * The whole reason this module exists. A laptop back from a trip and still set
   * to another timezone would otherwise open the celebration in the middle of
   * the afternoon and look completely deliberate doing it.
   */
  it('reads the hour in Asia/Kolkata whatever the machine is set to', () => {
    expect(istHour(AT_SIX)).toBe(18)
    // The same instant, expressed in UTC. Same answer.
    expect(istHour(new Date('2026-08-11T12:30:00Z'))).toBe(18)
  })
})

describe('isEndOfDay', () => {
  it('starts at 18:00 IST and runs to midnight', () => {
    expect(isEndOfDay(BEFORE_SIX)).toBe(false)
    expect(isEndOfDay(AT_SIX)).toBe(true)
    expect(isEndOfDay(LATE)).toBe(true)
    expect(isEndOfDay(AFTER_MIDNIGHT)).toBe(false)
  })
})
