'use client'

import { useSyncExternalStore } from 'react'

import { Podium, type ListVariant } from '@/components/Podium'
import { PodiumMasthead } from '@/components/PodiumMasthead'
import { WATCH_RANKS_PODIUM } from '@/config'
import { competingTeams, rankTeams } from '@/lib/ranking'
import { useWallData, type BoardSpec } from '@/lib/useWallData'

/**
 * Slide 1 — the absolute leaderboard.
 *
 * A full-height masthead at the left and the board beside it. **No
 * `WallHeader`** — `/weekly` keeps the shared strip across the top, and this
 * slide replaced it with the spine. What the two boards must still share is the
 * data rather than the furniture: the same lockup, the same provenance stamp and
 * the same countdown brain all appear on both, arranged differently.
 *
 * The page has no padding of its own. The spine is full-bleed to three edges by
 * design, so the frame's margins belong to the board and are declared there.
 */
const BOARD: BoardSpec = {
  // The spares are filtered *here*, not in the component, so the detector and
  // the board rank the same list. Ranking all 42 while rendering 40 would let a
  // spare hold a rank the wall never shows, and every team below it would carry
  // a rank one lower than the board's — including the rank changes that fire an
  // overtake. `/weekly` composes its spec the same way, for the same reason.
  name: 'podium',
  rank: (teams) => rankTeams(competingTeams(teams)),
  earned: (team) => team.totalRevenue,
  watchTo: WATCH_RANKS_PODIUM,
}

/**
 * Which list treatment to draw, **in development only**.
 *
 *   ?list=stacked   the bar runs under each team's row
 *   (anything else) the bar is the row itself
 *
 * A temporary switch so two options can be looked at side by side on real data
 * before one is chosen; the loser and this hook are deleted together. The check
 * is `NODE_ENV`, inlined at build time, so a production build carries no trace
 * of it — the same rule `FleaStrip`'s clock skew follows, and for the same
 * reason: a wall launched with a leftover query param must not spend the cohort
 * rendering an option nobody picked.
 *
 * **Never read during render.** A `'use client'` component is still rendered on
 * the server, and touching `window` there throws: the first version of this
 * returned HTTP 500 for `/podium` and then recovered on hydration, so the page
 * looked perfectly correct in a browser while the server render failed on every
 * request — which is precisely the shape of bug this project exists to catch.
 *
 * `useSyncExternalStore` rather than an effect: it takes a server snapshot as a
 * separate argument, so the server and the first client render agree by
 * construction instead of by a state update afterwards. The subscribe callback
 * is a no-op because a query param cannot change without a reload.
 */
function useDevVariant(): ListVariant {
  return useSyncExternalStore(
    () => () => {},
    () =>
      process.env.NODE_ENV === 'development' &&
      new URLSearchParams(window.location.search).get('list') === 'stacked'
        ? 'stacked'
        : 'inline',
    () => 'inline',
  )
}

export default function PodiumPage() {
  const { snapshot } = useWallData(BOARD)
  const variant = useDevVariant()

  return (
    <main className="tv-frame" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
      <PodiumMasthead snapshot={snapshot} />
      <Podium
        ranked={rankTeams(competingTeams(snapshot?.teams ?? []))}
        variant={variant}
      />
    </main>
  )
}
