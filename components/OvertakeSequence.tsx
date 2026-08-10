'use client'

import { motion } from 'motion/react'

import { VentureLogo } from '@/components/VentureLogo'
import type { OvertakeEvent, Team } from '@/lib/types'

/**
 * Rank 1 changing hands. The signature moment of the wall.
 *
 * Five beats, 2.4 seconds total, and it must not grow past three — a long
 * animation blocks the wall from returning to its job, and this fires when
 * something genuinely happened rather than on a loop.
 *
 *   0.0s  the board recedes      blur and dim, handled by the page
 *   0.4s  the heroes enter       attacker from the left, defender from the right
 *   0.9s  the wind-up            both on screen, the headline lands
 *   1.3s  the kick               attacker winds back and strikes; defender slides out
 *   1.9s  the resolution         heroes fade, the board returns
 *
 * **Every beat is a declarative `delay`, not a chain of timers.** The component
 * can be unmounted mid-sequence when the slideshow rotates away, and a chain of
 * `setTimeout`s would need teardown at five points to avoid firing into a
 * dead component. There is nothing to clean up here.
 *
 * ── On the motion vocabulary ──
 *
 * Springs, a strike and a rotating exit all contradict the Mesa system's
 * animation rule ("subtle, confident, slow — no bounces, no elastic springs, no
 * spinning"). That rule was written for marketing assets, and this is a live
 * scoreboard; the deviation is deliberate and was taken by the user. The tone
 * is a goal celebration, not a brawl: the defender moves aside, it is not
 * destroyed.
 */

const ENTER = 0.4
const WIND_UP = 0.9
const KICK = 1.3
const RESOLVE = 1.9

/** The defender may have fallen out of the visible feed; the event carries enough to draw it. */
function resolveTeam(teams: readonly Team[], teamId: string, ventureName: string): Team {
  return (
    teams.find((team) => team.teamId === teamId) ?? {
      teamId,
      ventureName,
      totalRevenue: 0,
      totalUnits: 0,
      streakDays: 0,
    }
  )
}

function Hero({
  team,
  label,
  from,
  children,
}: {
  team: Team
  label: string
  from: number
  children?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ x: from, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: ENTER, type: 'spring', stiffness: 120, damping: 14 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--s-4)',
      }}
    >
      <div
        style={{
          font: 'var(--t-tv-card-context)',
          letterSpacing: 'var(--track-overline)',
          color: 'var(--fg3)',
        }}
      >
        {label}
      </div>
      {children}
      <div style={{ font: 'var(--t-tv-name-1)', textAlign: 'center' }}>
        {team.ventureName || team.teamId}
      </div>
    </motion.div>
  )
}

export function OvertakeSequence({
  event,
  teams,
}: {
  event: OvertakeEvent
  teams: readonly Team[]
}) {
  const attacker = resolveTeam(teams, event.teamId, event.ventureName)
  const defender = resolveTeam(teams, event.fromTeamId, event.fromVentureName)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--s-8)',
      }}
    >
      {/* A white scrim over the receded board.
          Blur and dim alone were not enough: first place is a full-bleed Deep
          Forest Green card, and at 30% it still read through the middle of the
          frame as a dark slab behind the two heroes. The scrim is the same page
          surface, so the sequence lands on the page rather than on a ghost of
          the leaderboard. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg)',
          opacity: 0.72,
        }}
      />

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: RESOLVE, duration: 0.5 }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          // Pushed out to roughly the outer thirds. At a tighter gap the two
          // ventures read as one clustered group rather than as two sides of a
          // contest, which is the whole point of the beat.
          justifyContent: 'space-between',
          width: '68%',
        }}
      >
        <Hero team={attacker} label="Now leading" from={-320}>
          {/* Wind back, then strike. A small quick motion — the kick is a
              celebration, and a punt would read as aggression toward a team
              that is also in the room. */}
          <motion.div
            animate={{ x: [0, -28, 44, 0] }}
            transition={{ delay: KICK, duration: 0.6, times: [0, 0.35, 0.6, 1], ease: 'easeOut' }}
          >
            <VentureLogo team={attacker} size={180} />
          </motion.div>
        </Hero>

        <Hero team={defender} label="Was leading" from={320}>
          {/* Struck on impact, so the exit begins partway through the kick
              rather than at its end. Rotating and fading as it slides aside. */}
          <motion.div
            animate={{ x: 900, rotate: 42, opacity: 0 }}
            transition={{ delay: KICK + 0.3, duration: 0.45, ease: 'easeIn' }}
          >
            <VentureLogo team={defender} size={180} />
          </motion.div>
        </Hero>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: [0, 1, 1, 0], y: 0 }}
        transition={{
          delay: WIND_UP,
          duration: 1.5,
          times: [0, 0.27, 0.67, 1],
          ease: 'easeOut',
        }}
        style={{
          position: 'relative',
          font: 'var(--t-tv-hero-headline)',
          textAlign: 'center',
          maxWidth: '86%',
        }}
      >
        {attacker.ventureName || attacker.teamId} overtakes{' '}
        {defender.ventureName || defender.teamId}
      </motion.div>
    </div>
  )
}

/** The 3-second "New leader" label that follows the sequence, below the restored board. */
export function NewLeaderLabel({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3.6, times: [0, 0.1, 0.85, 1] }}
      style={{
        position: 'absolute',
        bottom: 'var(--s-8)',
        left: 0,
        right: 0,
        textAlign: 'center',
        font: 'var(--t-tv-card-name)',
        color: 'var(--fg2)',
      }}
    >
      New leader: {name}
    </motion.div>
  )
}
