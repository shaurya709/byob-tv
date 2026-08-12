'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { AsOf } from '@/components/AsOf'
import { TICK_MS, TICK_SLOW_MS } from '@/config'
import { computeCountdownState, mastheadCountdown } from '@/lib/countdown'
import { fleaInstant } from '@/lib/feed'
import type { Snapshot } from '@/lib/types'

/**
 * The spine down the left of `/podium`: the event's name, the stake, the
 * colophon.
 *
 * ── Why the shared header does not appear on this slide ──
 *
 * `/weekly` keeps `WallHeader` — a thin band with the lockup, a heading and the
 * Flea dial. This board replaced it with a full-height band because the previous
 * composition floated: three cards and a list on a white field, with a 65px
 * strip of furniture across the top holding them down. A vertical band anchors
 * the frame at one edge and gives the countdown somewhere to be large.
 *
 * The cost is that the two slides no longer share their chrome, and they rotate
 * on one screen minutes apart. That is paid for deliberately: what has to be
 * consistent between them is the *data* — the same lockup, the same provenance
 * stamp, the same countdown brain — and all three are still here, in a different
 * arrangement rather than a different system.
 *
 * ── The foot is a colophon, and every line of it earns its place ──
 *
 * **The lockup**, because this is a Mesa campus wall and the brand does not
 * leave it. **The as-of stamp**, because the wall shows no error state by
 * design: a fetch that fails keeps the last good data and goes on rendering
 * perfectly healthy stale numbers for days, and this stamp is the only thing
 * that makes that visible. **"Total revenue"**, once, because `/podium` ranks on
 * all-time and `/weekly` on the week's, and without it the only difference
 * between two slides minutes apart is which numbers happen to be larger.
 *
 * Once, not per card. Three cards each captioned with the same two words is
 * apparatus repeating itself, and the caption belongs to the board.
 */

/**
 * Development-only clock skew, so every countdown band can be watched on a real
 * page: `?now=2026-09-05T23:00:00+05:30`.
 *
 * The check is `NODE_ENV`, inlined at build time, so a production build carries
 * no trace of it — a wall accidentally launched with a leftover query param must
 * not spend the cohort counting down from the wrong day. Same rule, same
 * reasoning and the same parameter name as `FleaStrip`, which is the other
 * presentation of this countdown.
 */
function devClockSkew(): number {
  if (process.env.NODE_ENV !== 'development') return 0
  const raw = new URLSearchParams(window.location.search).get('now')
  if (raw === null) return 0
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? 0 : parsed - Date.now()
}

/**
 * The countdown, banded for this masthead.
 *
 * The interval is the slow one until the final day and the fast one inside it,
 * which is the same arrangement `FleaStrip` uses — a wall that re-rendered a
 * digit every second for six weeks would be spending the main thread on a figure
 * that changes daily.
 */
function Countdown({ at }: { at: Date | null }) {
  const [text, setText] = useState<{ figure: string; label: string } | null>(null)
  const [fast, setFast] = useState(false)

  useEffect(() => {
    if (at === null) return
    const target = at.getTime()
    const skew = devClockSkew()
    const update = () => {
      const state = computeCountdownState(target, Date.now() + skew)
      setText(mastheadCountdown(state))
      setFast(state.mode === 'timer')
    }
    update()
    const timer = setInterval(update, fast ? TICK_MS : TICK_SLOW_MS)
    return () => clearInterval(timer)
  }, [at, fast])

  // Nothing until mounted — this figure cannot match between the server render
  // and the first client render — nothing until the sheet has supplied an
  // instant, and nothing ever again once the event is over. The spine simply
  // closes up around the gap; there is no placeholder.
  if (text === null) return null

  return (
    <>
      <span className="tv-pod-label">Mesa Flea</span>
      <span
        className="tv-figure"
        style={{
          font: 'var(--t-pod-count)',
          letterSpacing: 'var(--track-pod-fig)',
          color: 'var(--tangerine-glow)',
        }}
      >
        {text.figure}
      </span>
      <span className="tv-pod-label">{text.label}</span>
    </>
  )
}

export function PodiumMasthead({ snapshot }: { snapshot: Snapshot | null }) {
  return (
    <aside className="tv-pod-spine">
      {/* One letter per line rather than `writing-mode: vertical-rl`, which
          rotates the glyphs onto their side. These stand upright and stack,
          which is the only version that stays readable at a glance. */}
      <h1 className="tv-pod-byob" style={{ margin: 0 }} aria-label="BYOB">
        {['B', 'Y', 'O', 'B'].map((letter, index) => (
          <span key={index} style={{ display: 'block' }} aria-hidden>
            {letter}
          </span>
        ))}
      </h1>

      {/* The rule sits between identity and stake. `auto` margins above and
          below are what distribute the spine's slack — the three zones hold
          their own proportions and the air between them absorbs the frame. */}
      <div
        style={{
          marginBlock: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--s-5)',
          width: '100%',
        }}
      >
        <div className="tv-pod-rule" />
        <Countdown at={snapshot === null ? null : fleaInstant(snapshot.cohort)} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--s-3)',
          width: '100%',
        }}
      >
        <span className="tv-pod-label">Total revenue</span>
        {/* The reversed lockup, because the spine is Deep Forest. The green-on
            -white file used in the shared header is invisible here. */}
        <Image
          src="/brand/logo-pg-white.png"
          alt="Mesa School of Business"
          width={448}
          height={128}
          style={{ width: '62%', height: 'auto' }}
          unoptimized
        />
        <AsOf snapshot={snapshot} />
      </div>
    </aside>
  )
}
