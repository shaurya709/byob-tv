'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { rankMarket } from '@/lib/marketRanking'
import { writeMarketTeam } from '@/lib/storage'
import { nameOf } from '@/lib/team'
import { useMarketData } from '@/lib/useMarketData'

/**
 * "Which stall are you?" — the way in for forty phones.
 *
 * ── Why this is a page and not a control on the board ──
 *
 * It started as a `<select>` in the board's footer, which was the wrong shape
 * twice over. A dropdown is a small target for a thumb that is also holding
 * something, and forty options hidden behind one tap is a worse way to find
 * your own venture than forty things you can see. And a control tucked under a
 * leaderboard is a control nobody finds — it was, in fact, not found.
 *
 * A page also gives the cohort one thing to be told — *open this and tap your
 * stall* — rather than a URL with a team code in it that has to be typed
 * correctly on a phone, once per stall, on the busiest day of the programme.
 *
 * ── It redirects rather than becoming the board ──
 *
 * Tapping a stall lands on `/flea?team=…`, so what a stallholder ends up
 * holding is a normal, shareable board URL that says which stall it is for. The
 * choice is remembered on the device too, so this is a one-time step rather
 * than a toll gate.
 */
export default function StallPage() {
  const { snapshot } = useMarketData()
  const router = useRouter()

  // Ranked rather than alphabetical: on flea day a stallholder is at least as
  // likely to know roughly where they stand as to scan for a letter, and it
  // makes the page worth reading on its own.
  const stalls = rankMarket(snapshot?.rows ?? [])

  const choose = (teamId: string) => {
    writeMarketTeam(teamId)
    router.push(`/flea?team=${teamId}`)
  }

  return (
    <main className="stall-frame">
      <header className="stall-head">
        <Image
          src="/brand/logo-pg-white.png"
          alt="Mesa School of Business"
          width={448}
          height={128}
          style={{ height: '22px', width: 'auto' }}
          unoptimized
        />
        <h1 className="stall-title">Which stall are you?</h1>
        <p className="stall-sub">Tap your venture to open your leaderboard.</p>
      </header>

      {/* Empty is a valid state here too. Before the tab carries anything there
          is nothing to choose, and a spinner would be a promise this wall does
          not make anywhere else. */}
      <div className="stall-list">
        {stalls.map((row) => (
          <button
            key={row.teamId}
            type="button"
            className="stall-option"
            onClick={() => choose(row.teamId)}
          >
            <span className="stall-option-name">{nameOf(row)}</span>
            <span className="stall-option-id">{row.teamId}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
