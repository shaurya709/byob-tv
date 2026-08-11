'use client'

import { useEffect, useState } from 'react'

import { KICK_MS } from '@/config'
import { takeKick } from '@/lib/storage'
import type { OvertakeEvent } from '@/lib/types'

/**
 * What is on screen, and exactly one timer.
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
 */
export function useKick(board: string, queueVersion: number): OvertakeEvent | null {
  const [playing, setPlaying] = useState<OvertakeEvent | null>(null)

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (next !== null) setPlaying(next)
  }, [board, playing, queueVersion])

  // One timer, existing only while something is playing. The animation's own
  // beats are declarative delays inside the component; this only decides when
  // the wall goes back to being a leaderboard.
  useEffect(() => {
    if (playing === null) return
    const timer = setTimeout(() => setPlaying(null), KICK_MS)
    return () => clearTimeout(timer)
  }, [playing])

  return playing
}
