'use client'

import { useCallback, useEffect, useState } from 'react'

import { clearKicks, takeKick } from '@/lib/storage'
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
  const settled = useCallback(() => setPlaying(null), [])

  /**
   * Anything already in the queue at mount is stale news. Drop it.
   *
   * Only a mounted board detects and enqueues, and a mounted board drains within
   * milliseconds — so a queue that is *not* empty here can only hold what was
   * left behind when this slide last rotated away. Meanwhile the board re-sorted
   * itself: the CSV cache is written on every tick, freeze or no freeze, so the
   * remount paints the new order before this hook ever runs.
   *
   * Playing that leftover against the new order is the failure this project is
   * built to avoid, because it renders perfectly. `cuesFor` picks the cards to
   * animate by **board position** — `kick.fromRank`, `kick.toRank` — so a stale
   * event moves whichever ventures now occupy those slots, and the wall shows a
   * confident, well-timed overtake between two teams that did not overtake
   * anyone. Discarding is also what the queue already does with superseded news
   * everywhere else: latest wins, and an event nobody could see before the slide
   * left is not the latest any more.
   *
   * Declared above the drain below so it runs first — effects fire in
   * declaration order, so the drain finds the queue already empty.
   */
  useEffect(() => {
    clearKicks(board)
  }, [board])

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

  return { playing, settled }
}
