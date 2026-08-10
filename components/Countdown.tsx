'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { AWARE_AT_MS, FINAL_HOUR_AT_MS, FLEA_DATE, URGENT_AT_MS } from '@/config'

/**
 * The Mesa Flea countdown.
 *
 * Five states, chosen automatically from how long is left. The wall gets louder
 * as the date approaches and does it without anyone touching anything.
 *
 * The remaining time is `FLEA_DATE.getTime() - Date.now()`, a difference of two
 * absolute instants — correct on a laptop set to any timezone. Only the "doors
 * open" copy needs to know about IST, and it formats the same instant in
 * Asia/Kolkata rather than trusting the machine.
 */

export type CountdownState = 'calm' | 'aware' | 'urgent' | 'final' | 'past'

export function stateFor(remainingMs: number): CountdownState {
  if (remainingMs <= 0) return 'past'
  if (remainingMs < FINAL_HOUR_AT_MS) return 'final'
  // The brief tabulated Urgent as "7 days to 24 hours" and Final hour as "under
  // 1 hour", leaving 24h–1h with no state. Urgent runs down to the final hour,
  // which is the only reading under which the states are total.
  if (remainingMs < URGENT_AT_MS) return 'urgent'
  if (remainingMs < AWARE_AT_MS) return 'aware'
  return 'calm'
}

const PULSE: Record<CountdownState, number | null> = {
  calm: null,
  aware: 2.5,
  urgent: 1.5,
  final: 1.5,
  past: null,
}

/**
 * Calm is deliberately *muted* — Deep Forest Green rather than the near-black
 * primary — so that the arrival of tangerine at Aware reads as a change rather
 * than as the first time anyone looked. Tangerine then reaches full strength at
 * Urgent and stays.
 */
const TINT: Record<CountdownState, string> = {
  calm: 'var(--fg2)',
  aware: 'var(--tangerine-600)',
  urgent: 'var(--tangerine-glow)',
  final: 'var(--tangerine-glow)',
  past: 'var(--fg2)',
}

const DOORS_OPEN = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
}).format(FLEA_DATE)

type Part = { value: number; unit: string }

function partsFor(remainingMs: number, state: CountdownState): Part[] {
  const total = Math.abs(remainingMs)
  const days = Math.floor(total / 86_400_000)
  const hours = Math.floor((total % 86_400_000) / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)

  switch (state) {
    case 'calm':
      return [{ value: days, unit: days === 1 ? 'day' : 'days' }]
    case 'aware':
      return [
        { value: days, unit: 'days' },
        { value: hours, unit: 'hrs' },
      ]
    case 'urgent':
      return [
        { value: days, unit: 'days' },
        { value: hours, unit: 'hrs' },
        { value: minutes, unit: 'min' },
        { value: seconds, unit: 'sec' },
      ]
    case 'final':
      return [
        { value: hours, unit: 'hrs' },
        { value: minutes, unit: 'min' },
        { value: seconds, unit: 'sec' },
      ]
    case 'past':
      return [
        { value: days, unit: days === 1 ? 'day' : 'days' },
        { value: hours, unit: 'hrs' },
      ]
  }
}

function Figure({ part, ticking }: { part: Part; ticking: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.span
        // Only the seconds digit in the final hour animates per tick. Keying on
        // the value is what makes it re-run: a new key is a new element.
        key={ticking ? part.value : undefined}
        initial={ticking ? { scale: 1.12 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="tv-figure"
        style={{ font: 'var(--t-tv-countdown)' }}
      >
        {String(part.value).padStart(2, '0')}
      </motion.span>
      <span
        style={{
          font: 'var(--t-tv-countdown-unit)',
          letterSpacing: 'var(--track-overline)',
          textTransform: 'uppercase',
          color: 'var(--fg3)',
        }}
      >
        {part.unit}
      </span>
    </div>
  )
}

export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const target = FLEA_DATE.getTime()
    const update = () => setRemaining(target - Date.now())
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  // Nothing until mounted: the countdown is the one figure that cannot match
  // between the server render and the first client render.
  if (remaining === null) return null

  const state = stateFor(remaining)
  const pulse = PULSE[state]
  const parts = partsFor(remaining, state)

  return (
    <motion.div
      animate={pulse === null ? {} : { opacity: [1, 0.72, 1] }}
      transition={pulse === null ? {} : { duration: pulse, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--s-4)',
        color: TINT[state],
      }}
    >
      <div
        style={{
          font: 'var(--t-tv-card-context)',
          letterSpacing: 'var(--track-overline)',
          textTransform: 'uppercase',
          color: 'var(--fg3)',
        }}
      >
        {state === 'past' ? 'Since Mesa Flea' : 'Until Mesa Flea'}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-8)' }}>
        {parts.map((part) => (
          <Figure key={part.unit} part={part} ticking={state === 'final' && part.unit === 'sec'} />
        ))}
      </div>

      {state === 'final' && (
        <div style={{ font: 'var(--t-tv-card-name)', color: 'var(--fg2)' }}>
          Doors open at {DOORS_OPEN}
        </div>
      )}
    </motion.div>
  )
}
