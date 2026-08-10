'use client'

import { useEffect, useState } from 'react'

import { PROGRAMME_START, TICKER_INTERVAL_MS } from '@/config'

/**
 * Days since the programme started, to the millisecond. The pulse of the wall —
 * never the hero, always moving.
 *
 * `PROGRAMME_START` is an absolute instant, so the elapsed milliseconds are the
 * same on a laptop set to IST, UTC or anywhere else. No timezone maths.
 *
 * Rendered empty until mounted: this is the one value on the wall that differs
 * between the server render and the first client render, and matching them by
 * rendering nothing is cheaper than suppressing a hydration warning.
 */
function format(elapsedMs: number): string {
  const clamped = Math.max(0, elapsedMs)
  const days = Math.floor(clamped / 86_400_000)
  const rest = clamped % 86_400_000
  const hours = Math.floor(rest / 3_600_000)
  const minutes = Math.floor((rest % 3_600_000) / 60_000)
  const seconds = Math.floor((rest % 60_000) / 1000)
  const millis = Math.floor(rest % 1000)

  const pad = (value: number, width = 2) => String(value).padStart(width, '0')
  return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`
}

export function MicrosecondTicker() {
  const [elapsed, setElapsed] = useState<number | null>(null)

  useEffect(() => {
    const start = PROGRAMME_START.getTime()
    const update = () => setElapsed(Date.now() - start)
    update()
    const timer = setInterval(update, TICKER_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return <span className="tv-ticker">{elapsed === null ? '' : format(elapsed)}</span>
}
