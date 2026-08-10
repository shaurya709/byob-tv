'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { POLL_INTERVAL_MS } from '@/config'
import { fetchCsv, parseSnapshot, passesRowGate } from '@/lib/feed'
import { enqueue, readCsvCache, readLedger, writeCsvCache, writeLedger } from '@/lib/storage'
import { reconcile } from '@/lib/triggers'
import type { Snapshot } from '@/lib/types'

/**
 * The 60-second loop. The only module in the project that touches `fetch`,
 * `setInterval` or the visibility API.
 *
 * ── Only a visible page fetches or reconciles ──
 *
 * The slideshow is driven from a laptop over HDMI, which most likely means a
 * tab rotator — so both pages may be *open at once* with only one on screen.
 * Without this gate, two renderers would each run a read-compute-write cycle
 * every 60 seconds against the same localStorage: double-fired triggers and
 * clobbered writes.
 *
 * Gating on `visibilityState` also covers the other possibility — that the
 * rotation reloads each URL from scratch — with the same mechanism rather than
 * a second one. Whichever the rotation turns out to be, the page that is on
 * screen owns the state.
 */
export type WallData = {
  snapshot: Snapshot | null
  /** Bumped whenever new events were queued, so the player knows to look. */
  queueVersion: number
}

export function useWallData(): WallData {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [queueVersion, setQueueVersion] = useState(0)
  const running = useRef(false)

  /**
   * First paint reads the cached CSV, before the browser paints. This is why
   * the wall never shows a spinner: it comes up holding the last thing it knew,
   * and a cold cache renders the empty structure, which is a valid state.
   */
  useLayoutEffect(() => {
    const cached = readCsvCache()
    if (!cached) return
    try {
      // A mount-only read of an external store that must land before paint.
      //
      // A lazy `useState` initialiser cannot be used here: both pages are
      // prerendered, so seeding state from localStorage during the first render
      // would disagree with the server HTML and break hydration.
      // `useLayoutEffect` re-renders synchronously before the browser paints, so
      // the wall never shows a frame of nothing — which is the whole reason it
      // needs no spinner. The rule guards against cascading renders; this runs
      // once, on mount, and sets state that nothing else in the effect reads.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSnapshot(parseSnapshot(cached))
    } catch (error) {
      // A cache written by an older schema. Nothing to repair — the next
      // successful fetch overwrites it.
      console.error('[tv] cached CSV no longer parses; waiting for a fresh fetch', error)
    }
  }, [])

  const tick = useCallback(async () => {
    if (running.current) return
    running.current = true
    try {
      const raw = await fetchCsv()
      const fresh = parseSnapshot(raw)

      // Discard the whole tick on a short feed and keep the last good data. A
      // read landing mid-rebuild could otherwise fire a false overtake or
      // permanently burn a milestone. Nothing is written, not even the cache.
      if (!passesRowGate(fresh.teams)) {
        console.error(`[tv] short feed (${fresh.teams.length} rows); keeping last good data`)
        return
      }

      writeCsvCache(raw)

      // Reconcile only ever runs on a freshly gated fetch. The boot cache is
      // render-only: reconciling it would emit nothing anyway, because
      // reconcile is idempotent, and would cost a write for nothing.
      const { ledger, events } = reconcile(readLedger(), fresh)
      writeLedger(ledger)
      if (events.length > 0) {
        enqueue(events)
        setQueueVersion((version) => version + 1)
      }

      setSnapshot(fresh)
    } finally {
      running.current = false
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    /**
     * The one `catch` in the whole subsystem, and it is loop isolation rather
     * than a fallback: a single bad tick must not kill the interval, and the
     * failure self-heals because the next tick retries against unchanged
     * persisted state. Every other error path here is an uncaught throw — do
     * not add a second `try`.
     */
    const safeTick = () => {
      tick().catch((error: unknown) => console.error('[tv] tick failed', error))
    }

    const start = () => {
      if (timer !== undefined) return
      safeTick()
      timer = setInterval(safeTick, POLL_INTERVAL_MS)
    }

    const stop = () => {
      if (timer === undefined) return
      clearInterval(timer)
      timer = undefined
    }

    const sync = () => (document.visibilityState === 'visible' ? start() : stop())

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      stop()
    }
  }, [tick])

  return { snapshot, queueVersion }
}
