import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/**
 * All three faces are self-hosted, so the wall makes **no runtime request to a
 * font CDN**. That matters more here than in a normal app: this runs unattended for
 * weeks, and a font request that fails silently falls back to Georgia or
 * Helvetica on a screen nobody is watching closely enough to notice.
 *
 * Neither family may be named after the face it carries. `next/font` derives
 * its CSS family name from the const below, and `colors_and_type.css` already
 * declares seven static `Manrope` rules and four `MesaSerif` ones. CSS family
 * names match case-insensitively, so a collision merges the two sets and the
 * browser picks between them by weight — fetching a static face as well as the
 * variable one, or preferring a `local()` system font over the self-hosted
 * file. Hence `mesaBody` and `mesaSerifVariable`.
 */
const mesaBody = localFont({
  src: './fonts/MesaBody-Variable.ttf',
  weight: '200 800',
  display: 'block',
  variable: '--font-mesa-body',
})

/**
 * Source Serif 4, self-hosted, standing in for New York.
 *
 * **The generated family cannot be called `MesaSerif`, however much the design
 * language calls it that.** `next/font/local` derives its CSS family name from
 * this const — confirmed in the built stylesheet, which emits `mesaBody` and
 * this face, not the filenames — and `colors_and_type.css` already declares
 * four `@font-face` rules for a family named `MesaSerif` whose `src` begins
 * `local("New York")`. CSS family matching is case-insensitive, so a const
 * named `mesaSerif` would merge with those rules, and the browser would then
 * choose between a self-hosted Source Serif 4 and whatever New York the
 * machine happens to have. Every Mac has New York. Two TVs would set the same
 * heading in two different serifs and nobody would think to check.
 *
 * So the file is `MesaSerif-Variable.woff2` and the token is
 * `--font-mesa-serif` — the name the design language uses — while the family
 * this generates stays deliberately distinct from it.
 */
const mesaSerifVariable = localFont({
  src: './fonts/MesaSerif-Variable.woff2',
  weight: '200 900',
  display: 'block',
  variable: '--font-mesa-serif',
})

/**
 * Archivo Black, for `BYOB` in `/podium`'s masthead and nothing else.
 *
 * **A third family, added deliberately and scoped to one word.** The rule this
 * bends is a real one — two families is what keeps two TVs setting the same
 * frame identically — so this is not a general display face. It is a wordmark,
 * it appears once, and it is the only thing on either wall that uses it.
 *
 * It is *bundled*, not linked. The 9.8KB latin subset sits in `app/fonts/` next
 * to the other two with its OFL licence, because a `fonts.googleapis.com` link
 * would put a runtime network dependency on a wall that runs unattended for
 * weeks — and a font request that fails silently falls back to Helvetica on a
 * screen nobody is watching closely enough to notice.
 *
 * Single weight, and that is the point: Archivo Black *is* the 900. There is no
 * axis to set, so nothing here can accidentally render it lighter. It replaced
 * MesaSerif at 900, which was the heaviest thing this wall could previously
 * draw.
 *
 * The const is not named `archivoBlack` for the same reason `mesaBody` is not
 * named `Manrope`: `next/font/local` derives the CSS family name from it, and a
 * name matching a real family risks merging with any `local()` rule that shares
 * it.
 */
const displayBlack = localFont({
  src: './fonts/ArchivoBlack-Regular.woff2',
  weight: '400',
  display: 'block',
  variable: '--font-display-black',
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
    <html
      lang="en-IN"
      className={`${mesaBody.variable} ${mesaSerifVariable.variable} ${displayBlack.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
