import {
  CARD_HOLD_MS,
  GAP_AFTER_CARD_MS,
  GAP_AFTER_HERO_MS,
  GAP_AFTER_OVERTAKE_MS,
  HERO_HOLD_MS,
  OVERTAKE_HOLD_MS,
} from '@/config'
import type { WallEvent } from '@/lib/types'

/**
 * The playback state machine, as a pure reducer.
 *
 * The invariant this exists to enforce:
 *
 * > **`mode` is the only thing that says what is on screen. The queue is a
 * > mailbox and is never rendered.**
 *
 * Heroes and sub-cards run through *one* machine on `/countdown`, so they
 * serialise by construction and "a hero beats a card" is expressed as a sort in
 * `playOrder` rather than as a priority system. Two machines would be exactly
 * the two-sources-of-truth problem this design is avoiding — a sub-card is
 * invisible under a full-frame takeover anyway.
 *
 * No React, no timers, no clock. `usePlayer` supplies the single timer.
 */

export type PlayerMode =
  | { name: 'idle' }
  | { name: 'playing'; event: WallEvent; rest: readonly WallEvent[] }
  | { name: 'gap'; after: WallEvent; rest: readonly WallEvent[] }

export type PlayerAction =
  | { type: 'loaded'; events: readonly WallEvent[] }
  /** The current event's hold has elapsed. */
  | { type: 'held' }
  /** The gap after the last event has elapsed. */
  | { type: 'gapped' }

export const IDLE: PlayerMode = { name: 'idle' }

/** How long an event stays on screen. */
export function holdMs(event: WallEvent): number {
  if (event.kind === 'hero') return HERO_HOLD_MS
  if (event.kind === 'overtake') return OVERTAKE_HOLD_MS
  return CARD_HOLD_MS
}

/** The pause after an event, before the next one enters. */
export function gapMs(event: WallEvent): number {
  if (event.kind === 'hero') return GAP_AFTER_HERO_MS
  if (event.kind === 'overtake') return GAP_AFTER_OVERTAKE_MS
  return GAP_AFTER_CARD_MS
}

/**
 * Heroes first, then everything else, each group keeping arrival order.
 *
 * A queue only gets deep when the page has been off screen for a while, and in
 * that case the milestone that earns the frame should land before the ambient
 * news rather than after four sub-cards.
 */
export function playOrder(events: readonly WallEvent[]): WallEvent[] {
  const heroes = events.filter((event) => event.kind === 'hero')
  const rest = events.filter((event) => event.kind !== 'hero')
  return [...heroes, ...rest]
}

export function playerReducer(mode: PlayerMode, action: PlayerAction): PlayerMode {
  switch (action.type) {
    case 'loaded': {
      // Only ever loaded while idle — `usePlayer` gates on it — but the guard
      // keeps the reducer total rather than relying on its caller.
      if (mode.name !== 'idle' || action.events.length === 0) return mode
      const [event, ...rest] = action.events
      return { name: 'playing', event, rest }
    }
    case 'held': {
      if (mode.name !== 'playing') return mode
      return { name: 'gap', after: mode.event, rest: mode.rest }
    }
    case 'gapped': {
      if (mode.name !== 'gap') return mode
      const [event, ...rest] = mode.rest
      return event ? { name: 'playing', event, rest } : IDLE
    }
  }
}

/** The delay the single timer should run for in the current mode, or null when idle. */
export function delayFor(mode: PlayerMode): number | null {
  if (mode.name === 'playing') return holdMs(mode.event)
  if (mode.name === 'gap') return gapMs(mode.after)
  return null
}
