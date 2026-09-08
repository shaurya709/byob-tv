'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { MARKET_CSV_URL, MARKET_POLL_INTERVAL_MS } from '@/config'
import { fetchMarketCsv, parseMarket, passesMarketRowGate } from '@/lib/marketFeed'
import type { MarketSnapshot } from '@/lib/marketTypes'
import { readMarketCsv, writeMarketCsv } from '@/lib/storage'

/**
 * The market board's poll. The only module here that touches `fetch`,
 * `setInterval` or the visibility API.
 *
 * ── Deliberately not `useWallData` ──
 *
 * It reproduces four things from that hook — the visibility gate, the running
 * ref, the interval, and the single `catch` — and nothing else. What it does not
 * have is the point: no freeze, no thaw, no held snapshot, no `detect`, no
 * `BoardState`, no kick queue. This board does not animate rank changes in v1,
 * so most of `useWallData` would be dead weight, and the two are meant to
 * diverge rather than be kept in step. Extracting a shared `usePoll` is a
 * post-event cleanup, not something to attempt in the week of the market.
 *
 * The isolation is the reason it exists at all: `fetchCsv` is a `Promise.all`
 * over two URLs and `writeCsvCache` overwrites one blob holding both of them, so
 * a market fetch joining either would put two boards that are on a wall right
 * now behind the newest, least proven source in the project.
 *
 * ── Why there is no animation here, and a test that says so ──
 *
 * The data steps every five minutes, so rank changes arrive in batches while the
 * kick queue caps at four; `detect` needs a period the figure resets with and
 * this window has none; and at 09:00 forty stalls sit on ₹0, so the first
 * non-zero fetch would produce a wave of simultaneous changes. A source scan in
 * the test beside this pins the absence, so it reads as a decision rather than
 * as an omission somebody helpfully repairs.
 */
export type MarketData = {
  snapshot: MarketSnapshot | null
}

export function useMarketData(): MarketData {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const running = useRef(false)

  /**
   * First paint reads the cached CSV, before the browser paints. This is why the
   * board never shows a spinner: it comes up holding the last thing it knew, and
   * a cold cache renders twenty empty slots, which is a valid state.
   */
  useLayoutEffect(() => {
    const cached = readMarketCsv()
    if (cached === null) return
    try {
      // A mount-only read of an external store that must land before paint. A
      // lazy `useState` initialiser cannot be used: the route is prerendered, so
      // seeding state from localStorage during the first render would disagree
      // with the server HTML and break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSnapshot(parseMarket(cached))
    } catch (error) {
      // A cache written by an older schema. Nothing to repair — the next
      // successful fetch overwrites it.
      console.error('[market] cached CSV no longer parses; waiting for a fresh fetch', error)
    }
  }, [])

  const tick = useCallback(async () => {
    if (running.current) return
    running.current = true
    try {
      const csv = await fetchMarketCsv()
      const fresh = parseMarket(csv)

      // Discard the whole tick on a short export and keep the last good data.
      // Measured on the live published CSV: three empty exports and two
      // multi-minute hangs in twenty-five minutes. Acting on one would empty the
      // board in front of the whole market, with no error anywhere. Nothing is
      // written, not even the cache.
      if (!passesMarketRowGate(fresh.rows)) {
        console.error(`[market] short feed (${fresh.rows.length} rows); keeping last good data`)
        return
      }

      writeMarketCsv(csv)
      setSnapshot(fresh)
    } finally {
      running.current = false
    }
  }, [])

  useEffect(() => {
    // **Nothing is armed until the tab is published.** An empty URL is not a
    // failure worth retrying every sixty seconds: the board renders its twenty
    // empty slots, which is legible, and the console says why once instead of
    // fourteen hundred times a day.
    if (MARKET_CSV_URL === '') {
      console.warn('[market] MARKET_CSV_URL is empty — MesaFlea_TV is not published yet. Not polling.')
      return
    }

    let timer: ReturnType<typeof setInterval> | undefined

    /**
     * The one `catch` in this hook, and it is loop isolation rather than a
     * fallback: a single bad tick must not kill the interval, and the failure
     * self-heals because the next tick retries against unchanged state. Every
     * other error path here is an uncaught throw — do not add a second `try`.
     */
    const safeTick = () => {
      tick().catch((error: unknown) => console.error('[market] tick failed', error))
    }

    const start = () => {
      if (timer !== undefined) return
      safeTick()
      timer = setInterval(safeTick, MARKET_POLL_INTERVAL_MS)
    }

    const stop = () => {
      if (timer === undefined) return
      clearInterval(timer)
      timer = undefined
    }

    // Only a visible page fetches. The board is reachable as a standalone URL on
    // a TV and on forty phones at once; a backgrounded tab polling on a phone in
    // someone's apron pocket is spend for nothing.
    const sync = () => (document.visibilityState === 'visible' ? start() : stop())

    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      stop()
    }
  }, [tick])

  return { snapshot }
}
