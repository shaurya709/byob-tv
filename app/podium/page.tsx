'use client'

import { AsOf } from '@/components/AsOf'
import { NewLeaderLabel, OvertakeSequence } from '@/components/OvertakeSequence'
import { Podium } from '@/components/Podium'
import { usePlayer } from '@/lib/usePlayer'
import { useWallData } from '@/lib/useWallData'
import { rankTeams } from '@/lib/triggers'
import type { OvertakeEvent } from '@/lib/types'

/**
 * Slide 1 — the leaderboard.
 *
 * This page owns exactly one queued event kind, `overtake`. Heroes and sub-cards
 * belong to `/countdown`, so the two pages never compete for the same event even
 * if the slideshow keeps both open as tabs.
 */

const KINDS = ['overtake'] as const

export default function PodiumPage() {
  const { snapshot, queueVersion } = useWallData()
  const mode = usePlayer(KINDS, queueVersion)

  const teams = snapshot?.teams ?? []
  const ranked = rankTeams(teams)

  const playing = mode.name === 'playing' ? (mode.event as OvertakeEvent) : null
  // The board recedes during the sequence and returns for the resolution beat,
  // which is when the new rank-1 tile is revealed underneath.
  const receding = playing !== null
  const justResolved = mode.name === 'gap' ? (mode.after as OvertakeEvent) : null

  return (
    <main className="tv-frame">
      <div
        style={{
          position: 'absolute',
          top: 'var(--s-5)',
          right: 'var(--s-8)',
          zIndex: 2,
        }}
      >
        <AsOf snapshot={snapshot} />
      </div>

      <div
        style={{
          height: '100%',
          filter: receding ? 'blur(6px)' : 'none',
          opacity: receding ? 0.3 : 1,
          transition: 'filter 0.4s var(--ease-out), opacity 0.4s var(--ease-out)',
        }}
      >
        <Podium ranked={ranked} />
      </div>

      {playing && <OvertakeSequence event={playing} teams={teams} />}
      {justResolved && (
        <NewLeaderLabel name={justResolved.ventureName || justResolved.teamId} />
      )}
    </main>
  )
}
