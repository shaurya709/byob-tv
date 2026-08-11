import { describe, expect, it } from 'vitest'

import { SPEED_FACTOR, timelineFor } from '@/lib/kickTimeline'

/**
 * The bug this file exists to prevent: a `times` array that does not describe the
 * beat it is attached to. It renders convincingly — the animation still runs, it
 * just runs at the wrong moment — and no screenshot settles it.
 *
 * Every expected number below is a base duration × SPEED_FACTOR, written out,
 * so a factor that silently stops being applied fails here by value rather
 * than by re-deriving the same arithmetic the implementation uses.
 */

const close = (beat: readonly [number, number], expected: [number, number]) => {
  expect(beat[0]).toBeCloseTo(expected[0], 10)
  expect(beat[1]).toBeCloseTo(expected[1], 10)
}

describe('timelineFor', () => {
  it('applies the speed factor of 1.15 uniformly — the tempo is one number', () => {
    expect(SPEED_FACTOR).toBe(1.15)
  })

  it('scales the climb with the size of the climb: 460ms floor, +69ms per extra rank', () => {
    close(timelineFor(1).beats.climb, [0.69, 1.15])
    close(timelineFor(3).beats.climb, [0.69, 1.288])
    close(timelineFor(8).beats.climb, [0.69, 1.633])
  })

  it('never changes the collapse or uncollapse durations, whatever the climb', () => {
    for (const delta of [1, 3, 8, 19]) {
      const { beats } = timelineFor(delta)
      close(beats.collapse, [0, 0.69])
      expect(beats.uncollapse[1] - beats.uncollapse[0]).toBeCloseTo(0.805, 10)
    }
  })

  /**
   * The strike-and-fall phases: windup 115ms, strike 115ms, knock 180ms, swap
   * 322ms — 732ms between the climb's end and the uncollapse, whatever the
   * climb size. The knock is the one eye-tuned duration, stated in rendered
   * milliseconds: at 138ms it read as a snap rather than a bounce-off. There
   * is no faceoff phase: the climb itself is the diagonal that arrives
   * squared off.
   */
  it('holds the four strike-and-fall phases between B and E, back to back', () => {
    for (const delta of [1, 3, 8]) {
      const { beats } = timelineFor(delta)
      const end = beats.climb[1]
      close(beats.windup, [end, end + 0.115])
      close(beats.strike, [end + 0.115, end + 0.23])
      close(beats.knock, [end + 0.23, end + 0.41])
      close(beats.swap, [end + 0.41, end + 0.732])
      expect(beats.uncollapse[0]).toBeCloseTo(end + 0.732, 10)
    }
  })

  /** The contact frame: the strike's end and the knock's start are one instant. */
  it('makes cause and effect share the contact instant', () => {
    const { beats } = timelineFor(3)
    expect(beats.knock[0]).toBe(beats.strike[1])
  })

  it('computes the totals: Δ=1 → 2.687s, Δ=3 → 2.825s, Δ=8 → 3.17s', () => {
    expect(timelineFor(1).total).toBeCloseTo(2.687, 10)
    expect(timelineFor(3).total).toBeCloseTo(2.825, 10)
    expect(timelineFor(8).total).toBeCloseTo(3.17, 10)
  })
})

describe('at', () => {
  const tl = timelineFor(3)
  const t = (seconds: number) => seconds / tl.total

  it('brackets a beat with its own start and end', () => {
    const [start, end] = tl.at(tl.beats.collapse)
    expect(start).toBeCloseTo(t(0), 10)
    expect(end).toBeCloseTo(t(0.69), 10)
  })

  it('places stops as fractions of the beat, not of the timeline', () => {
    const [start, end] = tl.beats.knock
    const [first, middle, last] = tl.at(tl.beats.knock, 0.5)
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

  /** Only beats that exist are in the table, in choreography order. */
  it('carries exactly the built beats — and no faceoff, which merged into the climb', () => {
    expect(Object.keys(timelineFor(1).beats)).toEqual([
      'collapse',
      'climb',
      'windup',
      'strike',
      'knock',
      'swap',
      'uncollapse',
    ])
  })
})
