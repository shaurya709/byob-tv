'use client'

import Image from 'next/image'
import { motion } from 'motion/react'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees, ordinal } from '@/lib/format'
import type { Team } from '@/lib/types'

/**
 * The leaderboard: top three across the frame, ranks 4–10 in a strip below.
 *
 * Rank is carried three ways at once — surface, size, and the position written
 * in words — so a phone photo of one corner still ranks, and greyscale
 * compression cannot take it away.
 */

/**
 * Who to show.
 *
 * Once anyone is trading, only teams with revenue appear: an empty tile beside
 * a real one reads as a team that failed rather than a team that has not
 * started. Before anyone is trading, the full structure shows at zero, because
 * "the leaderboard, waiting" is a truthful and useful state and a "no data"
 * message is not.
 */
export function visibleTeams(ranked: readonly Team[]): Team[] {
  const trading = ranked.filter((team) => team.totalRevenue > 0)
  return (trading.length > 0 ? trading : ranked).slice(0, 10)
}

function TeamName({ team }: { team: Team }) {
  return (
    <>
      <div style={{ font: 'var(--t-tv-name-1)' }}>{team.ventureName || team.teamId}</div>
      {team.ventureName !== '' && (
        <div style={{ font: 'var(--t-tv-teamid)', opacity: 0.7 }}>{team.teamId}</div>
      )}
    </>
  )
}

function FirstPlace({ team }: { team: Team }) {
  return (
    <motion.div
      layout="position"
      className="tv-panel-forest"
      style={{
        gridColumn: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-4)',
        padding: 'var(--s-8)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* The full lockup, not the mark alone, and top-left because that is where
          the system puts brand on a card. This is the most photographed element
          on the wall, and a crop of it lands in a WhatsApp thread with no page
          around it: the mark alone is a green blob to anyone outside Mesa.
          `alignSelf` is load-bearing — this is a flex column child, where the
          default `stretch` would resolve `width: auto` to the full card width
          and render the lockup at several times its aspect ratio. */}
      <Image
        src="/brand/logo-pg-white.png"
        alt="Mesa School of Business"
        width={148}
        height={52}
        style={{ height: '2.2vw', width: 'auto', alignSelf: 'flex-start', opacity: 0.95 }}
        unoptimized
      />
      <div style={{ font: 'var(--t-tv-rank)', letterSpacing: 'var(--track-overline)' }}>
        {ordinal(1).toUpperCase()}
      </div>
      <VentureLogo team={team} size={160} />
      <div style={{ textAlign: 'center' }}>
        <TeamName team={team} />
      </div>
      <div className="tv-figure" style={{ font: 'var(--t-tv-figure-1)' }}>
        {formatRupees(team.totalRevenue)}
      </div>
    </motion.div>
  )
}

function RunnerUp({ team, rank, column }: { team: Team; rank: number; column: number }) {
  return (
    <motion.div
      layout="position"
      className="tv-card-glass"
      style={{
        gridColumn: column,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-3)',
        padding: 'var(--s-6)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
      }}
    >
      <div
        style={{
          font: 'var(--t-tv-rank)',
          letterSpacing: 'var(--track-overline)',
          color: 'var(--fg3)',
        }}
      >
        {ordinal(rank).toUpperCase()}
      </div>
      <VentureLogo team={team} size={104} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ font: 'var(--t-tv-name-2)' }}>{team.ventureName || team.teamId}</div>
        {team.ventureName !== '' && (
          <div style={{ font: 'var(--t-tv-teamid)', color: 'var(--fg3)' }}>{team.teamId}</div>
        )}
      </div>
      <div className="tv-figure" style={{ font: 'var(--t-tv-figure-2)' }}>
        {formatRupees(team.totalRevenue)}
      </div>
    </motion.div>
  )
}

/**
 * Ranks 4–10.
 *
 * **Grid cells, not a `<table>`.** Motion's layout animation applies a
 * transform, and a `<tr>` ignores it — measured in the admin dashboard across 30
 * animation frames with the transform present and the row never moving. Grid
 * children are ordinary boxes and travel properly.
 *
 * No venture name at this size; it would not be legible from across a corridor,
 * and a name too small to read is worse than no name at all.
 */
function ChasingPack({ teams, fromRank }: { teams: readonly Team[]; fromRank: number }) {
  if (teams.length === 0) return null
  return (
    <div
      style={{
        display: 'grid',
        // `minmax(0, 1fr)`, not `1fr`. A bare `1fr` is `minmax(auto, 1fr)`, so a
        // cell cannot shrink below its content and the row silently overflows
        // the frame instead of dividing it. Measured before this: seven tiles
        // wanted 2126px inside 1792px, and rank 10 sat entirely off-screen at
        // x=1909 with `overflow: hidden` hiding any sign of it.
        gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))`,
        gap: 'var(--s-2)',
      }}
    >
      {teams.map((team, index) => (
        <motion.div
          key={team.teamId}
          layout="position"
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="tv-card-plain"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--s-2)',
            padding: 'var(--s-3) var(--s-2)',
            minWidth: 0,
          }}
        >
          <span style={{ font: 'var(--t-tv-teamid)', color: 'var(--fg3)' }}>
            {ordinal(fromRank + index)}
          </span>
          <VentureLogo team={team} size={36} />
          <span className="tv-figure" style={{ font: 'var(--t-tv-figure-3)' }}>
            {formatRupees(team.totalRevenue)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

export function Podium({ ranked }: { ranked: readonly Team[] }) {
  const visible = visibleTeams(ranked)
  const [first, second, third, ...pack] = visible

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-10)',
        height: '100%',
        justifyContent: 'center',
        padding: 'var(--s-12) var(--s-16)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.35fr 1fr',
          gap: 'var(--s-6)',
          alignItems: 'stretch',
        }}
      >
        {second && <RunnerUp team={second} rank={2} column={1} />}
        {first && <FirstPlace team={first} />}
        {third && <RunnerUp team={third} rank={3} column={3} />}
      </div>
      <ChasingPack teams={pack} fromRank={4} />
    </div>
  )
}
