// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { Podium, visibleTeams } from '@/components/Podium'
import { VenturePill } from '@/components/VenturePill'
import { WeeklyLeaderboard, columnsOf } from '@/components/WeeklyLeaderboard'
import { HOT_TODAY_MIN } from '@/config'
import { formatRupees, ordinal } from '@/lib/format'
import { competingTeams, rankTeams } from '@/lib/ranking'
import { team, teams } from '@/test/fixtures'

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

describe('WeeklyLeaderboard', () => {
  it('puts all forty competing teams on screen at once', () => {
    const board = competingTeams(
      teams().map((row, index) => ({ ...row, weekRevenue: 1_000 * (42 - index) })),
    )
    const text = render(<WeeklyLeaderboard teams={board} />)
    expect(text).toContain('Venture 1')
    expect(text).toContain('Venture 40')
    // The spares are not on the board at all.
    expect(text).not.toContain('Venture 41')
  })

  /** Down then across: ranks 1-20 are one column, 21-40 the next. */
  it('splits the columns in reading order', () => {
    const board = competingTeams(
      teams().map((row, index) => ({ ...row, weekRevenue: 1_000 * (42 - index) })),
    )
    const [left, right] = columnsOf(board)
    expect(left).toHaveLength(20)
    expect(right).toHaveLength(20)
    expect(left[0].teamId).toBe('SLE-C401')
    expect(left[19].teamId).toBe('SLE-C420')
    expect(right[0].teamId).toBe('SLE-C421')
  })

  it('renders an empty board without inventing anything to put in it', () => {
    expect(render(<WeeklyLeaderboard teams={[]} />)).toBe('')
  })
})

describe('VenturePill', () => {
  /**
   * Forty rows of ₹0 every morning is noise, and the column exists to say who
   * is moving today. Silence is the honest answer for everyone else.
   */
  it('shows nothing rather than a zero for a team that has not sold today', () => {
    const text = render(<VenturePill team={team({ weekRevenue: 4_000, todayRevenue: 0 })} rank={7} />)
    expect(text).toContain(formatRupees(4_000))
    expect(text).not.toContain(formatRupees(0))
  })

  it('shows today once there is something to show', () => {
    const text = render(<VenturePill team={team({ todayRevenue: HOT_TODAY_MIN })} rank={7} />)
    expect(text).toContain(formatRupees(HOT_TODAY_MIN))
  })

  it('falls back to the team id for a venture with no name yet', () => {
    const text = render(<VenturePill team={team({ teamId: 'SLE-C418', ventureName: '' })} rank={9} />)
    expect(text).toContain('SLE-C418')
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

/**
 * The executable form of "the board does not move unless a rank changed".
 *
 * Motion's `layout` prop answers any change in a laid-out child with a shift
 * animation — including a team's week revenue ticking up by ₹200 without moving,
 * which happens on most polls. On a wall that reads as movement, and movement
 * here is supposed to mean something happened. The rule is that the board tree
 * carries no `layout` prop at all; the kick moves things explicitly instead.
 */
describe('silent reflow', () => {
  it('no component in the board tree uses Motion layout animation', () => {
    for (const file of ['VenturePill.tsx', 'WeeklyLeaderboard.tsx', 'Podium.tsx']) {
      const source = readFileSync(`${process.cwd()}/components/${file}`, 'utf8')
      expect(source, file).not.toMatch(/\blayout(Id)?\b\s*[=:]|\blayout\}/)
    }
  })
})
