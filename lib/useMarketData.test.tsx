// @vitest-environment jsdom
import { readFileSync } from 'node:fs'

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MARKET_POLL_INTERVAL_MS } from '@/config'
import type { MarketSnapshot } from '@/lib/marketTypes'
import { KEYS } from '@/lib/storage'
import { useMarketData } from '@/lib/useMarketData'
import { marketCsv, marketRows } from '@/test/fixtures'

/**
 * The poll, exercised through the real hook. The failures it guards against all
 * render convincingly: a short export that empties the board, a bad tick that
 * silently kills the interval, and a backgrounded phone that keeps fetching.
 */

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// The hook refuses to poll against an empty URL, which is the shipped default
// until the tab is published — so every test here supplies one.
vi.mock('@/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/config')>()),
  MARKET_CSV_URL: '/mock/market.csv',
}))

let latest: MarketSnapshot | null = null
let host: HTMLDivElement
let root: Root
let served: string
let visibility: 'visible' | 'hidden'

function Probe() {
  // A test probe, not an app component: the render'''s one job is to expose the
  // hook'''s return value to the assertions.
  // eslint-disable-next-line react-hooks/globals
  latest = useMarketData().snapshot
  return null
}

async function flushTick() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
  await flushTick()
}

beforeEach(async () => {
  vi.useFakeTimers()
  localStorage.clear()
  latest = null
  served = marketCsv(marketRows([{ teamId: 'SLE-C415', takings: 9110, txns: 16 }]))
  visibility = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => served })))
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () => root.render(<Probe />))
  await flushTick()
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('useMarketData', () => {
  it('fetches on mount and caches the raw text', () => {
    expect(latest?.rows).toHaveLength(40)
    expect(latest?.rows.find((row) => row.teamId === 'SLE-C415')?.takings).toBe(9110)
    expect(JSON.parse(localStorage.getItem(KEYS.market) ?? '""')).toContain('SLE-C415')
  })

  it('applies a fresh tick', async () => {
    served = marketCsv(marketRows([{ teamId: 'SLE-C415', takings: 12_000, txns: 20 }]))
    await advance(MARKET_POLL_INTERVAL_MS)
    expect(latest?.rows.find((row) => row.teamId === 'SLE-C415')?.takings).toBe(12_000)
  })

  it('keeps the last good data on a short export, and writes nothing', async () => {
    const before = localStorage.getItem(KEYS.market)
    served = marketCsv(marketRows().slice(0, 12))
    await advance(MARKET_POLL_INTERVAL_MS)
    expect(latest?.rows).toHaveLength(40)
    expect(localStorage.getItem(KEYS.market)).toBe(before)
  })

  it('keeps the last good data on an empty export', async () => {
    served = marketCsv([])
    await advance(MARKET_POLL_INTERVAL_MS)
    expect(latest?.rows).toHaveLength(40)
  })

  it('survives a bad tick and recovers on the next one', async () => {
    // Loop isolation: one rejected fetch must not kill the interval, or the
    // board freezes for the rest of the day with nothing logged after the first
    // line.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network') }))
    await advance(MARKET_POLL_INTERVAL_MS)
    expect(latest?.rows).toHaveLength(40)

    served = marketCsv(marketRows([{ teamId: 'SLE-C415', takings: 15_000 }]))
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => served })))
    await advance(MARKET_POLL_INTERVAL_MS)
    expect(latest?.rows.find((row) => row.teamId === 'SLE-C415')?.takings).toBe(15_000)
  })

  it('stops fetching while the page is hidden', async () => {
    const calls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length
    const before = calls()
    visibility = 'hidden'
    await act(async () => document.dispatchEvent(new Event('visibilitychange')))
    await advance(MARKET_POLL_INTERVAL_MS * 3)
    expect(calls()).toBe(before)
  })
})

describe('useMarketData does not animate', () => {
  /**
   * The executable form of "no overtake animation in v1". The board reorders in
   * five-minute batches, so kicks would be near-continuous and still behind —
   * and at the opening bell every stall is on ₹0, so the first non-zero fetch
   * would fire a wave. Written as a scan because the absence of code is
   * invisible in review, and a helpful future reader would otherwise "restore"
   * it.
   */
  it('reads no board state and queues no kicks', () => {
    // Read by path from the project root, not via import.meta.url: this file
    // runs under jsdom, where import.meta.url is not a file: URL.
    const source = readFileSync('lib/useMarketData.ts', 'utf8')
    const body = source.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
    expect(body).not.toMatch(/\bdetect\b|enqueueKicks|writeBoard|readBoard|freeze|thaw/)
  })
})
