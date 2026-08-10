'use client'

import { motion } from 'motion/react'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import type { HeroEvent, Team } from '@/lib/types'

/**
 * A milestone that earns the whole frame. The timer collapses out, this holds
 * for eight seconds, the timer returns.
 *
 * ── On the copy ──
 *
 * The brief names triggers 1–4 "First team to cross ₹X", but also specifies that
 * each fires **once per team, ever** — so it is the team's first crossing, not
 * the cohort's. Headlining it "First to cross ₹2,00,000" would be a plain lie on
 * the wall for every team after the first, in front of the teams who know they
 * were not first. It reads "Crossed ₹2,00,000".
 */

function headlineFor(event: HeroEvent): string {
  switch (event.type) {
    case 'revenue':
      return `Crossed ${formatRupees(event.threshold)}`
    case 'streak':
      return `${event.days} days of sales, unbroken`
    case 'weekly':
      if (event.award === 'revenue') return `Biggest week`
      if (event.award === 'climb') return `Biggest climb`
      return `Most improved`
  }
}

function valueFor(event: HeroEvent): string | null {
  switch (event.type) {
    case 'revenue':
      return formatRupees(event.totalRevenue)
    case 'streak':
      return null
    case 'weekly':
      if (event.award === 'climb') {
        return `Up ${event.value} ${event.value === 1 ? 'place' : 'places'}`
      }
      return formatRupees(event.value)
  }
}

function kickerFor(event: HeroEvent): string {
  return event.type === 'weekly' ? `Week ${event.week}` : 'Milestone'
}

export function HeroNotification({ event, teams }: { event: HeroEvent; teams: readonly Team[] }) {
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
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--s-5)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          font: 'var(--t-tv-card-context)',
          letterSpacing: 'var(--track-overline)',
          textTransform: 'uppercase',
          color: 'var(--tangerine-600)',
        }}
      >
        {kickerFor(event)}
      </div>

      <VentureLogo team={team} size={200} />

      <div style={{ font: 'var(--t-tv-name-1)' }}>{team.ventureName || team.teamId}</div>

      <div style={{ font: 'var(--t-tv-hero-headline)' }}>{headlineFor(event)}</div>

      {value !== null && (
        <div className="tv-figure" style={{ font: 'var(--t-tv-hero-value)', color: 'var(--fg2)' }}>
          {value}
        </div>
      )}
    </motion.div>
  )
}
