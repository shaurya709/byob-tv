import { describe, expect, it } from 'vitest'

import { rideMotion } from '@/components/VenturePill'
import { cueOf } from '@/components/WeeklyLeaderboard'
import { timelineFor } from '@/lib/kickTimeline'
import type { OvertakeEvent } from '@/lib/types'

/**
 * The choreography as data: who a kick cues, by how much, and on what clock —
 * before a browser ever runs it. The bugs these exist to catch render
 * convincingly: an attacker travelling Δ rows instead of Δ−1 still animates
 * smoothly, it just lands *on* the defender instead of below it, and a stagger
 * on the between-rows still looks like motion. Both are wrong by numbers only
 * a test or a ruler can see.
 */

function kick(fromRank: number, toRank: number): OvertakeEvent {
  return {
    id: `4:SLE-C408:${toRank}`,
    attacker: 'SLE-C408',
    attackerName: 'Kadam Kitchen',
    defender: 'SLE-C405',
    defenderName: 'Terra Ceramics',
    fromRank,
    toRank,
  }
}

/** The measured resting geometry the browser would supply; 44 is a plausible row. */
const REST = { width: 653, height: 44, pad: 12, border: 1.5 }

describe('cueOf — who moves', () => {
  const event = kick(8, 5)
  const timeline = timelineFor(3)

  it('sends the attacker up Δ−1 rows, to one row below the defender', () => {
    const cue = cueOf(event, timeline, 'SLE-C408', 8)
    expect(cue).toMatchObject({ role: 'attacker', rows: -2 })
  })

  it('holds the defender still through the climb', () => {
    const cue = cueOf(event, timeline, 'SLE-C405', 5)
    expect(cue).toMatchObject({ role: 'defender', rows: 0 })
  })

  it('slides each row strictly between the contestants down exactly one', () => {
    for (const [teamId, rank] of [
      ['SLE-C406', 6],
      ['SLE-C407', 7],
    ] as const) {
      expect(cueOf(event, timeline, teamId, rank)).toMatchObject({ rows: 1 })
      expect(cueOf(event, timeline, teamId, rank)?.role).toBeUndefined()
    }
  })

  it('cues nobody else — not the row above the defender, not the one below the attacker', () => {
    expect(cueOf(event, timeline, 'SLE-C404', 4)).toBeUndefined()
    expect(cueOf(event, timeline, 'SLE-C409', 9)).toBeUndefined()
    expect(cueOf(event, timeline, 'SLE-C415', 15)).toBeUndefined()
  })

  it('cues nobody at all when nothing is playing', () => {
    expect(cueOf(null, null, 'SLE-C408', 8)).toBeUndefined()
  })

  /** Δ=1: already adjacent. The attacker holds; there is nothing in between. */
  it('moves nothing vertically on a one-rank climb', () => {
    const adjacent = kick(6, 5)
    const tl = timelineFor(1)
    expect(cueOf(adjacent, tl, 'SLE-C408', 6)?.rows).toBe(0)
    expect(cueOf(adjacent, tl, 'SLE-C407', 7)).toBeUndefined()
  })
})

describe('rideMotion — how they move', () => {
  const timeline = timelineFor(3)

  it('travels rows × measured row height, ending exactly there', () => {
    const { animate } = rideMotion(-2, REST, timeline)
    expect(animate.y).toEqual([0, 0, -88, -88])
  })

  it('confines the travel to the climb window of the shared clock', () => {
    const { transition } = rideMotion(-2, REST, timeline)
    expect(transition.duration).toBe(timeline.total)
    expect(transition.times).toEqual([
      0,
      timeline.beats.climb[0] / timeline.total,
      timeline.beats.climb[1] / timeline.total,
      1,
    ])
  })

  /**
   * One system, no stagger: the attacker and every between-row share one
   * window, one easing, one clock. A per-row delay would read as a ripple.
   */
  it('gives the attacker and the between-rows identical, delay-free transitions', () => {
    const attacker = rideMotion(-2, REST, timeline)
    const between = rideMotion(1, REST, timeline)
    expect(attacker.transition).toEqual(between.transition)
    expect(attacker.transition).not.toHaveProperty('delay')
  })
})
