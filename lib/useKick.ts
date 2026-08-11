'use client'

import { useCallback, useEffect, useState } from 'react'

import { takeKick } from '@/lib/storage'
import type { OvertakeEvent } from '@/lib/types'

/**
 * What is on screen, and when it is over.
 *
 * ── The invariant ──
 *
 * **`playing` is the only thing that says what is animating. The queue is a
 * mailbox and is never rendered.** Nothing outside this hook calls `takeKick`.
 * Two things reading the queue is the two-sources-of-truth bug that makes an
 * animation appear twice or vanish halfway.
 *
 * The queue is drained one at a time and never in parallel. Two kicks at once on
 * a forty-row board is unreadable — the eye cannot follow two arcs, and the
 * second one is invisible whether it plays or not.
 *
 * `queueVersion` is the nudge from the data loop: the queue lives in
 * localStorage, so nothing about writing to it would otherwise re-render this.
 *
 * ── There is no timer here ──
 *
 * A kick ends when its last beat ends, reported by the animation itself. The
 * previous version ran a fixed `setTimeout(KICK_MS)` alongside it, which was a
 * second opinion about the same fact: it happened to be longer than the
 * sequence, so it looked right, but nothing tied the two together and extending
 * a beat past it would have started the next kick over the tail of the current
 * one with nothing to report it.
 */
export type Kick = {
  playing: OvertakeEvent | null
  /** Handed to `BootKick`; the animation calls it when its last beat finishes. */
  settled: () => void
}

export function useKick(board: string, queueVersion: number): Kick {
  const [playing, setPlaying] = useState<OvertakeEvent | null>(null)
  // TEMPORARY instrumentation, paired with the one in BootKick.
  const settled = useCallback(() => {
    console.log('[kick] useKick received settled')
    setPlaying(null)
  }, [])

  // Take the next event, but only while nothing is playing. The dependency on
  // `playing` is what makes this run again the moment the previous one ends.
  //
  // The rule this suppresses guards against cascading renders. Draining is a
  // *destructive* read of an external store — `takeKick` removes what it
  // returns — so it cannot happen during render, and nothing emits an event to
  // react to instead: the queue is written by a different hook into
  // localStorage. `queueVersion` is that missing event, and the drain runs at
  // most once per completed animation, which is once per three seconds.
  useEffect(() => {
    if (playing !== null) return
    const next = takeKick(board)
    if (next !== null) console.log('[kick] useKick drained', next.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (next !== null) setPlaying(next)
  }, [board, playing, queueVersion])

  return { playing, settled }
}
