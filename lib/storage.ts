import type { CsvCache } from '@/lib/types'

/**
 * The only module in the project that touches localStorage.
 *
 * ── One key per write pattern ──
 *
 * Only the CSV cache survives the v2 pivot; it is blindly overwritten every 60
 * seconds. The rank state and the animation queue land here again in session 2
 * with their own keys, because their write patterns differ from this one and
 * from each other — merging them would rewrite the whole store 1,440 times a
 * day and multiply the window for a cross-tab clobber by sixty, for nothing.
 *
 * ── Version lives in the key name ──
 *
 * A version bump makes the old key simply *absent*, which routes into the branch
 * the code already has to support for a brand-new TV. Putting a version inside
 * the value would need a migration branch at read time — a second read path, for
 * a store whose entire contents can be rebuilt from the sheet.
 *
 * Bumped to v2 with the six-column feed. Without it, every wall already running
 * would boot holding a v1 cache, throw on it, and log a parse error on first
 * paint until the first fetch landed — noise that reads like a fault and is not.
 */

const PREFIX = 'byob-tv.v2'

export const KEYS = {
  csv: `${PREFIX}.csv`,
} as const

/**
 * Returns `null` for absent, unparseable **and** wrong-shaped.
 *
 * All three route into the same branch — refetch from the sheet — and no repair
 * code exists. The direction of failure is the point: a corrupt store read as
 * "empty, but replay everything" would fire every animation it could find in
 * one tick, in public. Discarding and refetching fails quiet.
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

function isCsvCache(value: unknown): value is CsvCache {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<CsvCache>
  return typeof candidate.feedCsv === 'string' && typeof candidate.cohortCsv === 'string'
}

export function readCsvCache(): CsvCache | null {
  return readJson(KEYS.csv, isCsvCache)
}

export function writeCsvCache(cache: CsvCache): void {
  writeJson(KEYS.csv, cache)
}
