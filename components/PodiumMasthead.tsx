'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

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
 * ── What the spine no longer carries ──
 *
 * It held a colophon at its foot: the lockup, a "Total revenue" caption and the
 * as-of stamp. The lockup moved to the head; the other two were removed by
 * decision, and both removals cost something worth writing down.
 *
 * **The caption** was the one line telling a passer-by that these figures are
 * all-time where `/weekly`'s are the week's, on two slides that rotate on one
 * screen minutes apart.
 *
 * **The as-of stamp** was the only thing that made a frozen wall visible. This
 * board shows no error state by design — a fetch that fails keeps the last good
 * data and goes on rendering perfectly healthy stale numbers for days. Nothing
 * on `/podium` now says when those numbers were written. `/weekly` still carries
 * it in the shared header, so the information is not gone from the wall; it is
 * gone from this slide.
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

  // One element rather than a fragment, so the caller can space the countdown
  // as a block. Its three lines are one thing — a label, its figure, and its
  // unit — and the air *inside* them is tighter than the air around them.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--s-2)',
        width: '100%',
      }}
    >
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
    </div>
  )
}

export function PodiumMasthead({ snapshot }: { snapshot: Snapshot | null }) {
  return (
    <aside className="tv-pod-spine">
      {/* **The lockup leads.** It sat in the colophon at the foot and has moved
          to the head of the spine, which is where every other Mesa surface puts
          it and where the eye enters a left-hand band. Everything below has slid
          down behind it.

          The reversed lockup, because the spine is Deep Forest — the
          green-on-white file the shared header uses is invisible here. */}
      <Image
        src="/brand/logo-pg-white.png"
        alt="Mesa School of Business"
        width={448}
        height={128}
        // 81%, up 30% from 62%. At the smaller size the lockup read as a
        // footnote beside a wordmark this heavy; a brand mark that has to be
        // looked for is not doing its job on a wall read at six metres.
        style={{ width: '81%', height: 'auto' }}
        unoptimized
      />

      {/* One letter per line rather than `writing-mode: vertical-rl`, which
          rotates the glyphs onto their side. These stand upright and stack,
          which is the only version that stays readable at a glance. */}
      <h1
        className="tv-pod-byob"
        // `auto`, so the wordmark and everything under it sit at the foot of
        // the spine and the slack collects under the lockup. This is what the
        // as-of stamp used to occupy; removing it moved the air rather than
        // leaving a hole where the stamp was.
        style={{ margin: 0, marginTop: 'auto' }}
        aria-label="BYOB"
      >
        {['B', 'Y', 'O', 'B'].map((letter, index) => (
          <span key={index} style={{ display: 'block' }} aria-hidden>
            {letter}
          </span>
        ))}
      </h1>

      {/* **The rule gets equal air on both sides**, and that is the point of
          spelling both out as the same token rather than letting one of them be
          whatever slack is left over. The rule separates identity from stake;
          air that is bigger above than below makes it read as belonging to the
          countdown rather than as dividing the two.

          Which also means the countdown's position is now a *consequence* of how
          tall BYOB is, rather than something set independently — growing the
          wordmark pushes everything under it down, which is the behaviour asked
          for. */}
      <div
        style={{
          marginTop: 'var(--s-pod-spine-gap)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--s-pod-spine-gap)',
          width: '100%',
        }}
      >
        <div className="tv-pod-rule" />
        <Countdown at={snapshot === null ? null : fleaInstant(snapshot.cohort)} />
      </div>

      {/* **"Total revenue" is gone from here**, by decision. It was the one line
          telling a passer-by that these figures are all-time where `/weekly`'s
          are the week's, and the two slides rotate on one screen minutes apart —
          so the ambiguity it covered is now uncovered. Recorded rather than
          argued: if a figure is ever misread between the two boards, this is the
          line that went.

          What stays is the as-of stamp, which is load-bearing for a different
          reason: the wall shows no error state, so a failed fetch renders
          perfectly healthy stale numbers for days and this is the only tell. */}
    </aside>
  )
}
