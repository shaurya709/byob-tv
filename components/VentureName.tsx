'use client'

import { useLayoutEffect, useRef, useState } from 'react'

/**
 * A venture's name on a card, marqueed only if it does not fit.
 *
 * ── The rule this exists for ──
 *
 * **Never break mid-word.** A plain `overflow: hidden` clips mid-character, and
 * a continuous marquee shows half a word at the clipping edge for most of its
 * cycle. Both fail the same requirement: the visible portion has to end at a
 * word boundary at every moment anyone is reading it.
 *
 * So the name is split into *pages* of whole words, each exactly one card wide,
 * and the track steps between them with a long hold on each. Every held state is
 * a complete phrase. The slides between pages are the only moment a word is in
 * transit, and they are short and moving — nobody reads a card mid-slide.
 *
 * ── Most names do not need any of this ──
 *
 * A name that fits is returned as plain text with no track, no class and no
 * animation. That is not an optimisation, it is the point: forty perpetual
 * animations on a page that runs for weeks is the cost `app/mesa-tv.css`
 * documents for `tv-breathe`, and paying it for cards that never move would be
 * absurd.
 *
 * ── Why this measures, when nothing else on the wall does ──
 *
 * Where a word boundary falls is a fact about the rendered font at the rendered
 * size, and no token knows it. `VenturePill` set the precedent for a mount-only
 * layout read and its reasoning holds here: the measurement happens once, at
 * page load, never during an animation. `measureText` on a shared canvas is used
 * rather than DOM probes so forty names cost forty text measurements and no
 * layout thrash.
 */

/** More than this and the name is not a name; it is a sentence. */
const MAX_PAGES = 4

let scratch: CanvasRenderingContext2D | null = null

function measurer(font: string): CanvasRenderingContext2D | null {
  if (scratch === null) scratch = document.createElement('canvas').getContext('2d')
  if (scratch === null) return null
  scratch.font = font
  return scratch
}

/**
 * Greedy word wrap against a pixel width — the same algorithm a text engine
 * uses, run here because we need the break *positions*, not just the result.
 *
 * A single word longer than the card is its own page and is allowed to overflow
 * it. Splitting it would break the one rule this component exists to keep, and a
 * word that long is a data problem rather than a layout one.
 */
export function pagesOf(name: string, widthPx: number, measure: (s: string) => number): string[] {
  const words = name.trim().split(/\s+/).filter((w) => w !== '')
  if (words.length === 0) return []

  const pages: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line === '' ? word : `${line} ${word}`
    if (line !== '' && measure(candidate) > widthPx) {
      pages.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line !== '') pages.push(line)
  return pages
}

export function VentureName({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<string[] | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el === null) return
    // One mount-time read, before any animation exists. The width is the card's
    // own text column, so the pages are correct for this card at this viewport.
    const width = el.getBoundingClientRect().width
    if (width === 0) return
    const ctx = measurer(getComputedStyle(el).font)
    if (ctx === null) return
    const split = pagesOf(name, width, (s) => ctx.measureText(s).width)
    setPages(split.length > MAX_PAGES ? split.slice(0, MAX_PAGES) : split)
  }, [name])

  // First paint, and every name that fits: plain text, no track, no animation.
  // `nowrap` matters on the first paint too — the measurement needs the name on
  // one line, and a card must never grow a second one.
  if (pages === null || pages.length <= 1) {
    return (
      <div
        ref={ref}
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}
      >
        {name}
      </div>
    )
  }

  return (
    <div ref={ref} style={{ overflow: 'hidden', width: '100%' }}>
      <div className={`tv-marquee tv-marquee-${pages.length}`}>
        {pages.map((page, i) => (
          <span key={`${page}-${i}`} style={{ textAlign: 'center' }}>
            {page}
          </span>
        ))}
      </div>
    </div>
  )
}
