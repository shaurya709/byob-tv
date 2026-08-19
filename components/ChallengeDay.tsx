'use client'

import { useEffect, useState } from 'react'

import { TICK_SLOW_MS } from '@/config'
import { challengeDay } from '@/lib/challenge'

/**
 * `Day 2 of 14`, in the slot `/weekly`'s band used to give the Mesa Flea.
 *
 * ── The Flea has not left the wall ──
 *
 * `/podium` carries its own full countdown (`PodiumMasthead`), and the rotation
 * still shows it. What changed is which of the two *this* board leads with.
 * `WallHeader` justified the countdown's prominence as "the only element on this
 * wall that changes what a team does today" — and on a board whose figure is now
 * a fortnight's earnings against a hard close, that argument belongs to the day
 * count. The Flea is still the horizon; this is the deadline.
 *
 * ── Computed, not published ──
 *
 * `TV_Cohort` could carry a `challenge_day` cell and this could print it. It
 * does not, because a published day number freezes when the consolidator stalls
 * — the wall would read `Day 14 of 14` for as long as the sheet stayed down,
 * confidently and with nothing to notice. Two instants and a clock cannot go
 * stale, and this wall is expected to run unattended for weeks.
 *
 * ── No timezone logic, on purpose ──
 *
 * All of it lives in `lib/challenge.ts`, which needs none: the sheet's instants
 * carry `+05:30`, so the day rolls at IST midnight on a laptop set to anywhere.
 *
 * Minute ticks rather than seconds — the figure changes once a day. It ticks at
 * all so a wall that has been up since before midnight moves on without a
 * reload.
 */
export function ChallengeDay({ start, end }: { start: Date | null; end: Date | null }) {
  const [state, setState] = useState<{ day: number; total: number } | null>(null)

  useEffect(() => {
    const update = () => setState(challengeDay(start, end, Date.now()))
    update()
    const timer = setInterval(update, TICK_SLOW_MS)
    return () => clearInterval(timer)
  }, [start, end])

  // Nothing until mounted — this figure cannot match between the server render
  // and the first client render — and nothing between challenges, which is the
  // same silence the Flea countdown keeps once its event is over.
  if (state === null) return null

  // Styled inline from the band's own tokens, as `FleaDial` is and for the same
  // reason: `.tv-band` redefines `--fg1` and `--t-tv-cal-figure` on itself, so
  // the surface decides the scale and the ink rather than the root. Tangerine
  // Glow rather than Tangerine 600 — the 600 was picked to survive a white
  // ground and goes muddy on Deep Forest at six metres.
  const label: React.CSSProperties = {
    font: 'var(--t-tv-strip-label)',
    letterSpacing: 'var(--track-overline)',
    textTransform: 'uppercase',
    color: 'var(--fg1)',
  }

  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--s-2)',
        margin: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={label}>Day</span>
      <span style={{ font: 'var(--t-tv-cal-figure)', color: 'var(--tangerine-glow)' }}>
        {state.day}
      </span>
      <span style={label}>of {state.total}</span>
    </p>
  )
}
