'use client'

import { useEffect, useReducer } from 'react'

import { IDLE, delayFor, playOrder, playerReducer } from '@/lib/player'
import { takePending } from '@/lib/storage'
import type { PendingKind } from '@/lib/types'
import type { PlayerMode } from '@/lib/player'

/**
 * Drives the playback machine and owns its single timer.
 *
 * The invariant, restated because it is the whole point:
 *
 * > **`mode` is the only thing that says what is on screen. The queue is a
 * > mailbox and is never rendered. Nothing outside this hook calls
 * > `takePending`.**
 *
 * `/countdown` passes `['hero', 'card']`; `/podium` passes `['overtake']`. The
 * two pages therefore never compete for the same event, even if both are open.
 */
export function usePlayer(kinds: readonly PendingKind[], queueVersion: number): PlayerMode {
  const [mode, dispatch] = useReducer(playerReducer, IDLE)

  /**
   * Drain on idle. No polling: the only two things that can make a drain
   * possible are becoming idle and the queue changing, and both are in the deps.
   *
   * Taking is *consuming*. If the slideshow rotates away one second into an
   * eight-second hero, that event is gone. Dequeuing on animation-end instead
   * would livelock — give this page less time than one hero and the same hero
   * replays on every rotation forever while everything behind it starves.
   */
  useEffect(() => {
    if (mode.name !== 'idle') return
    const events = takePending(kinds)
    if (events.length > 0) dispatch({ type: 'loaded', events: playOrder(events) })
    // `kinds` is a literal at every call site, so it is stable in practice;
    // joining it keeps the dep a primitive rather than a new array identity.
  }, [mode, queueVersion, kinds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Exactly one timer is alive at any moment, by construction. */
  useEffect(() => {
    const delay = delayFor(mode)
    if (delay === null) return
    const timer = setTimeout(
      () => dispatch({ type: mode.name === 'playing' ? 'held' : 'gapped' }),
      delay,
    )
    return () => clearTimeout(timer)
  }, [mode])

  return mode
}
