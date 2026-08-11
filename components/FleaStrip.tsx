'use client'

import { useEffect, useState } from 'react'

import { TICK_MS, TICK_SLOW_MS } from '@/config'
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

function ariaFor(state: CountdownState): string {
  switch (state.mode) {
    case 'days':
      return `Days until Mesa Flea: ${state.numeric}`
    case 'daysHours':
    case 'timer':
      return `Time until Mesa Flea: ${state.display}`
    case 'live':
      return 'Mesa Flea is live now'
    case 'hidden':
      return ''
  }
}

/**
 * The calendar page itself: two binding rings and a date box, drawn inline.
 *
 * A `viewBox` scaled uniformly, not percentage geometry — the rings stay round
 * at every size that way. The timer mode gets a wider page (`wide`) because
 * eight tabular digits and two colons simply do not fit the square one; the
 * height never changes, so the header band does not move between modes.
 *
 * The figure is HTML positioned over the box, not SVG `<text>`: it inherits
 * the type tokens, tabular figures and letter-spacing like every other number
 * on the wall, instead of reimplementing them in a second text system.
 */
function CalendarPage({ state }: { state: CountdownState }) {
  const wide = state.mode === 'timer'
  const w = wide ? 76 : 52

  return (
    <span
      role="img"
      aria-label={ariaFor(state)}
      style={{
        position: 'relative',
        display: 'inline-block',
        height: 'var(--h-tv-cal)',
        aspectRatio: `${w} / 40`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${w} 40`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      >
        {/* The page. */}
        <rect
          x="1.5"
          y="6"
          width={w - 3}
          height="32.5"
          rx="5"
          fill="var(--white)"
          stroke="var(--deep-teal)"
          strokeWidth="2"
        />
        {/* The binding strip across the top, the lightest possible fill. */}
        <path
          d={`M 2.5 11 A 4 4 0 0 1 6.5 7 H ${w - 6.5} A 4 4 0 0 1 ${w - 2.5} 11 V 14.5 H 2.5 Z`}
          fill="var(--soft-mint)"
        />
        <line x1="2.5" y1="14.5" x2={w - 2.5} y2="14.5" stroke="var(--deep-teal)" strokeWidth="1.2" />
        {/* Two binding rings, piercing the top edge. */}
        <rect x={w * 0.28 - 1.5} y="1" width="3" height="10" rx="1.5" fill="var(--deep-teal)" />
        <rect x={w * 0.72 - 1.5} y="1" width="3" height="10" rx="1.5" fill="var(--deep-teal)" />
      </svg>

      {/* The date box's figure, over the area below the binding strip. */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '38%',
          bottom: '5%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state.mode === 'days' && (
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
            <span className="tv-figure" style={{ font: 'var(--t-tv-cal-day)', color: 'var(--fg1)' }}>
              {state.display}
            </span>
            <span style={{ font: 'var(--t-tv-cal-unit)', color: 'var(--fg-muted)' }}>D</span>
          </span>
        )}
        {state.mode === 'daysHours' && (
          <span className="tv-figure" style={{ font: 'var(--t-tv-cal-mid)', color: 'var(--fg1)' }}>
            {state.display}
          </span>
        )}
        {state.mode === 'timer' && (
          <span className="tv-figure" style={{ font: 'var(--t-tv-cal-timer)', color: 'var(--fg1)' }}>
            {state.display}
          </span>
        )}
        {state.mode === 'live' && (
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
              font: 'var(--t-tv-cal-unit)',
              color: 'var(--tangerine-600)',
              animation: 'tv-breathe 2s ease-in-out infinite',
            }}
          >
            <span>LIVE</span>
            <span>NOW</span>
          </span>
        )}
      </span>
    </span>
  )
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

  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--s-1)',
      }}
    >
      {/* The label stays as text, captioned above the page: a bare number in a
          calendar says something is coming, but not what. Full-strength ink,
          not muted — it is the name of the event, not apparatus. */}
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
      <CalendarPage state={state} />
    </span>
  )
}
