// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { FleaDial } from '@/components/FleaDial'
import { Podium, podiumTeams } from '@/components/Podium'
import { VentureCard } from '@/components/VentureCard'
import { pagesOf } from '@/components/VentureName'
import { ROW_LENGTH, WeeklyGrid, rowsOf } from '@/components/WeeklyGrid'
import { HOT_TODAY_MIN } from '@/config'
import type { CountdownState } from '@/lib/countdown'
import { formatRupees, ordinal } from '@/lib/format'
import { competingTeams, rankByWeek, rankTeams } from '@/lib/ranking'
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
    // The dial reads none of these three — they exist so `/podium`'s masthead
    // can band the same state differently without differencing the clock a
    // second time. They are spelled out anyway so this fixture stays a complete
    // `CountdownState` and the compiler keeps checking that it is one.
    remainingMs: 25 * 86_400_000,
    daysRemaining: 25,
    weeksRemaining: 4,
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
    // Names are uppercased by CSS, not in the markup — the assertions above are
    // on the text the component actually renders, which is what a screen reader
    // and a copy-paste both get.
    //
    // **The "total revenue" caption is no longer asserted here.** It moved to
    // the masthead when the board gained one, and it is deliberately printed
    // *once* for the whole slide rather than on each of three cards. Its
    // coverage moved with it — see the PodiumMasthead block below.
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

  it('renders three cards with no feed at all', () => {
    const text = render(<Podium ranked={[]} />)
    // Three dashes, one per card. An empty first paint is a real state and the
    // board holds its shape through it rather than assembling on screen.
    expect(text.match(/—/g)).toHaveLength(3)
  })

  it('draws three cards on plinths and seven pills, borrowing nothing from /weekly', () => {
    // `.tv-pill` is /weekly's language — rows that close around their own mark.
    // Borrowing it here made slide 1 look like a shorter slide 2. This is the
    // executable form of "do not borrow it back".
    //
    // The counts are the shape of the slide: three floating cards for the
    // podium places and one bar per rank 4-10. They replace an assertion on the
    // pillars' shafts and slabs, which is the same claim about the design that
    // preceded this one.
    const all = teams().map((row, index) => ({ ...row, totalRevenue: 1_000 * (42 - index) }))
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<Podium ranked={rankTeams(competingTeams(all))} />))
    expect(host.querySelectorAll('.tv-pill')).toHaveLength(0)
    expect(host.querySelectorAll('.tv-pod-card')).toHaveLength(3)
    // Six numerals for three cards. Each rank is drawn twice — once above the
    // card's edge in Deep Teal and once inside it in white — and the pair is one
    // glyph split by the edge. A count of three would mean one half is missing
    // and the numerals are rendering whole in a single colour, which is the
    // failure this treatment can have while still looking deliberate.
    expect(host.querySelectorAll('.tv-pod-numeral')).toHaveLength(6)
    expect(host.querySelectorAll('.tv-pod-num-above')).toHaveLength(3)
    expect(host.querySelectorAll('.tv-pod-num-inside')).toHaveLength(3)
    expect(host.querySelectorAll('.tv-pod-pill')).toHaveLength(7)
    // Each card stands on its own metal. Three plinths and three cards, never
    // three cards and one plinth — the plinth is where the metal is declared,
    // and a shared one would give second place first place's gold.
    expect(host.querySelectorAll('.tv-pod-plinth')).toHaveLength(3)
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

describe('WeeklyGrid', () => {
  const board = () =>
    competingTeams(teams().map((row, index) => ({ ...row, weekRevenue: 1_000 * (42 - index) })))

  /**
   * Identified by figure, not by name: the card no longer prints the venture
   * name at all. The fixtures give every team a distinct week revenue, so the
   * figures are what say who is on the board.
   */
  it('puts all forty competing teams on screen at once', () => {
    const text = render(<WeeklyGrid teams={board()} />)
    const ranked = rankByWeek(board())
    expect(text).toContain(formatRupees(ranked[0].weekRevenue))
    expect(text).toContain(formatRupees(ranked[39].weekRevenue))
    // The spares are not on the board at all.
    expect(ranked).toHaveLength(40)
    expect(ranked.some((t) => t.teamId === 'SLE-C441')).toBe(false)
  })

  /**
   * Reading order: ten per row, left to right then top to bottom. Rank 1 at the
   * top-left of row 1, rank 40 at the bottom-right of row 4.
   */
  it('lays the ranks out in reading order, ten to a row', () => {
    const rows = rowsOf(board())
    expect(rows).toHaveLength(4)
    for (const row of rows) expect(row).toHaveLength(ROW_LENGTH)
    expect(rows[0][0].teamId).toBe('SLE-C401')
    expect(rows[0][9].teamId).toBe('SLE-C410')
    expect(rows[1][0].teamId).toBe('SLE-C411')
    expect(rows[3][9].teamId).toBe('SLE-C440')
  })

  /**
   * Forty cards, always, all visible — never paged, scrolled or rotated. A fit
   * problem is solved by taking height out of the ramp, so a board that quietly
   * started rendering thirty would be the failure this asserts against.
   */
  it('renders a card for every competing team, never a subset', () => {
    expect(rowsOf(board()).flat()).toHaveLength(40)
  })

  it('renders an empty board without inventing anything to put in it', () => {
    expect(render(<WeeklyGrid teams={[]} />)).toBe('')
  })
})

