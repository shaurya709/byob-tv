/**
 * How long the market has left, as `HH:MM:SS`. One pure function.
 *
 * ── Why this is not `computeCountdownState` ──
 *
 * That module answers *how far away is the Flea*, and it is right for the dial
 * in the corner of the other two boards. This answers *how long until the market
 * closes*, which is a different question with different edges, and pointing the
 * first at `window_end_iso` produces a real bug rather than an awkward fit:
 * its `hidden` band needs `now >= target + FLEA_EVENT_DURATION_MS`, so a board
 * counting to the close would go on saying **LIVE NOW for twelve hours after the
 * market shut**. It would also make `FLEA_EVENT_DURATION_MS` mean "after the
 * start" in one caller and "after the end" in another, which is the two-meanings
 * bug class this project keeps recording.
 *
 * Its other bands are dead weight here too: `days` and `daysHours` cannot be
 * reached inside a twelve-hour window, and `progress` is measured against the
 * programme anchor, which this board has no use for.
 *
 * ── The clock is a parameter ──
 *
 * `now` is always passed; there is no `Date.now()` default. That keeps the
 * module pure, lets every boundary be tested rather than waited for, and is what
 * makes the dev `?now=` skew work at all.
 *
 * ── Absolute instants in, so no timezone arithmetic here ──
 *
 * Both bounds arrive as epoch milliseconds parsed from `window_start_iso` /
 * `window_end_iso`, which carry `+05:30`. Differencing two absolute instants is
 * correct on a laptop set to any timezone — the same reason `lib/challenge.ts`
 * needs none either.
 */

export type MarketPhase = 'before' | 'open' | 'closed'

export type MarketClock = {
  phase: MarketPhase
  /**
   * Zero-padded `HH:MM:SS`, or `''` once there is nothing left to count.
   *
   * Hours are **not** wrapped at 24. A board loaded a week early would read
   * `168:00:00` rather than `00:00:00`, which is ugly and true; the alternative
   * is a countdown that silently repeats itself once a day.
   */
  display: string
  /** `Opens in` / `Closes in` / `Closed`, so the component never branches on phase. */
  label: string
  remainingMs: number
}

const CLOSED: MarketClock = { phase: 'closed', display: '', label: 'Closed', remainingMs: 0 }

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * `HH:MM:SS` from a positive duration.
 *
 * `floor`, not `ceil`, matching the existing timer band: the last second of the
 * market reads `00:00:00` for one second before the phase turns, rather than the
 * clock showing `00:00:01` at an instant that has already passed.
 */
function hms(remainingMs: number): string {
  const total = Math.floor(remainingMs / 1000)
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
}

/**
 * `{ phase, display, label, remainingMs }` for the market window.
 *
 * **Both edges are inclusive at the open and exclusive at the close**: the
 * instant the doors open the phase is `open` and the display reads the full
 * window; the instant they shut it is `closed` and the display is empty. A board
 * still counting at 21:00:00 would be counting to a moment that has arrived.
 *
 * A window the sheet cannot describe — a missing bound, an end at or before its
 * start — returns `closed` with an empty display. Saying nothing is the
 * convention this wall already follows for a figure it cannot stand behind; a
 * guessed countdown is worse than none.
 */
export function marketClock(opensAt: number, closesAt: number, now: number): MarketClock {
  if (!Number.isFinite(opensAt) || !Number.isFinite(closesAt) || closesAt <= opensAt) return CLOSED
  if (now >= closesAt) return CLOSED

  if (now < opensAt) {
    const remainingMs = opensAt - now
    return { phase: 'before', display: hms(remainingMs), label: 'Opens in', remainingMs }
  }

  const remainingMs = closesAt - now
  return { phase: 'open', display: hms(remainingMs), label: 'Closes in', remainingMs }
}
