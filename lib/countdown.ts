/**
 * The calendar countdown's one brain: time-to-Flea in, display state out.
 *
 * Every threshold transition lives here and nowhere else — the component that
 * draws the calendar never compares a timestamp. Pure of the clock: `now`
 * arrives as an argument (defaulting to the real clock only at the call site's
 * convenience), which is what makes the four modes testable without faking a
 * global.
 *
 * The escalation, from far out to done:
 *
 *   days       ≥15 days out          "25"        calendar days, counted in IST
 *   daysHours  <15 days, ≥24 hours   "6D 4H"     floored, like a clock reads
 *   timer      <24 hours, not yet    "04:12:33"  live seconds
 *   live       during the event      "LIVE NOW"
 *   hidden     after it ends         ""          the slot goes quiet for good
 *
 * The far mode counts *calendar days*, in the sheet's timezone, where the near
 * mode floors elapsed time like a clock. On 12 August the Flea is "25 days
 * away" at breakfast and at midnight — the number a person would say — whereas
 * a 24-hour-block count would tick from 26 to 25 at 10:00, an hour nobody can
 * name. IST and never the browser's locale, for the same reason as
 * lib/schedule.ts: a laptop still set to another timezone must not shift the
 * day boundary.
 */

import { DAYS_ONLY_FROM_MS, FLEA_EVENT_DURATION_MS, IST_TIMEZONE, TIMER_UNDER_MS } from '@/config'

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

export type CountdownMode = 'days' | 'daysHours' | 'timer' | 'live' | 'hidden'

export type CountdownState = {
  display: string
  mode: CountdownMode
  /** The headline figure: day count in the day modes, whole seconds left in
      timer mode, `null` where there is no number to speak of. */
  numeric: number | null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const IST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The instant's calendar date in IST, as a whole day number. en-CA formats as
    YYYY-MM-DD, so the parse cannot be fooled by locale ordering. */
function istDayNumber(ms: number): number {
  const [year, month, day] = IST_DATE.format(ms).split('-').map(Number)
  return Date.UTC(year, month - 1, day) / DAY_MS
}

export function computeCountdownState(
  fleaDatetime: number,
  now: number = Date.now(),
): CountdownState {
  if (now >= fleaDatetime + FLEA_EVENT_DURATION_MS) {
    return { display: '', mode: 'hidden', numeric: null }
  }
  if (now >= fleaDatetime) {
    return { display: 'LIVE NOW', mode: 'live', numeric: null }
  }

  const remaining = fleaDatetime - now
  if (remaining < TIMER_UNDER_MS) {
    const hours = Math.floor(remaining / HOUR_MS)
    const minutes = Math.floor((remaining % HOUR_MS) / 60_000)
    const seconds = Math.floor((remaining % 60_000) / 1000)
    return {
      display: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      mode: 'timer',
      numeric: Math.floor(remaining / 1000),
    }
  }

  const wholeDays = Math.floor(remaining / DAY_MS)
  if (remaining < DAYS_ONLY_FROM_MS) {
    const hours = Math.floor((remaining % DAY_MS) / HOUR_MS)
    return { display: `${wholeDays}D ${hours}H`, mode: 'daysHours', numeric: wholeDays }
  }

  const days = istDayNumber(fleaDatetime) - istDayNumber(now)
  return { display: String(days), mode: 'days', numeric: days }
}
