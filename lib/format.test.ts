import { describe, expect, it } from 'vitest'

import { formatCount, formatRupees, ordinal } from '@/lib/format'

describe('formatRupees', () => {
  /**
   * Indian digit grouping. Western grouping on a lakh figure reads as a typo
   * before it reads as a number, to the cohort reading their own revenue off it.
   */
  it('groups the Indian way', () => {
    expect(formatRupees(104_500)).toBe('₹1,04,500')
    expect(formatRupees(0)).toBe('₹0')
  })

  /**
   * `/weekly`'s challenge figure can legitimately be negative: a baseline is a
   * photograph of a proof-gated total, and proof can be revoked after the
   * shutter closes. The card prints it rather than hiding it.
   */
  it('keeps a real negative', () => {
    expect(formatRupees(-3_850)).toBe('-₹3,850')
    expect(formatRupees(-1.5)).toBe('-₹1')
  })

  /**
   * ── The `-₹0` bug, and why it is a rounding bug rather than a display rule ──
   *
   * `Math.round(-0.5)` is **negative zero**, and `Intl.NumberFormat` faithfully
   * renders its sign — so any shortfall between −₹0.50 and ₹0 printed `-₹0`. One
   * team was at exactly −₹0.50 on 19 August.
   *
   * At whole-rupee precision that value *is* zero, so the sign was describing
   * precision that had already been discarded. A minus in front of a zero on a
   * wall reads as a fault rather than as a fact.
   */
  it('never signs a value that rounds to zero', () => {
    expect(formatRupees(-0.5)).toBe('₹0')
    expect(formatRupees(-0.4)).toBe('₹0')
    expect(formatRupees(-0.0001)).toBe('₹0')
  })
})

describe('formatCount', () => {
  it('groups the Indian way, without a symbol', () => {
    expect(formatCount(104_500)).toBe('1,04,500')
  })
})

describe('ordinal', () => {
  it('reads as words a cropped photo still explains', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(21)).toBe('21st')
  })
})
