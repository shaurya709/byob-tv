// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { FleaDial } from '@/components/FleaDial'
import { Podium, podiumTeams } from '@/components/Podium'
import { VenturePill } from '@/components/VenturePill'
import { WeeklyLeaderboard, columnsOf } from '@/components/WeeklyLeaderboard'
import { HOT_TODAY_MIN } from '@/config'
import type { CountdownState } from '@/lib/countdown'
import { formatRupees, ordinal } from '@/lib/format'
import { timelineFor } from '@/lib/kickTimeline'
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

describe('FleaDial', () => {
  const state = (over: Partial<CountdownState>): CountdownState => ({
    display: '25',
    mode: 'days',
    numeric: 25,
    progress: 0.5,
    ...over,
  })

  it('puts the figure beside the ring in every mode, never inside it', () => {
    // The ring is a dial and nothing else. Every mode has identical structure,
    // so nothing relocates at a threshold the wall crosses at 3am unobserved.
    expect(render(<FleaDial state={state({})} />)).toContain('25 days')
    expect(
      render(<FleaDial state={state({ display: '9D 4H', mode: 'daysHours', numeric: 9 })} />),
    ).toContain('9D 4H')
    expect(
      render(<FleaDial state={state({ display: '04:12:33', mode: 'timer', numeric: 300 })} />),
    ).toContain('04:12:33')
    expect(
      render(<FleaDial state={state({ display: 'LIVE NOW', mode: 'live', numeric: null })} />),
    ).toContain('LIVE NOW')
  })

  it('names the countdown for a screen reader', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<FleaDial state={state({})} />))
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Time until Mesa Flea: 25 days',
    )
    act(() => root.unmount())
    host.remove()
  })

  it('draws the arc from the progress, and closes it entirely when live', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<FleaDial state={state({ progress: 0 })} />))
    const empty = host.querySelectorAll('circle')[1].getAttribute('stroke-dashoffset')
    act(() => root.render(<FleaDial state={state({ mode: 'live', display: 'LIVE NOW', progress: 1 })} />))
    const full = host.querySelectorAll('circle')[1].getAttribute('stroke-dashoffset')
    expect(Number(empty)).toBeCloseTo(2 * Math.PI * 19.5, 3)
    expect(Number(full)).toBeCloseTo(0, 6)
    act(() => root.unmount())
    host.remove()
  })
})

describe('Podium', () => {
  it('renders the top three with names, ranks and revenue', () => {
    const text = render(<Podium ranked={rankTeams(TRADING)} />)
    expect(text).toContain('Aurora Bakes')
    expect(text).toContain('Kite Coffee')
    expect(text).toContain('Solstice')
    expect(text).toContain(formatRupees(240_000))
    // The caption that separates this slide from `/weekly`. Without it the only
    // difference between the two boards is which numbers happen to be larger.
    expect(text.toLowerCase()).toContain('total revenue')
  })

  it('ranks 4-10 land in the strip, in order', () => {
    const all = teams().map((row, index) => ({ ...row, totalRevenue: 1_000 * (42 - index) }))
    const text = render(<Podium ranked={rankTeams(competingTeams(all))} />)
    expect(text).toContain('Venture 4')
    expect(text).toContain('Venture 10')
    // Rank 11 is off the board entirely — this is a top ten, not a leaderboard
    // that trails off.
    expect(text).not.toContain('Venture 11')
  })

  it('renders the waiting board when nobody has traded', () => {
    const text = render(<Podium ranked={rankTeams(teams())} />)
    // The structure still reads as "the leaderboard, waiting" — never a "no
    // data" message, which tells a passer-by the wall is broken. A dash rather
    // than ₹0: zero asserts the team traded and earned nothing.
    expect(text).toContain('—')
    expect(text).not.toContain(formatRupees(0))
    expect(text.toLowerCase()).not.toContain('no data')
  })

  it('renders three pillars with no feed at all', () => {
    const text = render(<Podium ranked={[]} />)
    // Three dashes, one per pillar. An empty first paint is a real state and
    // the podium holds its shape through it rather than assembling on screen.
    expect(text.match(/—/g)).toHaveLength(3)
  })

  it('carries none of the weekly board pill', () => {
    // `.tv-pill` is /weekly's language — forty rows that close around their own
    // mark during a kick. Borrowing it here made slide 1 look like a shorter
    // slide 2. This is the executable form of "do not borrow it back".
    const all = teams().map((row, index) => ({ ...row, totalRevenue: 1_000 * (42 - index) }))
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<Podium ranked={rankTeams(competingTeams(all))} />))
    expect(host.querySelectorAll('.tv-pill')).toHaveLength(0)
    expect(host.querySelectorAll('.tv-pod-shaft')).toHaveLength(3)
    // A capital and a base on each.
    expect(host.querySelectorAll('.tv-pod-slab')).toHaveLength(6)
    act(() => root.unmount())
    host.remove()
  })

  it('gives the three marks three different idle timelines', () => {
    // Never in lockstep. Assigning these by hashing the team id put all three
    // on the same timeline on the real feed — three ids into three buckets
    // collide about one time in nine even with a good hash, and this one is
    // worse than that. Place-based assignment cannot collide at all.
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<Podium ranked={rankTeams(TRADING)} />))
    const marks = [...host.querySelectorAll('[class*="tv-idle-"]')]
    expect(marks).toHaveLength(3)
    expect(new Set(marks.map((el) => el.className)).size).toBe(3)
    act(() => root.unmount())
    host.remove()
  })
})

describe('podiumTeams', () => {
  it('never shows more than ten', () => {
    const all = teams().map((row, index) => ({ ...row, totalRevenue: 1000 * (42 - index) }))
    expect(podiumTeams(rankTeams(all))).toHaveLength(10)
  })

  it('keeps the order it is handed', () => {
    // No filtering of its own — it ranks nothing and hides nobody, so the three
    // trading teams lead purely because the comparator put them there.
    expect(podiumTeams(rankTeams(TRADING)).slice(0, 3).map((row) => row.teamId)).toEqual([
      'SLE-C401',
      'SLE-C402',
      'SLE-C403',
    ])
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

  /**
   * The deadlock guard. `playing` is only ever cleared by `onSettled`; an
   * attacker row unmounting before its animation completes — rotation moving
   * on, or an animation that never started — would otherwise pin the queue
   * forever. The unmount cleanup must report the kick settled.
   */
  it('reports settled from unmount when the attacker row dies mid-kick', () => {
    let settles = 0
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() =>
      root.render(
        <VenturePill
          team={team({})}
          rank={8}
          cue={{ role: 'attacker', rows: -2, timeline: timelineFor(3) }}
          onSettled={() => settles++}
        />,
      ),
    )
    expect(settles).toBe(0)
    act(() => root.unmount())
    host.remove()
    expect(settles).toBe(1)
  })

  it('does not report settled from an unmounting row that was not the attacker', () => {
    let settles = 0
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() =>
      root.render(
        <VenturePill
          team={team({})}
          rank={5}
          cue={{ role: 'defender', rows: 0, timeline: timelineFor(3) }}
          onSettled={() => settles++}
        />,
      ),
    )
    act(() => root.unmount())
    host.remove()
    expect(settles).toBe(0)
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
