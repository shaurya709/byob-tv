# Mesa Marketing UI Kit

This UI kit is the working library for Mesa School of Business marketing collateral. Mesa ships no product UI (no app, no dashboard) — marketing templates **are** the UI kit.

## What's here

- `Components.jsx` — reusable primitives: `Logo`, `LogoLockup`, `BrandMark`, `Overline`, `Headline`, `Sub`, `Glass`, `Pill`, `CTA`, `PhotoCutout`, `Canvas`, plus the color constants `C`.
- `Templates.jsx` — full composition templates per aspect ratio:
  - `SocialSquare` — 1:1 · 1080×1080
  - `StoryReel` — 9:16 · 1080×1920
  - `YouTubeWide` — 16:9 · 1920×1080
  - `FeedAd45` — 4:5 · 1080×1350
  - `QuoteCard` — 1:1 · serif-forward testimonial
- `index.html` — gallery showing every template at scaled-down preview size.
- `templates/` — single-asset HTML files, one per aspect ratio, rendered at full native pixel size. Open any of them, then use Save-as-PDF or take a screenshot to export.

## Usage

All templates accept props to swap copy / color:

```jsx
<SocialSquare
  kicker="Early deadline · 30 June"
  headline="Build it. Don't just study it."
  sub="12-month PG in Bengaluru."
  cta="Apply →"
  bg={C.charcoal}     // mint / charcoal / teal / forest
  accent="tangerine"  // green / tangerine
  logoTone="dark"     // light / dark
/>
```

## Brand rules (recap)

- **Logo always top-right** on ads. Never bottom, never centered.
- **Brand mark** (circle + notch) lives top-left of headline or card corner. Always accent-sized.
- **Photo cut-outs** have a **min 10px white stroke** on brand-color backgrounds.
- **Frosted glass** (`<Glass>`) is the preferred surface for callouts — not solid cards.
- **Logomark-only** for returning audiences; **full lockup** for new ones. Pass `markOnly` to `Logo` / `LogoLockup`.

## Not in this kit (by design)

- Product UI (chrome, nav, forms, data tables). Mesa has none.
- Long-form landing page. Ask before adding — the brief is marketing collateral.
