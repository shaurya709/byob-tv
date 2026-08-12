import { describe, expect, it } from 'vitest'

import { hashTeamId } from '@/lib/seed'

describe('hashTeamId', () => {
  it('is stable for the same id', () => {
    expect(hashTeamId('SLE-C401')).toBe(hashTeamId('SLE-C401'))
  })

  it('separates neighbouring ids', () => {
    expect(hashTeamId('SLE-C401')).not.toBe(hashTeamId('SLE-C402'))
  })

  it('is non-negative, so it is safe as a modulo index', () => {
    for (const id of ['SLE-C401', 'SLE-C442', '', 'A']) {
      expect(hashTeamId(id)).toBeGreaterThanOrEqual(0)
    }
  })

  it('spreads the real cohort across six tints without clustering', () => {
    // The point of hashing rather than using the rank: 42 workbooks whose ids
    // differ by one character must not land in one or two buckets.
    const buckets = new Map<number, number>()
    for (let n = 1; n <= 42; n += 1) {
      const id = `SLE-C4${String(n).padStart(2, '0')}`
      const bucket = hashTeamId(id) % 6
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
    }
    expect(buckets.size).toBe(6)
    for (const count of buckets.values()) expect(count).toBeGreaterThan(2)
  })
})
