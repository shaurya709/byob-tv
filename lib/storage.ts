import { QUEUE_CAP } from '@/config'
import type { CsvCache, Ledger, PendingKind, WallEvent } from '@/lib/types'

/**
 * The only module in the project that touches localStorage.
 *
 * ── Three keys, not one ──
 *
 * They have three different write patterns and merging them would make each
 * one worse. The ledger is grow-only and merged on write; `pending` is
 * destructively drained; `csv` is blindly overwritten every 60 seconds. Folding
 * the cache into the ledger would rewrite the ledger 1,440 times a day and
 * multiply the window for a cross-tab clobber by sixty, for no benefit.
 *
 * ── Version lives in the key name ──
 *
 * A version bump makes the old key simply *absent*, which routes into the seed
 * branch the code already has to support for a brand-new TV. Putting a version
 * inside the value would need a migration branch at read time — a second read
 * path, for a store whose entire contents can be rebuilt from the sheet.
 */

const PREFIX = 'byob-tv.v1'

export const KEYS = {
  ledger: `${PREFIX}.ledger`,
  pending: `${PREFIX}.pending`,
  csv: `${PREFIX}.csv`,
} as const

/**
 * Returns `null` for absent, unparseable **and** wrong-shaped.
 *
 * All three route into the same seed branch, and no repair code exists. The
 * direction of failure is the point: a corrupt ledger read as "empty, but
 * replay everything" would fire hundreds of hero animations in one tick, in
 * public. Re-seeding fails quiet.
 */
function readJson<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(key)
  } catch {
    // Storage disabled entirely (private mode, blocked cookies). Treat as absent.
    return null
  }
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error(`[tv] ${key} was not valid JSON; re-seeding from the sheet.`)
    return null
  }
  if (!isValid(parsed)) {
    console.error(`[tv] ${key} had an unexpected shape; re-seeding from the sheet.`)
    return null
  }
  return parsed
}

/** Deliberately does not catch. A failed write is a real fault and belongs in the console. */
function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function isLedger(value: unknown): value is Ledger {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<Ledger>
  return (
    Array.isArray(candidate.fired) &&
    candidate.fired.every((id) => typeof id === 'string') &&
    typeof candidate.holders === 'object' &&
    candidate.holders !== null
  )
}

function isEventArray(value: unknown): value is WallEvent[] {
  return (
    Array.isArray(value) &&
    value.every(
      (event) =>
        typeof event === 'object' &&
        event !== null &&
        typeof (event as WallEvent).id === 'string' &&
        typeof (event as WallEvent).kind === 'string',
    )
  )
}

function isCsvCache(value: unknown): value is CsvCache {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<CsvCache>
  return typeof candidate.feedCsv === 'string' && typeof candidate.cohortCsv === 'string'
}

export function readLedger(): Ledger | null {
  return readJson(KEYS.ledger, isLedger)
}

/**
 * Merge-on-write: re-read immediately before writing and union the fired sets.
 *
 * If the slideshow keeps both pages open in tabs, two renderers each run a
 * read-compute-write cycle on this key. Because `fired` only ever grows, the
 * union is the same under any interleaving — no lock, no `storage` event, no
 * `BroadcastChannel`. Each of those would be a second delivery path for
 * information the sheet already carries.
 *
 * `holders` is small and last-write-wins, which is correct: both tabs are
 * reading the same ~5-minute-cached CSV, so they agree on who holds what.
 */
export function writeLedger(next: Ledger): void {
  const current = readLedger()
  const fired = current ? Array.from(new Set([...current.fired, ...next.fired])) : [...next.fired]
  fired.sort()
  writeJson(KEYS.ledger, { fired, holders: next.holders })
}

function readPending(): WallEvent[] {
  return readJson(KEYS.pending, isEventArray) ?? []
}

/**
 * Replace-by-id, else append, then cap per kind keeping the newest.
 *
 * The id *is* the staleness policy. `rev:SLE-C407:100000` is unique forever, so
 * milestones accumulate. `title:biggestSaleToday` and `overtake:rank1` are
 * constant, so a newer holder overwrites an older one — a card announcing a
 * title its team no longer holds would be a lie on screen, and latest-wins is
 * the only truthful policy. It costs no extra code here because it falls out of
 * the same single rule.
 */
export function enqueue(events: readonly WallEvent[]): void {
  if (events.length === 0) return

  const queue = readPending()
  for (const event of events) {
    const at = queue.findIndex((queued) => queued.id === event.id)
    if (at === -1) queue.push(event)
    else queue[at] = event
  }

  // Cap each kind independently at the newest QUEUE_CAP, then write back in
  // arrival order — grouping by kind is only how they get counted.
  const keep = new Set<WallEvent>()
  for (const kind of ['hero', 'card', 'overtake'] as const) {
    for (const event of queue.filter((queued) => queued.kind === kind).slice(-QUEUE_CAP)) {
      keep.add(event)
    }
  }
  writeJson(
    KEYS.pending,
    queue.filter((event) => keep.has(event)),
  )
}

/**
 * Removes and returns every queued event of the given kinds.
 *
 * Only `/countdown` ever takes `hero` and `card`; only `/podium` ever takes
 * `overtake`. Two tabs therefore never compete for the same event, and this is
 * also merge-on-write so a concurrent enqueue survives.
 *
 * Taken means **consumed**, not "about to play". If the slideshow rotates away
 * one second into an eight-second hero, that event is gone. The alternative —
 * dequeue on animation-end — livelocks: give `/countdown` less time than one
 * hero and the same hero replays every rotation forever while everything behind
 * it starves.
 */
export function takePending(kinds: readonly PendingKind[]): WallEvent[] {
  const queue = readPending()
  const taken = queue.filter((event) => kinds.includes(event.kind))
  if (taken.length === 0) return []
  writeJson(
    KEYS.pending,
    queue.filter((event) => !kinds.includes(event.kind)),
  )
  return taken
}

export function readCsvCache(): CsvCache | null {
  return readJson(KEYS.csv, isCsvCache)
}

export function writeCsvCache(cache: CsvCache): void {
  writeJson(KEYS.csv, cache)
}
