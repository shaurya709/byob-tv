'use client'

import { AnimatePresence, motion } from 'motion/react'

import { AsOf } from '@/components/AsOf'
import { Countdown } from '@/components/Countdown'
import { HeroNotification } from '@/components/HeroNotification'
import { MicrosecondTicker } from '@/components/MicrosecondTicker'
import { SubCardNotification } from '@/components/SubCardNotification'
import { usePlayer } from '@/lib/usePlayer'
import { useWallData } from '@/lib/useWallData'
import type { CardEvent, HeroEvent } from '@/lib/types'

/**
 * Slide 2 — the Mesa Flea countdown.
 *
 * The timer, notifications, the microsecond ticker and the as-of stamp. Nothing
 * else: no cohort stats, no filler under the timer. When nothing is queued the
 * sub-card slot is **empty**, and that is the point — the wall being quiet most
 * of the time is what makes it loud when something happens.
 *
 * This page owns `hero` and `card`. The overtake belongs to `/podium`.
 */

const KINDS = ['hero', 'card'] as const

export default function CountdownPage() {
  const { snapshot, queueVersion } = useWallData()
  const mode = usePlayer(KINDS, queueVersion)

  const teams = snapshot?.teams ?? []
  const playing = mode.name === 'playing' ? mode.event : null
  const hero = playing?.kind === 'hero' ? (playing as HeroEvent) : null
  const card = playing?.kind === 'card' ? (playing as CardEvent) : null

  return (
    <main
      className="tv-frame"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 'var(--s-5)',
          left: 'var(--s-8)',
          right: 'var(--s-8)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <MicrosecondTicker />
        <AsOf snapshot={snapshot} />
      </div>

      {/* The timer collapses out under a hero takeover and returns to whatever
          state it was in. Its state is derived from the clock, not held here, so
          there is nothing to restore. */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <AnimatePresence mode="wait">
          {hero ? (
            <HeroNotification key={hero.id} event={hero} teams={teams} />
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <Countdown />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roughly a fifth of the frame, reserved so the timer does not jump when a
          card enters or leaves. Empty is the resting state. */}
      <div
        style={{
          height: '20vh',
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingBottom: 'var(--s-10)',
        }}
      >
        <AnimatePresence>
          {card && <SubCardNotification key={card.id} event={card} teams={teams} />}
        </AnimatePresence>
      </div>
    </main>
  )
}
