/**
 * Does the frame still fit, at every size it might be driven at?
 *
 *   node scripts/measure-fit.mjs [url]
 *
 * Reach for this after changing **any** height, gap or type size. It is the
 * script that catches the failure a single 1920x1080 check cannot.
 *
 * ── The trap it exists for ──
 *
 * The type and dimension tokens are `vw`, so they shrink with the frame. **The
 * `--s-*` spacing scale is fixed px and does not.** Every gap, padding and
 * margin therefore holds its size while everything around it contracts, which
 * means a band that merely *fits* at 1920 can overlap the header at 1600.
 * Measured, before this was budgeted properly: -15.8px of clearance at
 * 1600x900, on a layout that looked perfect at 1920.
 *
 * `clearance` is the gap between the bottom of the header and the top of the
 * highest thing in the board. **It must be positive at every size.** Aim for
 * 10px or more at the smallest size you care about; anything under ~5px is a
 * heading waiting to be overlapped by a font that loads a step heavier.
 */

import { launch, open } from './measure-browser.mjs'

const url = process.argv[2] ?? 'http://localhost:3000/podium'

/** 16:9 at three scales, plus one deliberately off-ratio — a browser window is
    never exactly 16:9, and off-ratio is where the fixed-px spacing bites. */
const SIZES = [
  [1920, 1080],
  [2000, 1100],
  [1600, 900],
  [2560, 1440],
]

const browser = await launch()

console.log('viewport     clearance   bottom   rowH   stripW   pillarGap   overflow')
for (const [width, height] of SIZES) {
  const { page } = await open(browser, url, { width, height })
  const r = await page.evaluate(() => {
    const n = (v) => +Number(v).toFixed(1)
    const header = document.querySelector('header')?.getBoundingClientRect()
    const tops = [
      ...document.querySelectorAll('[class*="tv-idle-"], .tv-pod-slab'),
    ].map((el) => el.getBoundingClientRect().top)
    const shafts = [...document.querySelectorAll('.tv-pod-shaft')].map((el) =>
      el.getBoundingClientRect(),
    )
    const rows = [...document.querySelectorAll('main > div > div:last-child > div')]
    const last = rows.at(-1)?.getBoundingClientRect()
    const sorted = [...shafts].sort((a, b) => a.x - b.x)
    return {
      clearance: header && tops.length ? n(Math.min(...tops) - header.bottom) : null,
      bottomAir: last ? n(innerHeight - last.bottom) : null,
      rowH: rows.length > 1 ? n(rows[1].getBoundingClientRect().height) : null,
      stripW: rows.length ? n(rows[0].getBoundingClientRect().width) : null,
      pillarGap: sorted.length === 3 ? n(sorted[1].left - sorted[0].right) : null,
      overflow: [...document.querySelectorAll('main *')].filter((el) => {
        const q = el.getBoundingClientRect()
        if (!q.width && !q.height) return false
        return q.bottom > innerHeight + 0.5 || q.top < -0.5 || q.right > innerWidth + 0.5
      }).length,
    }
  })
  const flag = r.clearance !== null && r.clearance < 5 ? '  <-- TOO TIGHT' : ''
  console.log(
    `${String(width + 'x' + height).padEnd(12)} ${String(r.clearance).padStart(9)} ` +
      `${String(r.bottomAir).padStart(8)} ${String(r.rowH).padStart(6)} ` +
      `${String(r.stripW).padStart(8)} ${String(r.pillarGap).padStart(11)} ` +
      `${String(r.overflow).padStart(10)}${flag}`,
  )
  await page.close()
}
await browser.close()
