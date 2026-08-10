import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/**
 * Both faces are self-hosted, so the wall makes **no runtime request to a font
 * CDN**. That matters more here than in a normal app: this runs unattended for
 * weeks, and a font request that fails silently falls back to Georgia or
 * Helvetica on a screen nobody is watching closely enough to notice.
 *
 * The filenames are deliberately not `Manrope-*`. `next/font` derives its CSS
 * family name from the *filename*, and a family called `manrope` collides
 * case-insensitively with the seven static `Manrope` @font-face rules in
 * `colors_and_type.css` — the browser then fetches a static weight as well as
 * the variable one. Same reasoning for the serif, which must not collide with
 * the system's own `MesaSerif` family.
 */
const mesaBody = localFont({
  src: './fonts/MesaBody-Variable.ttf',
  weight: '200 800',
  display: 'block',
  variable: '--font-mesa-body',
})

const mesaDisplay = localFont({
  src: './fonts/MesaDisplay-Variable.woff2',
  weight: '200 900',
  display: 'block',
  variable: '--font-mesa-display',
})

export const metadata: Metadata = {
  title: 'BYOB Wall',
  description: 'Live leaderboard and Mesa Flea countdown for BYOB Cohort 2026.',
}

/**
 * `display: 'block'` on both faces, not the usual `swap`.
 *
 * On an interactive page `swap` is right — text should be readable immediately
 * even in a fallback face. This page is a fixed frame that nobody reads in the
 * first 100ms, and a swap would mean every rotation flashes Helvetica before
 * settling into Manrope. `block` holds the (very short) render until the real
 * face is there. The files are local, so the block period is a cache hit after
 * the first load of the day.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${mesaBody.variable} ${mesaDisplay.variable}`}>
      <body>{children}</body>
    </html>
  )
}
