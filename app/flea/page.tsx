'use client'

import { useEffect, useState } from 'react'

import { MarketBand } from '@/components/MarketBand'
import { MarketBoard } from '@/components/MarketBoard'
import { useMarketData } from '@/lib/useMarketData'

/**
 * Slide 3 — the Mesa Flea market board, on a TV and on a stallholder's phone.
 *
 * ── Not in the rotation, on purpose ──
 *
 * `components/Rotator.tsx` swaps `/weekly` and `/podium` every thirty seconds
 * and returns `null` for any other path, so this route is already inert to it
 * and holds indefinitely. Nothing was changed there. The consequence is a
 * person: somebody opens this URL when the doors open and switches back when
 * they close.
 *
 * ── One route, two layouts, chosen by CSS ──
 *
 * The board is read on a 1920x1080 TV and on a 390px phone. Both trees always
 * render and the media query in `mesa-tv.css` decides which shape they take. A
 * `matchMedia` switch in JavaScript would render one layout on the server and
 * the other on the client, which is a hydration mismatch on the one route in
 * this project that has to work on a stranger's device.
 */
export default function FleaPage() {
  const { snapshot } = useMarketData()
  const highlight = useTeamParam()

  return (
    <main className="market-frame">
      <MarketBand snapshot={snapshot} />
      <MarketBoard snapshot={snapshot} highlight={highlight} />
      <footer className="market-foot">
        <span className="tv-ticker">Razorpay payments only &middot; cash sales not counted</span>
        {snapshot !== null && snapshot.asOf !== '' && (
          <span className="tv-ticker">Updated {snapshot.asOf}</span>
        )}
      </footer>
    </main>
  )
}

/**
 * Which stall is looking, from `?team=SLE-C407`.
 *
 * ── Read off `location`, in an effect, and not with `useSearchParams` ──
 *
 * Two separate reasons, and both are load-bearing. `useSearchParams` opts a
 * statically prerendered route into a Suspense boundary — a real cost to first
 * paint, in exchange for nothing this needs; `Rotator.tsx` documents the same
 * trade. And it must be an *effect* rather than a render-time read, because the
 * prerendered HTML has no query string: resolving the highlight during the first
 * client render would disagree with the server's markup. The board renders
 * unhighlighted for one frame, then the row lights up.
 *
 * Normalised to uppercase because it will be typed by hand into forty phones,
 * and an unknown id simply highlights nothing — somebody will mistype it, and a
 * board that breaks on that is worse than one that quietly shows the standings.
 */
function useTeamParam(): string | null {
  const [team, setTeam] = useState<string | null>(null)

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('team')
    // A mount-only read of something outside React that must not happen during
    // render. The rule guards against cascading renders; this runs once, sets
    // state nothing else in the effect reads, and has nowhere else to go — the
    // query string does not exist in the prerendered HTML. `useWallData` carries
    // the same exemption for the same shape of read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTeam(raw === null ? null : raw.trim().toUpperCase() || null)
  }, [])

  return team
}
