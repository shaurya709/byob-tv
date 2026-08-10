import { describe, expect, it } from 'vitest'

import { cohort, cohortCsv, feedCsv, teams } from '@/test/fixtures'
import { COHORT_KEYS, TvSchemaError, parseCohort, parseSnapshot, parseTeams, passesRowGate } from '@/lib/feed'

describe('parseTeams', () => {
  it('reads a well-formed feed', () => {
    const rows = parseTeams(
      feedCsv(teams([{ teamId: 'SLE-C407', totalRevenue: 104_500, totalUnits: 12, streakDays: 3 }])),
    )
    expect(rows).toHaveLength(42)
    const seven = rows.find((row) => row.teamId === 'SLE-C407')
    expect(seven).toMatchObject({ totalRevenue: 104_500, totalUnits: 12, streakDays: 3 })
  })

  /**
   * Google's published CSV is served with a UTF-8 BOM and CRLF endings. Without
   * handling, `﻿team_id` never matches `team_id` and the schema check
   * throws on *every* fetch from first deploy, while a stray `\r` rides along on
   * the last field of every row. Both are silent-until-total failures, so they
   * get their own test rather than being trusted to the parser's reputation.
   */
  it('survives a UTF-8 BOM and CRLF line endings', () => {
    const csv = `﻿${feedCsv(teams()).replace(/\n/g, '\r\n')}`
    const rows = parseTeams(csv)
    expect(rows).toHaveLength(42)
    expect(rows[0].teamId).toBe('SLE-C401')
    expect(rows[41].streakDays).toBe(0)
  })

  it('reads formatted rupee values, because the sheet publishes formatted cells', () => {
    const csv = ['team_id,venture_name,total_revenue,total_units,streak_days', 'SLE-C401,Aurora,"₹1,04,500",12,3'].join('\n')
    expect(parseTeams(csv)[0].totalRevenue).toBe(104_500)
  })

  it('treats a blank revenue as zero — a team with no sales yet is normal', () => {
    const csv = ['team_id,venture_name,total_revenue,total_units,streak_days', 'SLE-C401,Aurora,,,'].join('\n')
    expect(parseTeams(csv)[0]).toMatchObject({ totalRevenue: 0, totalUnits: 0, streakDays: 0 })
  })

  it('keeps a venture name containing a comma intact', () => {
    const csv = [
      'team_id,venture_name,total_revenue,total_units,streak_days',
      'SLE-C401,"Bhatt, Rao & Co",1000,1,1',
    ].join('\n')
    expect(parseTeams(csv)[0].ventureName).toBe('Bhatt, Rao & Co')
  })

  it('throws on a missing header rather than guessing a column', () => {
    const csv = ['team_id,venture_name,total_revenue,total_units', 'SLE-C401,Aurora,1000,1'].join('\n')
    expect(() => parseTeams(csv)).toThrow(TvSchemaError)
  })

  it('throws on a non-numeric revenue rather than rendering NaN for a week', () => {
    const csv = ['team_id,venture_name,total_revenue,total_units,streak_days', 'SLE-C401,Aurora,#REF!,1,1'].join('\n')
    expect(() => parseTeams(csv)).toThrow(TvSchemaError)
  })
})

describe('parseCohort', () => {
  it('reads every key', () => {
    const parsed = parseCohort(cohortCsv(cohort({ biggest_sale_today_team: 'SLE-C412' })))
    expect(parsed.biggest_sale_today_team).toBe('SLE-C412')
    for (const key of COHORT_KEYS) expect(parsed).toHaveProperty(key)
  })

  it('accepts empty values — no team holds a title before the first sale', () => {
    const parsed = parseCohort(cohortCsv(cohort()))
    expect(parsed.biggest_sale_today_team).toBe('')
  })

  it('throws on a missing key, because that means the sheet shape drifted', () => {
    const values = cohort()
    delete values.closed_week_number
    expect(() => parseCohort(cohortCsv(values))).toThrow(TvSchemaError)
  })
})

describe('passesRowGate', () => {
  /**
   * Short, not exact. A read landing mid-rebuild yields *fewer* rows, and acting
   * on it could fire a false overtake or permanently burn a milestone.
   */
  it('rejects a short feed', () => {
    expect(passesRowGate(teams().slice(0, 41))).toBe(false)
  })

  it('accepts exactly the expected count', () => {
    expect(passesRowGate(teams())).toBe(true)
  })

  /**
   * The day a 43rd workbook is added, an exact check would freeze every wall on
   * stale data permanently, silently, with no error state to notice. A partial
   * write cannot *add* rows, so growth is always legitimate.
   */
  it('accepts a longer feed, so adding a 43rd team does not freeze the wall', () => {
    expect(passesRowGate([...teams(), { ...teams()[0], teamId: 'SLE-C443' }])).toBe(true)
  })
})

describe('parseSnapshot', () => {
  it('builds both halves from raw text', () => {
    const snapshot = parseSnapshot({
      feedCsv: feedCsv(teams()),
      cohortCsv: cohortCsv(cohort()),
    })
    expect(snapshot.teams).toHaveLength(42)
    expect(snapshot.cohort.closed_week_number).toBe('0')
  })
})
