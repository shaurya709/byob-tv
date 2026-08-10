import { describe, expect, it } from 'vitest'

import { CARD_HOLD_MS, GAP_AFTER_HERO_MS, HERO_HOLD_MS, OVERTAKE_HOLD_MS } from '@/config'
import { IDLE, delayFor, playOrder, playerReducer } from '@/lib/player'
import type { CardEvent, HeroEvent, OvertakeEvent, WallEvent } from '@/lib/types'

function hero(id: string): HeroEvent {
  return { id, kind: 'hero', teamId: 'SLE-C401', ventureName: 'Aurora', type: 'streak', days: 14 }
}

function card(id: string): CardEvent {
  return { id, kind: 'card', teamId: 'SLE-C401', ventureName: 'Aurora', type: 'streak', days: 7 }
}

function overtake(id: string): OvertakeEvent {
  return {
    id,
    kind: 'overtake',
    teamId: 'SLE-C401',
    ventureName: 'Aurora',
    fromTeamId: 'SLE-C402',
    fromVentureName: 'Beacon',
  }
}

/** Drives the machine to completion, recording what appeared on screen in order. */
function playThrough(events: WallEvent[]): string[] {
  let mode = playerReducer(IDLE, { type: 'loaded', events })
  const shown: string[] = []
  for (let step = 0; step < 100 && mode.name !== 'idle'; step += 1) {
    if (mode.name === 'playing') {
      shown.push(mode.event.id)
      mode = playerReducer(mode, { type: 'held' })
    } else {
      mode = playerReducer(mode, { type: 'gapped' })
    }
  }
  expect(mode).toEqual(IDLE)
  return shown
}

describe('playerReducer', () => {
  it('starts idle and stays idle when loaded with nothing', () => {
    expect(playerReducer(IDLE, { type: 'loaded', events: [] })).toEqual(IDLE)
  })

  it('plays a single event and returns to idle', () => {
    expect(playThrough([hero('h1')])).toEqual(['h1'])
  })

  it('plays a queue in order, one at a time', () => {
    expect(playThrough([hero('h1'), card('c1'), card('c2')])).toEqual(['h1', 'c1', 'c2'])
  })

  /**
   * Loading is gated on idle by `usePlayer`, but the reducer stays total rather
   * than trusting its caller — a second load mid-animation must not truncate
   * what is on screen.
   */
  it('ignores a load while something is playing', () => {
    const playing = playerReducer(IDLE, { type: 'loaded', events: [hero('h1')] })
    expect(playerReducer(playing, { type: 'loaded', events: [card('c1')] })).toEqual(playing)
  })

  it('ignores a stale timer firing in the wrong mode', () => {
    expect(playerReducer(IDLE, { type: 'held' })).toEqual(IDLE)
    expect(playerReducer(IDLE, { type: 'gapped' })).toEqual(IDLE)
  })

  it('passes through a gap between consecutive events', () => {
    const playing = playerReducer(IDLE, { type: 'loaded', events: [hero('h1'), card('c1')] })
    const gap = playerReducer(playing, { type: 'held' })
    expect(gap.name).toBe('gap')
    expect(playerReducer(gap, { type: 'gapped' })).toMatchObject({ name: 'playing' })
  })
})

describe('playOrder', () => {
  /**
   * A queue only gets deep when the page has been off screen a while. The
   * milestone that earns the frame should land before the ambient news.
   */
  it('puts heroes first, keeping arrival order within each group', () => {
    const ordered = playOrder([card('c1'), hero('h1'), card('c2'), hero('h2')])
    expect(ordered.map((event) => event.id)).toEqual(['h1', 'h2', 'c1', 'c2'])
  })

  it('leaves a single-kind queue untouched', () => {
    expect(playOrder([card('c1'), card('c2')]).map((event) => event.id)).toEqual(['c1', 'c2'])
  })
})

describe('delayFor', () => {
  it('is null when idle, so no timer is armed', () => {
    expect(delayFor(IDLE)).toBeNull()
  })

  it("uses each kind's own hold", () => {
    const playingHero = playerReducer(IDLE, { type: 'loaded', events: [hero('h1')] })
    expect(delayFor(playingHero)).toBe(HERO_HOLD_MS)

    const playingCard = playerReducer(IDLE, { type: 'loaded', events: [card('c1')] })
    expect(delayFor(playingCard)).toBe(CARD_HOLD_MS)

    const playingOvertake = playerReducer(IDLE, { type: 'loaded', events: [overtake('o1')] })
    expect(delayFor(playingOvertake)).toBe(OVERTAKE_HOLD_MS)
  })

  it('uses the gap that follows the event that just played', () => {
    const playing = playerReducer(IDLE, { type: 'loaded', events: [hero('h1'), card('c1')] })
    const gap = playerReducer(playing, { type: 'held' })
    expect(delayFor(gap)).toBe(GAP_AFTER_HERO_MS)
  })
})
