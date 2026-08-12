/**
 * Shared browser launch for the measurement scripts.
 *
 * `playwright-core` is deliberately **not** a dependency of this project. The
 * wall itself ships five runtime packages and nothing here belongs in that
 * surface, so the harness asks for the driver only when someone runs it. See
 * scripts/README.md for the one-line install.
 */

const CACHE = `${process.env.HOME}/Library/Caches/ms-playwright`

/**
 * Where Chrome lives.
 *
 * `CHROME_PATH` wins, so this works on a machine that has never installed
 * Playwright's browsers. Otherwise the newest `chromium-*` in Playwright's
 * cache, and finally the system Chrome — enough to cover a laptop that only
 * has the real browser.
 */
async function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH

  const { readdirSync, existsSync } = await import('node:fs')
  if (existsSync(CACHE)) {
    const builds = readdirSync(CACHE)
      .filter((name) => name.startsWith('chromium-') && !name.includes('headless'))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    for (const build of builds) {
      const candidate = `${CACHE}/${build}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
      if (existsSync(candidate)) return candidate
    }
  }

  const system = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(system)) return system
  throw new Error('No Chrome found. Set CHROME_PATH, or see scripts/README.md.')
}

export async function launch() {
  let chromium
  try {
    ;({ chromium } = await import('playwright-core'))
  } catch {
    console.error(
      'playwright-core is not installed.\n' +
        '  npm i -D playwright-core     (see scripts/README.md)\n',
    )
    process.exit(1)
  }
  return chromium.launch({ executablePath: await chromePath() })
}

/**
 * A page at a stated viewport, with the feed given time to land.
 *
 * **`deviceScaleFactor: 1` is load-bearing.** A persistent browser profile can
 * carry a scale factor from a previous session — one was measured serving a
 * 5760x3240 viewport at DPR 0.33, which makes every `vw` token read three
 * times too large and quietly invalidates the entire report.
 */
export async function open(browser, url, { width = 1920, height = 1080, reducedMotion } = {}) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    ...(reducedMotion ? { reducedMotion: 'reduce' } : {}),
  })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url, { waitUntil: 'networkidle' })
  // The board polls client-side; without this the first paint is the empty state.
  await page.waitForTimeout(2000)
  return { page, errors }
}
