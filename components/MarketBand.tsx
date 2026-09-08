'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { TICK_MS, TICK_SLOW_MS } from '@/config'
import { devClockSkew } from '@/lib/devClock'
import { formatCount, formatRupees } from '@/lib/format'
import { marketClock, type MarketClock } from '@/lib/marketClock'
import type { MarketSnapshot } from '@/lib/marketTypes'

/**
 * The market board's masthead: the Mesa lockup, the wordmark, what the market
 * has taken, and how long it has left.
 *
 * ── Three tracks, and the middle one is on the frame's centreline ──
 *
 * `1fr auto 1fr` with equal flanks puts the wordmark on the centre of the frame
 * by construction, at every width, with no value to tune. `.tv-band` reaches the
 * same arrangement by the same reasoning.
 *
 * The figures sit in the right track and are right-aligned within it, so the
 * group grows leftward into its own slack as the numbers get longer rather than
 * pushing the wordmark off centre.
 *
 * ── What "digital takings" used to say here ──
 *
 * A sub-line under the wordmark read "Live digital takings", which was the
 * board's one on-screen admission that cash is invisible to it. It came off for
 * the sake of the heading, and the admission did not: the footer carries
 * "Razorpay payments only · cash not counted" on every frame. If that
 * footer ever goes, this has to come back — the claim is not decoration.
 *
 * ── The clock is the only thing on this board allowed to tick ──
 *
 * Every figure beside it steps every five minutes, because that is how often the
 * ingestion writes. A per-second animation on any of *those* would be a lie
 * about how fresh they are. The countdown is derived from the machine's clock
 * rather than from the sheet, so it can honestly tick — and it is what makes a
 * board carrying five-minute-old money still read as live.
 *
 * ── `as_of` sits beside it, deliberately ──
 *
 * A confidently ticking clock above a stalled pipeline is the worst failure this
 * board has available: everything looks alive and nothing is. `as_of` is written
 * by the ingestion on every successful pull, so the pair on screen together is
 * what makes a stall visible — the clock counts down while the stamp stops
 * moving.
 */

/** `Opens in` / `Closes in` / `Closed` and the figure, or `null` until mounted. */
function useMarketCountdown(opensAt: number | null, closesAt: number | null): MarketClock | null {
  const [clock, setClock] = useState<MarketClock | null>(null)
  // Read once per render pass rather than per tick, so the interval below is not
  // torn down and rebuilt every second of the market.
  const [fast, setFast] = useState(false)

  useEffect(() => {
    if (opensAt === null || closesAt === null) return
    const skew = devClockSkew()
    const update = () => {
      const next = marketClock(opensAt, closesAt, Date.now() + skew)
      setClock(next)
      setFast(next.phase !== 'closed')
    }
    update()
    const timer = setInterval(update, fast ? TICK_MS : TICK_SLOW_MS)
    return () => clearInterval(timer)
  }, [opensAt, closesAt, fast])

  return clock
}

export function MarketBand({ snapshot }: { snapshot: MarketSnapshot | null }) {
  const rows = snapshot?.rows ?? []
  const taken = rows.reduce((sum, row) => sum + row.takings, 0)
  const orders = rows.reduce((sum, row) => sum + row.txns, 0)

  // `null` until the effect has run. A live clock cannot match between the
  // server render of a prerendered route and the first client render, so it is
  // absent for one frame rather than a hydration mismatch on every load.
  const clock = useMarketCountdown(snapshot?.opensAt ?? null, snapshot?.closesAt ?? null)

  return (
    <header className="market-band">
      <Image
        src="/brand/logo-pg-white.png"
        alt="Mesa School of Business"
        width={448}
        height={128}
        // Near-white on the band, where the green lockup would disappear.
        className="market-mark"
        unoptimized
      />

      {/* Centred on the frame's centreline, not in the band's free space — the
          two flanking tracks are equal `1fr`, which is the same construction
          `.tv-band` uses and for the same reason: free-space centring balances
          the empty band either side and puts the ink off-centre. */}
      <div className="market-word">MESA FLEA</div>

      <div className="market-figures">
        <div className="market-cell">
          <div className="market-total">{formatRupees(taken)}</div>
          <div className="market-label">Cohort sales</div>
        </div>
        <div className="market-cell">
          <div className="market-stat">{formatCount(orders)}</div>
          <div className="market-label">Orders</div>
        </div>

        {/* Nothing at all when the sheet has not named its window. A board that
            cannot say when the market closes says nothing, rather than counting
            to a guess. */}
        {clock !== null && clock.display !== '' && (
          <div className="market-cell market-clock-cell">
            <div className="market-clock">{clock.display}</div>
            <div className="market-label">{clock.label}</div>
          </div>
        )}
      </div>
    </header>
  )
}
