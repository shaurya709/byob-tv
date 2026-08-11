import { describe, expect, it } from 'vitest'

import { timelineFor } from '@/lib/kickTimeline'

/**
 * The bug this file exists to prevent: a `times` array that does not describe the
 * beat it is attached to. It renders convincingly — the animation still runs, it
 * just runs at the wrong moment — and no screenshot settles it.
 */

describe('timelineFor', () => {
  it('scales the climb with the size of the climb: 400ms floor, +60ms per extra rank', () => {
    expect(timelineFor(1).beats.climb).toEqual([0.6, 1.0])
    expect(timelineFor(3).beats.climb).toEqual([0.6, 1.12])
    expect(timelineFor(8).beats.climb).toEqual([0.6, 1.42])
  })

  /** A and E are fixed by the shipped beats; only their positions may move. */
  it('never changes the collapse or uncollapse durations, whatever the climb', () => {
    for (const delta of [1, 3, 8, 19]) {
      const { beats } = timelineFor(delta)
      expect(beats.collapse).toEqual([0, 0.6])
      expect(beats.uncollapse[1] - beats.uncollapse[0]).toBeCloseTo(0.7, 10)
    }
  })

  /** The C+D reserve sits between the climb's end and the uncollapse's start. */
  it('holds the strike reserve between B and E', () => {
    for (const delta of [1, 3, 8]) {
      const { beats } = timelineFor(delta)
      expect(beats.uncollapse[0] - beats.climb[1]).toBeCloseTo(0.55, 10)
    }
  })

  it('computes the totals the brief states: Δ=1 → 2.25s, Δ=3 → 2.37s, Δ=8 → 2.67s', () => {
    expect(timelineFor(1).total).toBeCloseTo(2.25, 10)
    expect(timelineFor(3).total).toBeCloseTo(2.37, 10)
    expect(timelineFor(8).total).toBeCloseTo(2.67, 10)
  })
})

describe('at', () => {
  const tl = timelineFor(3)
  const t = (seconds: number) => seconds / tl.total

  it('brackets a beat with its own start and end', () => {
    expect(tl.at(tl.beats.collapse)).toEqual([t(0), t(0.6)])
  })

  it('places stops as fractions of the beat, not of the timeline', () => {
    const [start, end] = tl.beats.uncollapse
    const [first, middle, last] = tl.at(tl.beats.uncollapse, 0.5)
    expect(first).toBeCloseTo(t(start), 10)
    expect(middle).toBeCloseTo(t(start + (end - start) * 0.5), 10)
    expect(last).toBeCloseTo(t(end), 10)
  })

  it('keeps every value inside the timeline and in order', () => {
    for (const beat of Object.values(tl.beats)) {
      const times = tl.at(beat, 0.25, 0.5, 0.75)
      expect(Math.min(...times)).toBeGreaterThanOrEqual(0)
      expect(Math.max(...times)).toBeLessThanOrEqual(1)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
    }
  })
})

describe('the sequence', () => {
  it('runs in the order the choreography describes, for every climb size', () => {
    for (const delta of [1, 3, 8, 19]) {
      const starts = Object.values(timelineFor(delta).beats).map(([start]) => start)
      expect([...starts].sort((a, b) => a - b)).toEqual(starts)
    }
  })

  /**
   * Every beat has to finish inside the span the queue is told to wait for.
   * `onSettled` fires when the attacker's animation completes at `total`; a beat
   * reaching past it would be cut off, and the next kick would start over its
   * tail. A total reaching past the last beat would fire the guard late and
   * freeze the board for the difference.
   */
  it('ends exactly on the uncollapse, which is what the queue waits for', () => {
    for (const delta of [1, 3, 8]) {
      const { total, beats } = timelineFor(delta)
      for (const [name, [start, end]] of Object.entries(beats)) {
        expect(end, name).toBeLessThanOrEqual(total)
        expect(start, name).toBeLessThan(end)
      }
      expect(beats.uncollapse[1]).toBe(total)
    }
  })

  /**
   * Only beats that exist are in the table. The C+D reserve is a gap between
   * windows, not a window — a beat with no animation attached is a number that
   * looks load bearing and is not.
   */
  it('carries no window for a beat that has not been built', () => {
    expect(Object.keys(timelineFor(1).beats)).toEqual(['collapse', 'climb', 'uncollapse'])
  })
})
