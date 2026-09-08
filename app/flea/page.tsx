'use client'

import { useEffect, useState } from 'react'

import { MarketBand } from '@/components/MarketBand'
import { MarketBoard } from '@/components/MarketBoard'
import { MarketPicker } from '@/components/MarketPicker'
import { readMarketTeam, writeMarketTeam } from '@/lib/storage'
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
  const [highlight, setHighlight] = useTeam()

  return (
    <main className="market-frame">
      <MarketBand snapshot={snapshot} />
      <MarketBoard snapshot={snapshot} highlight={highlight} />
      <footer className="market-foot">
        {/* Phone only — hidden on the corridor TV, which belongs to nobody. */}
        <MarketPicker
          rows={snapshot?.rows ?? []}
          value={highlight}
          onChange={(teamId) => {
            writeMarketTeam(teamId)
            setHighlight(teamId)
            rewriteTeamParam(teamId)
          }}
        />
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
 * Normalised to uppercase because it may still be typed by hand into a URL, and
 * an unknown id simply highlights nothing — a board that breaks on a typo is
 * worse than one that quietly shows the standings.
 *
 * Falls back to whatever this device last picked, so a stallholder chooses their
 * venture once rather than between every customer.
 */
function useTeam(): [string | null, (teamId: string | null) => void] {
  const [team, setTeam] = useState<string | null>(null)

  useEffect(() => {
    // The link wins over the remembered choice: somebody who was *sent* a link
    // means the stall in it, and silently showing them a different one because
    // this phone picked something last week would be baffling.
    const raw = new URLSearchParams(window.location.search).get('team') ?? readMarketTeam()
    // A mount-only read of something outside React that must not happen during
    // render. The rule guards against cascading renders; this runs once, sets
    // state nothing else in the effect reads, and has nowhere else to go — the
    // query string does not exist in the prerendered HTML. `useWallData` carries
    // the same exemption for the same shape of read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTeam(raw === null ? null : raw.trim().toUpperCase() || null)
  }, [])

  return [team, setTeam]
}

/**
 * Keep `?team=` agreeing with what was just picked.
 *
 * Without this the two sources of truth disagree the moment somebody arrives
 * through a link and then changes their mind: the picker would move the
 * highlight, and the next reload would silently put it back, because the link
 * wins on load. Rewriting the URL means a reload, a bookmark and a shared link
 * all say the same thing as the screen.
 *
 * `replaceState`, not `pushState` — changing your stall is a correction, not a
 * place in history to press Back to.
 */
function rewriteTeamParam(teamId: string | null): void {
  const url = new URL(window.location.href)
  if (teamId === null) url.searchParams.delete('team')
  else url.searchParams.set('team', teamId)
  window.history.replaceState(null, '', url)
}
