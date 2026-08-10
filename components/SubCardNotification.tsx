'use client'

import { motion } from 'motion/react'

import { VentureLogo } from '@/components/VentureLogo'
import { formatCount, formatRupees } from '@/lib/format'
import type { CardEvent, Team } from '@/lib/types'

/**
 * Ambient news, below the timer. One at a time, six seconds each.
 *
 * Compact by design — about a fifth of the frame. The timer stays the hero on
 * this slide; these are the things happening around it.
 */

function contextFor(event: CardEvent): string {
  switch (event.type) {
    case 'revenue':
      return `Crossed ${formatRupees(event.threshold)}`
    case 'streak':
      return `${event.days}-day selling streak`
    case 'title':
      if (event.title === 'biggestSaleToday') return 'Biggest sale today'
      if (event.title === 'mostUnitsToday') return 'Most units today'
      return 'Best single day of the programme'
  }
}

function valueFor(event: CardEvent): string | null {
  switch (event.type) {
    case 'revenue':
      return formatRupees(event.totalRevenue)
    case 'streak':
      return null
    case 'title':
      return event.title === 'mostUnitsToday'
        ? `${formatCount(event.value)} units`
        : formatRupees(event.value)
  }
}

export function SubCardNotification({ event, teams }: { event: CardEvent; teams: readonly Team[] }) {
  const team: Team = teams.find((row) => row.teamId === event.teamId) ?? {
    teamId: event.teamId,
    ventureName: event.ventureName,
    totalRevenue: 0,
    totalUnits: 0,
    streakDays: 0,
  }
  const value = valueFor(event)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className="tv-card-glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s-6)',
        padding: 'var(--s-5) var(--s-8)',
      }}
    >
      <VentureLogo team={team} size={72} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
        <span
          style={{
            font: 'var(--t-tv-card-context)',
            letterSpacing: 'var(--track-overline)',
            textTransform: 'uppercase',
            color: 'var(--fg3)',
          }}
        >
          {contextFor(event)}
        </span>
        <span style={{ font: 'var(--t-tv-card-name)' }}>{team.ventureName || team.teamId}</span>
      </div>
      {value !== null && (
        <span className="tv-figure" style={{ font: 'var(--t-tv-figure-2)' }}>
          {value}
        </span>
      )}
    </motion.div>
  )
}
