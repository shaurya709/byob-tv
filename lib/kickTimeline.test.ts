import { describe, expect, it } from 'vitest'

import { BEATS, TOTAL, at, t } from '@/lib/kickTimeline'

/**
 * The bug this file exists to prevent: a `times` array that does not describe the
 * beat it is attached to. It renders convincingly — the animation still runs, it
 * just runs at the wrong moment — and no screenshot settles it.
 */

describe('t', () => {
  it('normalises seconds against the whole timeline', () => {
    expect(t(0)).toBe(0)
    expect(t(TOTAL)).toBe(1)
    expect(t(BEATS.strike[0])).toBeCloseTo(1.06 / 2.85, 10)
  })
})

describe('at', () => {
  it('brackets a beat with its own start and end', () => {
    expect(at(BEATS.collapse)).toEqual([t(0), t(0.24)])
  })

  it('places stops as fractions of the beat, not of the timeline', () => {
    const [start, middle, end] = at(BEATS.punt, 0.5)
    expect(start).toBeCloseTo(t(1.2), 10)
    expect(middle).toBeCloseTo(t(1.2 + (2.25 - 1.2) * 0.5), 10)
    expect(end).toBeCloseTo(t(2.25), 10)
  })

  it('keeps every value inside the timeline and in order', () => {
    for (const beat of Object.values(BEATS)) {
      const times = at(beat, 0.25, 0.5, 0.75)
      expect(Math.min(...times)).toBeGreaterThanOrEqual(0)
      expect(Math.max(...times)).toBeLessThanOrEqual(1)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
    }
  })
})

describe('the sequence', () => {
  it('runs in the order the choreography describes', () => {
    const order = ['collapse', 'travel', 'windUp', 'strike', 'punt', 'uncollapse'] as const
    const starts = order.map((name) => BEATS[name][0])
    expect([...starts].sort((a, b) => a - b)).toEqual(starts)
  })

  /**
   * Every beat has to finish inside the span the queue is told to wait for.
   * `onSettled` fires at `TOTAL`; a beat reaching past it would be cut off, and
   * the next kick would start over its tail.
   */
  it('fits every beat inside the total', () => {
    for (const [name, [start, end]] of Object.entries(BEATS)) {
      expect(end, name).toBeLessThanOrEqual(TOTAL)
      expect(start, name).toBeLessThan(end)
    }
  })

  it('ends on the uncollapse, which is what the queue waits for', () => {
    const last = Math.max(...Object.values(BEATS).map(([, end]) => end))
    expect(last).toBe(TOTAL)
    expect(BEATS.uncollapse[1]).toBe(TOTAL)
  })

  /** The strike is the moment of contact, so the punt cannot begin before it. */
  it('starts the punt no earlier than the strike lands', () => {
    expect(BEATS.punt[0]).toBeGreaterThanOrEqual(BEATS.strike[1])
    expect(BEATS.settle[0]).toBeGreaterThanOrEqual(BEATS.strike[1])
  })
})
