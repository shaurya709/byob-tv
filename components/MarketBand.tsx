'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { TICK_MS, TICK_SLOW_MS } from '@/config'
import { devClockSkew } from '@/lib/devClock'
import { formatCount, formatRupees } from '@/lib/format'
import { marketClock, type MarketClock } from '@/lib/marketClock'
import type { MarketSnapshot } from '@/lib/marketTypes'

/**
 * The market board's masthead: the Mesa lockup, what the market has taken, and
 * how long it has left.
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
  const sales = rows.reduce((sum, row) => sum + row.txns, 0)
  const trading = rows.filter((row) => row.takings > 0).length

  // `null` until the effect has run. A live clock cannot match between the
  // server render of a prerendered route and the first client render, so it is
  // absent for one frame rather than a hydration mismatch on every load.
  const clock = useMarketCountdown(snapshot?.opensAt ?? null, snapshot?.closesAt ?? null)

  return (
    <header className="market-band">
      <div className="market-brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-6)', minWidth: 0 }}>
        <Image
          src="/brand/logo-pg-white.png"
          alt="Mesa School of Business"
          width={448}
          height={128}
          // Near-white on the band, where the green lockup would disappear.
          style={{ height: 'var(--h-mkt-logo)', width: 'auto' }}
          unoptimized
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ font: 'var(--t-mkt-word)', letterSpacing: 'var(--track-snug)' }}>
            MESA FLEA
          </div>
          {/* Says what it counts, on the board itself. Cash is invisible here,
              and a board that does not admit that is a competing claim about
              the same money `/podium` reports. */}
          <div className="market-label" style={{ marginTop: 'var(--s-1)' }}>
            Live digital takings
          </div>
        </div>
      </div>

      <div className="market-figures" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--s-10)' }}>
        <div style={{ textAlign: 'right' }}>
          <div className="market-total">{formatRupees(taken)}</div>
          <div className="market-label" style={{ marginTop: 'var(--s-1)' }}>
            Taken so far
          </div>
        </div>
        <div className="market-stat-cell" style={{ textAlign: 'right' }}>
          <div className="market-stat">{formatCount(sales)}</div>
          <div className="market-label" style={{ marginTop: 'var(--s-1)' }}>
            Sales
          </div>
        </div>
        <div className="market-stat-cell" style={{ textAlign: 'right' }}>
          <div className="market-stat">{formatCount(trading)}</div>
          <div className="market-label" style={{ marginTop: 'var(--s-1)' }}>
            Stalls trading
          </div>
        </div>

        {/* Nothing at all when the sheet has not named its window. A board that
            cannot say when the market closes says nothing, rather than counting
            to a guess. */}
        {clock !== null && clock.display !== '' && (
          <div
            className="market-clock-cell"
            style={{
              textAlign: 'right',
              borderLeft: '1px solid var(--surface-glass-strong)',
              paddingLeft: 'var(--s-10)',
            }}
          >
            <div className="market-clock">{clock.display}</div>
            <div className="market-label" style={{ marginTop: 'var(--s-1)' }}>
              {clock.label}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
