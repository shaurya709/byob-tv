/**
 * Indian digit grouping throughout — `₹1,04,500`, not `₹104,500`.
 *
 * The audience is an Indian cohort reading their own revenue off a wall, and
 * western grouping on a lakh figure reads as a typo before it reads as a number.
 */
const RUPEES = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const PLAIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function formatRupees(value: number): string {
  return RUPEES.format(Math.round(value))
}

export function formatCount(value: number): string {
  return PLAIN.format(Math.round(value))
}

/**
 * Rank in words, not a bare numeral.
 *
 * A photo of one corner of this wall still has to say "2nd". The dashboard
 * reached the same conclusion for the same reason: a crop outlives the context
 * that explained it.
 */
export function ordinal(rank: number): string {
  const tens = rank % 100
  if (tens >= 11 && tens <= 13) return `${rank}th`
  const suffix = ['th', 'st', 'nd', 'rd'][rank % 10] ?? 'th'
  return `${rank}${suffix}`
}
