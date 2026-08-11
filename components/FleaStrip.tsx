'use client'

import { useEffect, useState } from 'react'

import { AWARE_AT_MS, FINAL_HOUR_AT_MS, TICK_FAST_MS, TICK_MS, URGENT_AT_MS } from '@/config'

/**
 * How long until the Mesa Flea, in the corner of both slides.
 *
 * **Ambient, never the hero.** It gets louder on its own as the date closes in —
 * four states, chosen from the time remaining, with no one touching anything.
 * The escalation is the point: a countdown that looks the same in August and on
 * the morning of the 6th is furniture, and nobody sees furniture.
 *
 *   calm    >14 days   26d                     muted
 *   aware   ≤14 days   13d 04h                 tangerine
 *   urgent  ≤7 days    6d 04:12:47             tangerine, bold, breathing
 *   final   <1 hour    12:47.318               inverted, filled, breathing fast
 *
 * The instant comes from `TV_Cohort`, so the still-unconfirmed 10:00 opening is
 * one cell to correct rather than a commit. **No instant means no strip** — the
 * wall says nothing rather than counting down to a guess.
 *
 * ── Why there is no timezone logic here ──
 *
 * `at.getTime() - Date.now()` is a difference of two absolute instants, which is
 * the same number of milliseconds on a laptop set to IST, UTC or Los Angeles.
 * That is only true because `flea_datetime_iso` carries `+05:30`, which
 * `fleaInstant` refuses to parse without.
 */

export type FleaState = 'calm' | 'aware' | 'urgent' | 'final' | 'past'

export function stateFor(remainingMs: number): FleaState {
  if (remainingMs <= 0) return 'past'
  if (remainingMs < FINAL_HOUR_AT_MS) return 'final'
  // Urgent runs all the way down to the final hour. The brief tabulated it as
  // "7 days to 24 hours", which leaves 24h-1h with no state at all; this is the
  // only reading under which the four states are total.
  if (remainingMs < URGENT_AT_MS) return 'urgent'
  if (remainingMs < AWARE_AT_MS) return 'aware'
  return 'calm'
}

function pad(value: number, width = 2): string {
  return String(Math.floor(value)).padStart(width, '0')
}

export function figureFor(remainingMs: number, state: FleaState): string {
  const total = Math.abs(remainingMs)
  const days = Math.floor(total / 86_400_000)
  const hours = Math.floor((total % 86_400_000) / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const millis = Math.floor(total % 1000)

  switch (state) {
    case 'calm':
      return `${days}d`
    case 'aware':
      return `${days}d ${pad(hours)}h`
    case 'urgent':
      return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    case 'final':
      return `${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`
    case 'past':
      return `+${days}d ${pad(hours)}h`
  }
}

/** Breathing period, or `null` for a state that does not move. */
const PULSE_S: Record<FleaState, number | null> = {
  calm: null,
  aware: null,
  urgent: 2,
  final: 1,
  past: null,
}

export function FleaStrip({ at }: { at: Date | null }) {
  const [remaining, setRemaining] = useState<number | null>(null)
  // Read once per render pass rather than per tick, so the interval below is not
  // torn down and rebuilt every frame of the final hour.
  const [fast, setFast] = useState(false)

  useEffect(() => {
    if (at === null) return
    const target = at.getTime()
    const update = () => {
      const left = target - Date.now()
      setRemaining(left)
      setFast(left > 0 && left < FINAL_HOUR_AT_MS)
    }
    update()
    const timer = setInterval(update, fast ? TICK_FAST_MS : TICK_MS)
    return () => clearInterval(timer)
  }, [at, fast])

  // Nothing until mounted. This is the one figure that cannot match between the
  // server render and the first client render, and nothing at all until the
  // sheet has supplied an instant.
  if (at === null || remaining === null) return null

  const state = stateFor(remaining)
  const pulse = PULSE_S[state]
  const filled = state === 'final'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 'var(--s-2)',
        paddingInline: filled ? 'var(--s-3)' : 0,
        paddingBlock: filled ? 'var(--s-1)' : 0,
        borderRadius: 'var(--radius-pill)',
        background: filled ? 'var(--tangerine-600)' : 'transparent',
        color: state === 'calm' ? 'var(--fg-muted)' : filled ? 'var(--white)' : 'var(--tangerine-600)',
        animation: pulse === null ? undefined : `tv-breathe ${pulse}s ease-in-out infinite`,
      }}
    >
      <span
        style={{
          font: 'var(--t-tv-strip-label)',
          letterSpacing: 'var(--track-overline)',
          textTransform: 'uppercase',
        }}
      >
        Mesa Flea
      </span>
      <span className="tv-figure" style={{ font: 'var(--t-tv-strip-figure)' }}>
        {figureFor(remaining, state)}
      </span>
    </span>
  )
}