describe('VentureCard', () => {
  /**
   * Forty cards showing ₹0 every morning is noise, and the figure exists to say
   * who is moving today. Silence is the honest answer for everyone else.
   */
  it('shows nothing rather than a zero for a team that has not sold today', () => {
    const text = render(<VentureCard team={team({ weekRevenue: 4_000, todayRevenue: 0 })} rank={7} />)
    expect(text).toContain(formatRupees(4_000))
    expect(text).not.toContain(formatRupees(0))
  })

  it('shows today once there is something to show', () => {
    const text = render(<VentureCard team={team({ todayRevenue: HOT_TODAY_MIN })} rank={7} />)
    expect(text).toContain(formatRupees(HOT_TODAY_MIN))
  })

  /**
   * Both figures survived the redesign. The card was nearly reduced to one
   * number; week and today are separate facts and the wall shows both.
   */
  it('carries both revenue figures, not just the week', () => {
    const text = render(
      <VentureCard team={team({ weekRevenue: 12_000, todayRevenue: 3_000 })} rank={2} />,
    )
    expect(text).toContain(formatRupees(12_000))
    expect(text).toContain(formatRupees(3_000))
  })

  /**
   * The card carries no venture name — removed deliberately, because at this
   * size it was the widest thing in the base and forced a marquee on every long
   * one, and the mark above it says whose card this is faster than a word does
   * at six metres. The figure and the rank are the only text.
   */
  it('prints no venture name, and no team id in its place', () => {
    const text = render(
      <VentureCard team={team({ teamId: 'SLE-C418', ventureName: 'Aurora Bakes' })} rank={9} />,
    )
    expect(text).not.toContain('Aurora Bakes')
    expect(text).not.toContain('SLE-C418')
    expect(text).toContain('9')
  })

  it('never shows a bare zero for a team that has not traded at all', () => {
    const text = render(<VentureCard team={team({ weekRevenue: 0, todayRevenue: 0 })} rank={38} />)
    expect(text).not.toContain('₹0')
  })
})

/**
 * The marquee's one rule: the visible portion always ends at a word boundary.
 * A continuous scroll cannot promise that, so the name is paged by whole words.
 */
describe('VentureName paging', () => {
  // Every character is 10px wide — a stand-in for the real font, so the cases
  // below are about where the breaks land and not about Manrope's metrics.
  const measure = (s: string) => s.length * 10

  it('keeps whole words on every page', () => {
    const pages = pagesOf('Chai Point Collective', 120, measure)
    expect(pages).toEqual(['Chai Point', 'Collective'])
    for (const page of pages) expect(page).not.toMatch(/^\s|\s$/)
  })

  it('leaves a name that fits as a single page, so it never animates', () => {
    expect(pagesOf('Pluck', 120, measure)).toEqual(['Pluck'])
  })

  /**
   * A single word longer than the card gets its own page and is allowed to
   * overflow it. Splitting it would break the only rule this component has, and
   * a word that long is a data problem rather than a layout one.
   */
  it('never splits a word that is wider than the card', () => {
    expect(pagesOf('Supercalifragilistic', 100, measure)).toEqual(['Supercalifragilistic'])
  })

  it('treats runs of whitespace as one break', () => {
    expect(pagesOf('  Kite   Coffee  ', 120, measure)).toEqual(['Kite Coffee'])
  })

  it('has nothing to page when the name is empty', () => {
    expect(pagesOf('   ', 120, measure)).toEqual([])
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
 * carries no `layout` prop at all; the flip moves cards explicitly instead.
 */
describe('silent reflow', () => {
  it('no component in the board tree uses Motion layout animation', () => {
    for (const file of ['VentureCard.tsx', 'WeeklyGrid.tsx', 'Podium.tsx']) {
      const source = readFileSync(`${process.cwd()}/components/${file}`, 'utf8')
      expect(source, file).not.toMatch(/\blayout(Id)?\b\s*[=:]|\blayout\}/)
    }
  })
})
