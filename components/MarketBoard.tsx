'use client'

import { MARKET_TOP_N } from '@/config'
import { formatCount, formatRupees } from '@/lib/format'
import { gapToLastPlace, rankMarket, slotsOf } from '@/lib/marketRanking'
import type { MarketRow, MarketSnapshot } from '@/lib/marketTypes'
import { nameOf } from '@/lib/team'
import { VentureLogo } from '@/components/VentureLogo'

/**
 * Twenty places, two columns of ten.
 *
 * ── Always twenty rows ──
 *
 * A rank nobody has reached is an empty slot, not a shorter board. That costs a
 * lot of white space through the morning — on the 29 August sample only three
 * stalls had traded by 11:20 — and buys two things worth more. The ranking says
 * what it means: fourteenth of twenty places, not fourteenth of the fourteen
 * stalls that happen to have sold. And the layout never moves, on a wall whose
 * whole grammar is that movement means something happened; rows arriving and
 * pushing everything below them down would read as forty small events.
 *
 * ── No `layout` prop anywhere in this tree ──
 *
 * A stall's takings ticking up without changing its place changes the sort
 * input, and Motion's layout animation would answer that with a small shift on
 * every poll. This board does not animate rank changes at all in v1 — see
 * `lib/useMarketData.ts` for why — so nothing here should move on its own.
 */

/** `20 SALES`, or `1 SALE` — a count of one should not read as a plural. */
function sales(row: MarketRow): string {
  return `${formatCount(row.txns)} ${row.txns === 1 ? 'SALE' : 'SALES'}`
}

/** The metal a rank is written in, or the board's own ink below the podium. */
function rankInk(rank: number): string {
  if (rank === 1) return 'var(--metal-gold)'
  if (rank === 2) return 'var(--metal-silver)'
  if (rank === 3) return 'var(--metal-bronze)'
  return 'inherit'
}

function Row({ rank, row, you }: { rank: number; row: MarketRow | null; you: boolean }) {
  if (row === null) {
    return (
      <div className="market-row market-row-empty" data-rank={rank}>
        <span className="market-rank">{rank}</span>
      </div>
    )
  }

  const lead = rank <= 3
  const cls = you ? 'market-row-you' : lead ? 'market-row-lead' : 'market-row-quiet'

  return (
    <div className={`market-row ${cls}`} data-rank={rank} data-team={row.teamId}>
      <span className="market-rank" style={{ color: you ? 'inherit' : rankInk(rank) }}>
        {rank}
      </span>
      <span className="market-logo">
        <VentureLogo team={row} size="100%" />
      </span>
      <span className="market-body">
        <span className="market-name-row">
          {/* `nameOf` falls back to the team code, so a stall whose name has not
              been typed into the tab is celebrated by code rather than not at
              all. */}
          <span className="market-name">{nameOf(row)}</span>
          {you && <span className="market-you-chip">YOU</span>}
        </span>
        <span className="market-meta market-id">
          {row.teamId}
          <span className="market-meta-sales"> &middot; {sales(row)}</span>
        </span>
      </span>
      <span className="market-sales market-sub">{sales(row)}</span>
      <span className="market-fig">{formatRupees(row.takings)}</span>
    </div>
  )
}

/**
 * The stall the viewer came for, when it is not on the board.
 *
 * ── A rank built on nothing is not shown ──
 *
 * At the opening bell every stall is on ₹0, and on the 29 August sample
 * seventeen of forty were still there at a quarter to seven. Their "rank" is a
 * tie-break among seventeen zeroes: a precise-looking number that describes no
 * standing at all. So a stall that has taken nothing is told that, and told what
 * would change it. The board itself keeps its numerals — a place on a board is a
 * position in a frame, which is a different claim from *your* rank.
 *
 * This is the same reasoning `lib/climber.ts` uses for leaving `prevWeekRank`
 * undefined at zero: a team with no standing to improve on did not improve on it.
 */
function Pinned({ row, rank, gap }: { row: MarketRow; rank: number; gap: number | null }) {
  return (
    <div className="market-pinned">
      <div className="market-label">Your stall</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-3)',
          marginTop: 'var(--s-3)',
        }}
      >
        {row.takings > 0 && <span className="market-rank">{rank}</span>}
        <span className="market-logo" style={{ height: '38px' }}>
          <VentureLogo team={row} size="100%" />
        </span>
        <span style={{ flexGrow: 1, minWidth: 0 }}>
          <span className="market-name" style={{ display: 'block' }}>
            {nameOf(row)}
          </span>
          <span className="market-sub" style={{ color: 'var(--bright-green)' }}>
            {row.takings > 0 ? sales(row) : 'NO SALES YET'}
          </span>
        </span>
        {row.takings > 0 && <span className="market-fig">{formatRupees(row.takings)}</span>}
      </div>
      <div
        style={{
          borderTop: '1px solid var(--surface-glass-strong)',
          marginTop: 'var(--s-3)',
          paddingTop: 'var(--s-3)',
        }}
      >
        <span className="market-label" style={{ color: 'var(--green-200)' }}>
          {row.takings === 0
            ? 'One sale puts you on the board'
            : gap === null
              ? 'On the board'
              : `${formatRupees(gap)} behind ${MARKET_TOP_N}th place`}
        </span>
      </div>
    </div>
  )
}

export function MarketBoard({
  snapshot,
  highlight,
}: {
  snapshot: MarketSnapshot | null
  highlight: string | null
}) {
  const ranked = rankMarket(snapshot?.rows ?? [])
  const slots = slotsOf(ranked, MARKET_TOP_N)

  const mineIndex = highlight === null ? -1 : ranked.findIndex((row) => row.teamId === highlight)
  const onBoard = mineIndex > -1 && mineIndex < MARKET_TOP_N
  const mine = mineIndex > -1 ? ranked[mineIndex] : undefined

  return (
    <>
      <div className="market-board">
        <div className="market-column">
          {slots.slice(0, MARKET_TOP_N / 2).map((row, index) => (
            <Row
              key={index}
              rank={index + 1}
              row={row}
              you={onBoard && row?.teamId === highlight}
            />
          ))}
        </div>
        <div className="market-column">
          {slots.slice(MARKET_TOP_N / 2).map((row, index) => (
            <Row
              key={index}
              rank={index + 1 + MARKET_TOP_N / 2}
              row={row}
              you={onBoard && row?.teamId === highlight}
            />
          ))}
        </div>
      </div>

      {mine !== undefined && !onBoard && (
        <Pinned
          row={mine}
          rank={mineIndex + 1}
          gap={gapToLastPlace(ranked, MARKET_TOP_N, mine.teamId)}
        />
      )}
    </>
  )
}
