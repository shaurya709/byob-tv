// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { Countdown, stateFor } from '@/components/Countdown'
import { HeroNotification } from '@/components/HeroNotification'
import { Podium, visibleTeams } from '@/components/Podium'
import { SubCardNotification } from '@/components/SubCardNotification'
import { AWARE_AT_MS, FINAL_HOUR_AT_MS, URGENT_AT_MS } from '@/config'
import { formatRupees, ordinal } from '@/lib/format'
import { rankTeams } from '@/lib/triggers'
import { teams } from '@/test/fixtures'
import type { CardEvent, HeroEvent } from '@/lib/types'

/**
 * Smoke tests: every surface renders with mock data and puts the right words on
 * screen. Layout and colour are verified by measuring the running app at
 * 1920x1080 — a DOM assertion cannot tell you a row overflowed the frame.
 */

// React reads this global to decide whether `act` is legal. Cast rather than a
// `declare global`, which would leak the flag into the app's type surface.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function render(ui: React.ReactNode): string {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => root.render(ui))
  const html = host.textContent ?? ''
  act(() => root.unmount())
  host.remove()
  return html
}

const TRADING = teams([
  { teamId: 'SLE-C401', ventureName: 'Aurora Bakes', totalRevenue: 240_000, totalUnits: 571 },
  { teamId: 'SLE-C402', ventureName: 'Kite Coffee', totalRevenue: 228_200, totalUnits: 543 },
  { teamId: 'SLE-C403', ventureName: 'Solstice', totalRevenue: 216_400, totalUnits: 515 },
])

describe('Podium', () => {
  it('renders the top three with names, ranks and revenue', () => {
    const text = render(<Podium ranked={rankTeams(TRADING)} />)
    expect(text).toContain('Aurora Bakes')
    expect(text).toContain('Kite Coffee')
    expect(text).toContain('Solstice')
    expect(text).toContain('1ST')
    expect(text).toContain(formatRupees(240_000))
  })

  it('renders the waiting board when nobody has traded', () => {
    const text = render(<Podium ranked={rankTeams(teams())} />)
    // The structure still reads as "the leaderboard, waiting" — never a "no
    // data" message, which tells a passer-by the wall is broken.
    expect(text).toContain('1ST')
    expect(text).toContain(formatRupees(0))
    expect(text.toLowerCase()).not.toContain('no data')
  })
})

describe('visibleTeams', () => {
  it('shows only trading teams once anyone is trading', () => {
    expect(visibleTeams(rankTeams(TRADING)).map((team) => team.teamId)).toEqual([
      'SLE-C401',
      'SLE-C402',
      'SLE-C403',
    ])
  })

  it('shows the full structure before anyone trades', () => {
    expect(visibleTeams(rankTeams(teams()))).toHaveLength(10)
  })

  it('never shows more than ten', () => {
    const all = teams().map((team, index) => ({ ...team, totalRevenue: 1000 * (42 - index) }))
    expect(visibleTeams(rankTeams(all))).toHaveLength(10)
  })
})

describe('notifications', () => {
  it('renders a revenue hero as the team crossing, not as first in the cohort', () => {
    const event: HeroEvent = {
      id: 'rev:SLE-C401:200000',
      kind: 'hero',
      teamId: 'SLE-C401',
      ventureName: 'Aurora Bakes',
      type: 'revenue',
      threshold: 200_000,
      totalRevenue: 240_000,
    }
    const text = render(<HeroNotification event={event} teams={TRADING} />)
    expect(text).toContain('Aurora Bakes')
    expect(text).toContain(`Crossed ${formatRupees(200_000)}`)
    // "First to cross" would be false for every team after the first.
    expect(text).not.toContain('First to cross')
  })

  it('renders a weekly hero with its week and award', () => {
    const event: HeroEvent = {
      id: 'week:3:climb',
      kind: 'hero',
      teamId: 'SLE-C402',
      ventureName: 'Kite Coffee',
      type: 'weekly',
      week: 3,
      award: 'climb',
      value: 7,
    }
    const text = render(<HeroNotification event={event} teams={TRADING} />)
    expect(text).toContain('Week 3')
    expect(text).toContain('Biggest climb')
    expect(text).toContain('Up 7 places')
  })

  it('renders a title sub-card with units rather than rupees for most units', () => {
    const event: CardEvent = {
      id: 'title:mostUnitsToday',
      kind: 'card',
      teamId: 'SLE-C403',
      ventureName: 'Solstice',
      type: 'title',
      title: 'mostUnitsToday',
      value: 38,
    }
    const text = render(<SubCardNotification event={event} teams={TRADING} />)
    expect(text).toContain('Most units today')
    expect(text).toContain('38 units')
    expect(text).not.toContain('₹38')
  })
})

describe('Countdown', () => {
  it('renders without a clock mismatch on first paint', () => {
    expect(() => render(<Countdown />)).not.toThrow()
  })

  /** The brief left 24h-1h with no state; Urgent runs down to the final hour. */
  it('covers every gap between states', () => {
    expect(stateFor(AWARE_AT_MS + 1)).toBe('calm')
    expect(stateFor(AWARE_AT_MS - 1)).toBe('aware')
    expect(stateFor(URGENT_AT_MS - 1)).toBe('urgent')
    expect(stateFor(24 * 60 * 60 * 1000 - 1)).toBe('urgent')
    expect(stateFor(FINAL_HOUR_AT_MS - 1)).toBe('final')
    expect(stateFor(0)).toBe('past')
    expect(stateFor(-1)).toBe('past')
  })
})

describe('formatting', () => {
  it('groups rupees the Indian way', () => {
    expect(formatRupees(104_500)).toBe('₹1,04,500')
    expect(formatRupees(240_000)).toBe('₹2,40,000')
  })

  it('writes rank in words so a crop still ranks', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
    ])
  })
})
