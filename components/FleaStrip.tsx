'use client'

import { useEffect, useState } from 'react'

import { TICK_MS, TICK_SLOW_MS } from '@/config'
import { FleaDial } from '@/components/FleaDial'
import { computeCountdownState, type CountdownState } from '@/lib/countdown'

/**
 * How long until the Mesa Flea, in the corner of both slides — a small calendar
 * page with the countdown composed inside its date box.
 *
 * **Ambient, never the hero.** The calendar is a frame for one figure, not a
 * date display: far out it holds the day count, inside fifteen days it reads
 * days-and-hours, inside the last day it becomes a live ticking clock, and
 * during the event itself it says LIVE NOW. After the Flea ends the whole
 * thing leaves the wall — an event that is over gets silence, not a stale
 * memento. Every one of those transitions is decided by `computeCountdownState`
 * in lib/countdown.ts; nothing here compares a timestamp.
 *
 * The instant comes from `TV_Cohort`, so the still-unconfirmed 10:00 opening is
 * one cell to correct rather than a commit. **No instant means no calendar** —
 * the wall says nothing rather than counting down to a guess.
 *
 * ── Why there is no timezone logic here ──
 *
 * `computeCountdownState` differences two absolute instants, which is the same
 * number of milliseconds on a laptop set to IST, UTC or Los Angeles. That is
 * only true because `flea_datetime_iso` carries `+05:30`, which `fleaInstant`
 * refuses to parse without.
 *
 * ── Faking the clock, in development only ──
 *
 * `?now=2026-09-05T23:00:00+05:30` on the URL skews this component's clock —
 * and only this component's — so every mode can be watched on a real page. The
 * check is `NODE_ENV`, inlined at build time, so a production build carries no
 * trace of it: a wall accidentally launched with a leftover query param must
 * not spend the cohort counting down from the wrong day.
 */

function devClockSkew(): number {
  if (process.env.NODE_ENV !== 'development') return 0
  const raw = new URLSearchParams(window.location.search).get('now')
  if (raw === null) return 0
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? 0 : parsed - Date.now()
}

export function FleaStrip({ at }: { at: Date | null }) {
  const [state, setState] = useState<CountdownState | null>(null)
  // Read once per render pass rather than per tick, so the interval below is
  // not torn down and rebuilt every second of the final day.
  const [fast, setFast] = useState(false)

  useEffect(() => {
    if (at === null) return
    const target = at.getTime()
    const skew = devClockSkew()
    const update = () => {
      const next = computeCountdownState(target, Date.now() + skew)
      setState(next)
      setFast(next.mode === 'timer')
    }
    update()
    const timer = setInterval(update, fast ? TICK_MS : TICK_SLOW_MS)
    return () => clearInterval(timer)
  }, [at, fast])

  // Nothing until mounted — this figure cannot match between the server render
  // and the first client render — nothing until the sheet has supplied an
  // instant, and nothing ever again once the event is over.
  if (at === null || state === null || state.mode === 'hidden') return null

  // The label is handed to the dial rather than stacked above the pair: on the
  // group it centred over the ring, which captioned the wrong half.
  return (
    <FleaDial
      state={state}
      label={
        <span
          style={{
            font: 'var(--t-tv-strip-label)',
            letterSpacing: 'var(--track-overline)',
            textTransform: 'uppercase',
            color: 'var(--fg1)',
          }}
        >
          Mesa Flea
        </span>
      }
    />
  )
}
