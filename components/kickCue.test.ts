import { describe, expect, it } from 'vitest'

import { attackerRide, bootMotion, defenderRide, rideMotion, LOGO } from '@/components/VenturePill'
import { cueOf } from '@/components/WeeklyLeaderboard'
import { FACEOFF_GAP_PX, KNOCK_DIP_PX, KNOCK_PX, timelineFor } from '@/lib/kickTimeline'
import type { OvertakeEvent } from '@/lib/types'

/**
 * The choreography as data: who a kick cues, by how much, and on what clock —
 * before a browser ever runs it. The bugs these exist to catch render
 * convincingly: a diagonal that lost its horizontal half still animates
 * smoothly, it just stacks the attacker under the defender instead of squaring
 * them off, and a stagger on the between-rows still looks like motion. All
 * wrong by numbers only a test or a ruler can see.
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

  it('sends the attacker the full Δ rows up, to the defender’s own y', () => {
    const cue = cueOf(event, timeline, 'SLE-C408', 8)
    expect(cue).toMatchObject({ role: 'attacker', rows: -3 })
  })

  it('holds the defender still through the climb', () => {
    const cue = cueOf(event, timeline, 'SLE-C405', 5)
    expect(cue).toMatchObject({ role: 'defender', rows: 0 })
  })

  /** The diagonal's horizontal half: out of the column to the defender's left. */
  it('gives the attacker the boot and the faceoff reach', () => {
    const cue = cueOf(event, timeline, 'SLE-C408', 8)
    expect(cue).toMatchObject({
      boot: true,
      faceoffXPx: -(LOGO + FACEOFF_GAP_PX),
    })
  })

  it('gives the defender the knock and the fall, and no boot', () => {
    const cue = cueOf(event, timeline, 'SLE-C405', 5)
    expect(cue).toMatchObject({
      knock: { xPx: KNOCK_PX, yRows: 0 },
      fall: { xPx: 0, yRows: 1 },
    })
    expect(cue?.boot).toBeUndefined()
  })

  it('gives the between-rows neither boot nor offsets', () => {
    const cue = cueOf(event, timeline, 'SLE-C406', 6)
    expect(cue?.boot).toBeUndefined()
    expect(cue?.faceoffXPx).toBeUndefined()
    expect(cue?.knock).toBeUndefined()
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

  /** Δ=1: one row of diagonal, straight from the resting slot. Nothing between. */
  it('rides one full row even on a one-rank climb — the diagonal has no zero case', () => {
    const adjacent = kick(6, 5)
    const tl = timelineFor(1)
    expect(cueOf(adjacent, tl, 'SLE-C408', 6)?.rows).toBe(-1)
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
   * One system, no stagger: the between-rows share one window, one easing, one
   * clock. A per-row delay would read as a ripple.
   */
  it('gives the between-rows identical, delay-free transitions', () => {
    const a = rideMotion(1, REST, timeline)
    const b = rideMotion(1, REST, timeline)
    expect(a.transition).toEqual(b.transition)
    expect(a.transition).not.toHaveProperty('delay')
  })
})

describe('attackerRide — one diagonal, then the swap', () => {
  const timeline = timelineFor(3)
  const event = kick(8, 5)
  const cue = cueOf(event, timeline, 'SLE-C408', 8)!
  const ride = attackerRide(cue, REST, timeline)
  const t = (s: number) => s / timeline.total

  /**
   * The climb is the faceoff: x and y ride the same window with the same
   * curve, so there is never a frame with the attacker stacked under the
   * defender at x 0. A vertical-only climb is exactly the bug this catches.
   */
  it('moves x and y together on the climb window — no vertical-only segment', () => {
    expect(ride.animate.x).toEqual([0, 0, -42, -42, 0, 0])
    expect(ride.animate.y).toEqual([0, 0, -132, -132])
    // Same window boundaries for both axes…
    expect(ride.transition.x.times[1]).toBeCloseTo(t(timeline.beats.climb[0]), 10)
    expect(ride.transition.x.times[2]).toBeCloseTo(t(timeline.beats.climb[1]), 10)
    expect(ride.transition.y.times[1]).toBeCloseTo(t(timeline.beats.climb[0]), 10)
    expect(ride.transition.y.times[2]).toBeCloseTo(t(timeline.beats.climb[1]), 10)
    // …and the same curve on the moving segment, so the path is one line.
    expect(ride.transition.x.ease[1]).toBe(ride.transition.y.ease[1])
  })

  it('reaches the full Δ rows: the diagonal ends at the defender’s own y', () => {
    // −3 rows × 44px, held flat from the climb's end to the settle.
    expect(ride.animate.y[2]).toBe(-132)
    expect(ride.animate.y[3]).toBe(-132)
  })

  it('takes the defender’s slot during the swap, ending at exactly x 0', () => {
    const times = ride.transition.x.times
    expect(times[3]).toBeCloseTo(t(timeline.beats.swap[0]), 10)
    expect(times[4]).toBeCloseTo(t(timeline.beats.swap[1]), 10)
    expect(ride.animate.x[ride.animate.x.length - 1]).toBe(0)
  })
})

describe('defenderRide — the knock, the fall', () => {
  const timeline = timelineFor(3)
  const event = kick(8, 5)
  const cue = cueOf(event, timeline, 'SLE-C405', 5)!
  const ride = defenderRide(cue, REST, timeline)
  const t = (s: number) => s / timeline.total

  it('holds still until the contact frame, then is shoved sideways', () => {
    expect(ride.animate.x).toEqual([0, 0, KNOCK_PX, 0, 0])
    expect(ride.transition.x.times[1]).toBeCloseTo(t(timeline.beats.knock[0]), 10)
    expect(ride.transition.x.times[2]).toBeCloseTo(t(timeline.beats.knock[1]), 10)
  })

  it('dips and recovers inside the knock, never leaving the row', () => {
    expect(ride.animate.y.slice(0, 4)).toEqual([0, 0, KNOCK_DIP_PX, 0])
  })

  it('falls exactly one row, landing on its snapshot slot with x back at 0', () => {
    const y = ride.animate.y
    expect(y[y.length - 1]).toBe(REST.height)
    expect(ride.animate.x[ride.animate.x.length - 1]).toBe(0)
    expect(ride.transition.y.times[4]).toBeCloseTo(t(timeline.beats.swap[1]), 10)
  })
})

describe('bootMotion — when the boot exists and how it swings', () => {
  const timeline = timelineFor(3)
  const boot = bootMotion(timeline)
  const t = (s: number) => s / timeline.total

  /**
   * The boot is mounted for the kick but *visible* only from the windup to the
   * swap's end — step keyframes on the one clock, because the cue is pure of
   * time and cannot mount things mid-sequence. A boot visible during the
   * climb is a boot that arrived before its owner squared up.
   */
  it('is invisible until the windup starts, and gone when the follow-through ends', () => {
    const windupStart = t(timeline.beats.windup[0])
    const swapEnd = t(timeline.beats.swap[1])
    expect(boot.animate.opacity).toEqual([0, 0, 1, 1, 0, 0])
    expect(boot.transition.opacity.times).toEqual([0, windupStart, windupStart, swapEnd, swapEnd, 1])
  })

  /**
   * Three rotation phases, not one motion: hold, cock away to −25°, swing
   * through to +45°. A single 0°→+45° sweep has no wind-up — the keyframes are
   * the profile.
   */
  it('cocks to −25° before swinging through to +45°, contact at the strike’s end', () => {
    expect(boot.animate.rotate).toEqual([0, 0, -25, 45, 45])
    expect(boot.transition.rotate.times[2]).toBeCloseTo(t(timeline.beats.windup[1]), 10)
    expect(boot.transition.rotate.times[3]).toBeCloseTo(t(timeline.beats.strike[1]), 10)
  })
})
