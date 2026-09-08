'use client'

import { nameOf } from '@/lib/team'
import type { MarketRow } from '@/lib/marketTypes'

/**
 * "Which stall are you?" — the one control on this wall.
 *
 * ── Why a picker exists at all ──
 *
 * The highlight was reachable only as `/flea?team=SLE-C407`, which is fine for a
 * link somebody sends you and useless on a phone in an apron pocket: it asks a
 * stallholder to type a URL with a team code in it, correctly, while serving
 * somebody. Nobody does that twice. The parameter still works and still wins —
 * this is the way in for everyone who did not arrive through a link.
 *
 * ── Why a select rather than a text field ──
 *
 * They asked to "enter my team id", and a field would honour that literally and
 * badly: `SLE-C407` is eight characters of exactly the kind that get mistyped,
 * and the failure is silent — a wrong-but-valid-looking code highlights nobody
 * and looks like the feature is broken. A stallholder knows their venture's
 * name, not its workbook code, so the list is by name and the code goes along
 * for the ride.
 *
 * ── Phone only ──
 *
 * `AGENTS.md` opens with "nobody interacts with it", and on the corridor TV that
 * still holds — this is hidden there. A screen bolted to a wall belongs to
 * nobody, so there is no stall for it to be.
 */
export function MarketPicker({
  rows,
  value,
  onChange,
}: {
  rows: readonly MarketRow[]
  value: string | null
  onChange: (teamId: string | null) => void
}) {
  if (rows.length === 0) return null

  const stalls = [...rows].sort((a, b) => nameOf(a).localeCompare(nameOf(b)))

  return (
    <label className="market-picker">
      <span className="market-label">Your stall</span>
      <select
        className="market-picker-select"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      >
        <option value="">Choose…</option>
        {stalls.map((row) => (
          <option key={row.teamId} value={row.teamId}>
            {nameOf(row)}
          </option>
        ))}
      </select>
    </label>
  )
}
