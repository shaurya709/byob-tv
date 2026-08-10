# Mesa School of Business — Design System

**Mesa School of Business** offers India's first Postgraduate program in Startup Leadership & Entrepreneurship — an in-person, 12-month program in Bengaluru. This design system powers Mesa's marketing collaterals across social (1:1), stories/reels (9:16), YouTube (16:9), and paid ads (4:5).

The brand is confident, warm, and grounded. It mixes a deep, grown-up palette (Midnight Charcoal, Deep Forest Green, Deep Teal) with energetic accents (Bright Green, Tangerine Glow) and a soft Mint surface. The typography pairs **New York** (serif, editorial authority) with **Manrope** (sans, modern craft). A golden-spiral-derived "quote mark" shape anchors moments of voice.

---

## Sources provided by the user

- **Fonts:** `Manrope` family (ExtraLight → ExtraBold, 7 weights + variable). Uploaded. See `fonts/`.
- **Logos:** `PG green.png`, `PG white.png` (Postgraduate — primary); `UG red.png`, `UG white.png` (Undergraduate — secondary). Uploaded. See `assets/`.
- **Color palette:** Specified in the brief (see Visual Foundations below).
- **Brand element:** The golden-spiral "quote mark" (circle + notch). Described in brief; recreated in `assets/brand-mark-*.svg`.
- **No codebase or Figma file was provided** — the system is built from the written brief + uploaded assets.

### Font substitution note

The brief specifies **New York** as the display serif. New York is Apple's proprietary UI serif and **is not distributable as a standalone file under a normal license.** The system handles this gracefully:

1. On Apple devices, `local("New York")` loads the real thing.
2. On other platforms, it falls back to **Source Serif 4** (loaded via Google Fonts' `gstatic` CDN inside `@font-face`) — a close geometric match for weight/proportion.
3. The token name is `--font-serif` and the family is aliased as `MesaSerif` so swap-in is one line if the team obtains licensed New York files.

**Action for the user:** If you have licensed `.ttf`/`.otf` files for New York (e.g. from an Apple developer license or another path), drop them in `fonts/` and update the `MesaSerif` `@font-face` block in `colors_and_type.css`.

---

## Index

| File / folder | What it is |
|---|---|
| `README.md` | This file. Brand context + content fundamentals + visual foundations + iconography. |
| `SKILL.md` | Agent-Skills-compatible entry point. Read first when invoking this as a skill. |
| `colors_and_type.css` | Core CSS tokens: fonts, colors, spacing, radii, shadows, type scale, dark/teal themes. |
| `fonts/` | Manrope `.ttf` files (7 static weights + variable). |
| `assets/` | Logos (PG + UG, green/white/red variants) and brand-mark SVGs (solid / filled-concentric / lined-concentric × green/tangerine/charcoal/white). |
| `preview/` | Design-System-tab preview cards (colors, type, spacing, components, brand). |
| `ui_kits/marketing/` | The primary UI kit — a React-based library of marketing collateral templates (posts, reels, YouTube, ads) with reusable components. See its own `README.md`. |
| `ui_kits/marketing/templates/` | Ready-to-export single-asset HTML files, one per aspect ratio. |

Mesa ships no product UI (no app, no dashboard). The system therefore centers on **marketing collateral** as its "UI kit."

---

## CONTENT FUNDAMENTALS

Mesa speaks like a smart older sibling who's already run a startup. Warm, direct, un-salesy. Never hypey.

### Voice

- **Confident but grounded.** "Build the muscle to lead a startup" — not "Become a founder!!!"
- **Plainspoken.** Short sentences. Verbs over nouns. No corporate MBA-speak ("synergy", "ecosystem", "value prop").
- **Specific over generic.** "12 months in Bengaluru, taught by operators" beats "world-class curriculum."
- **Warm, not cute.** The tone is a coffee with a mentor, not a dorm-room pitch.

### Tone by audience

| Audience | Feel |
|---|---|
| Prospective founders (new to Mesa) | Clear, inviting, credentialing. Lead with "what you'll build." |
| Existing applicants / community | Familiar, confident. Shorter. Drop the full lockup; mark-only is fine. |
| Hiring partners / faculty | Crisp, authoritative. Serif-forward headlines. |

### Casing

- **Sentence case** everywhere except overlines.
- **UPPERCASE + tracked** (0.12em) reserved for overlines / kickers / small labels only (e.g. `COHORT 02 · 2026`).
- Headlines are Title-y but not Yelling — "Learn to build, not just to analyse."
- Never ALL CAPS for full headlines.

### Pronouns & perspective

- **"You"** (reader) and **"we"** (Mesa) — direct address. Not "students will" / "the programme offers."
- **"Your cohort," "your mentors"** — makes it concrete and personal.

### Emoji

- **Effectively no emoji.** The brand element (circle + notch) plays the role emoji normally play. Rare exception: a ▶ for play, → for CTAs.
- Unicode symbols (→, ·, —, ×) are used instead of emoji for accents.

### Vibe examples

**Good**
> Build the muscle to lead a startup.
> 12 months. In-person. Bengaluru. Operators teaching operators.

> You won't write case studies about startups. You'll build one.

> Apply for Cohort 02 →

**Avoid**
> 🚀 Unlock your entrepreneurial potential with our revolutionary 12-month immersive journey! 💡
> Our world-class curriculum empowers ambitious learners to synergise their mindset with the startup ecosystem.
> "JOIN NOW — LIMITED SEATS!!!"

### Headline patterns

- **Statement + em-dash + punchline.** "Learn to build — not to analyse."
- **Two-clause rhythm.** "12 months. One cohort. Zero textbooks."
- **Serif headline + sans subtitle.** Serif does the poetry; sans does the facts.

---

## VISUAL FOUNDATIONS

### Palette strategy

Mesa uses **three surface modes** and layers accents on top:

1. **Soft Mint (`#E4F3E7`)** — the default light surface. Warm, optimistic, quiet.
2. **Midnight Charcoal (`#112121`)** — primary dark. Gravitas.
3. **Deep Teal (`#0B2E2A`)** — alternate dark. More saturated, premium.

**Accents** (used sparingly, ~1 accent per composition):
- **Bright Green (`#6ED190`)** — the primary accent. CTA, brand element, highlight.
- **Tangerine Glow (`#F6AF65`)** — warmth, energy, contrast against green/teal.

**Deep Forest Green (`#11403B`)** is the logomark color and does double-duty as a mid-dark surface. `#AFCBB5` (muted mint) is the muted-text color on Soft Mint surfaces.

### Type

- **Headlines: New York (serif), Semibold or Bold.** Tight tracking (`-0.02em` for display, `-0.01em` for h1–h3). Italics reserved for quotes / editorial callouts.
- **Body & UI: Manrope.** Regular (400) for body, Medium (500) for UI labels, Semibold (600) for buttons and section headers, Bold (700) for emphasis. Always `-webkit-font-smoothing: antialiased`.
- **Overline: Manrope Bold 11px, UPPERCASE, tracked 0.12em.** Used for kickers ("COHORT 02"), eyebrows, meta.
- **Serif + sans pair within a single composition** — serif headline above sans subtitle is the default.

### Backgrounds

- **Flat fills, not gradients**, as the rule. Mint, charcoal, teal, forest green.
- **Gradients are uni-color only** (e.g. mint → slightly-deeper mint) and used sparingly for depth on illustrations. **Never** multi-hue "sunrise" gradients.
- **No photo-heavy hero banners.** When photos appear, they're cut-outs (see below), not full-bleed backgrounds.
- **No repeating patterns / textures / grain** as a default. If texture is used, it's subtle noise on a flat fill, nothing stamped or decorative.
- **Full-bleed flat color** is the most common hero treatment, with the brand mark + a headline.

### Animation

- **Subtle, confident, slow.** No bounces, no elastic springs, no spinning.
- Entrances: **fade + 8px rise**, `400ms`, `cubic-bezier(0.22, 0.61, 0.36, 1)` (our `--ease-out`).
- Transitions: **`250ms ease-in-out`** for color / opacity.
- Hover: color shift + 1–2% scale max, `150ms`.
- No auto-loop animations on marketing assets — every motion has a purpose.

### Hover & press states

- **Hover:** deepen the fill by ~8% (e.g. Bright Green → `#43AF68`), or lift `shadow-sm → shadow-md`. Text buttons: underline + `fg1` → `fg2`.
- **Press:** scale(0.98), drop shadow one step, darken 4%. **No flashy glow/ring** — Mesa is not a consumer app.
- **Focus (a11y):** 2px `--bright-green` ring, 2px offset. Always visible on keyboard focus.

### Borders

- Default border: `1px solid rgba(17, 33, 33, 0.12)` on light, `rgba(255,255,255,0.10)` on dark.
- **Photo cut-out border:** **white stroke, min `10px`**, on any brand-color backdrop. Non-negotiable — this is a brand signature.
- Cards have **no border by default** — they use frosted-glass fills to separate layers instead.

### Shadows & elevation

Shadows are **subtle and cool-tinted** (`rgba(11, 46, 42, ...)`), not pure black. Three levels:
- `--shadow-sm` — `0 1px 3px` equivalent. Buttons, chips.
- `--shadow-md` — `0 4px 12px`. Cards, modals.
- `--shadow-lg` — `0 12px 32px`. Pop-overs, floating CTAs.
- `--shadow-glass` — combines `0 8px 24px` drop with an inset 1px white highlight for the frosted-glass look.

Mesa prefers **elevation via blur + translucency** over heavy drop shadows.

### Transparency & blur — "frosted glass"

The **frosted-glass card** is Mesa's signature surface:
- Fill: `rgba(17, 64, 59, 0.08)` (Deep Forest Green at 8%) on light; `rgba(228, 243, 231, 0.06)` on dark.
- `backdrop-filter: blur(18px) saturate(1.1)`.
- `1px` border using the same forest-green color at 12% alpha.
- `border-radius: 16px` (default) or `24px` for hero cards.

Used on: info cards, callouts, testimonial blocks, CTA chips sitting over photo cut-outs.

### Corner radii

- `6px` — inputs, chips, tiny tags.
- `10px` — buttons, small cards.
- `16px` — **default card radius.**
- `24px` — hero cards, modals.
- `32px` — large feature panels.
- `pill` (999px) — only for status chips / filter pills.

The brand logomark uses a **large squircle (~20%)** — never mirror that on every card; keep cards at `16px`.

### Layout rules

- **Brand mark accent lives in the top-left of a headline or top-left corner of a card.** Always.
- **Logo lives in the top-right of any ad.** Never bottom, never centered.
- **Generous whitespace.** Soft Mint needs room to breathe; never pack content edge-to-edge.
- Baseline grid: **4px spacing scale** (`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`).
- Copy columns: max ~60ch for readability; headlines can break the grid.
- **Composition rule of thirds:** headline in upper-left 2/3, photo cut-out or brand mark in lower-right 1/3 is a common template.

### Imagery color vibe

- **Warm, grounded, natural.** Studio cut-outs of founders/students, often with warm skin tones. Never blue-cool filters.
- **No grain, no b&w, no heavy color-grading.** Photos feel true-to-life.
- **Cut-out treatment:** subject silhouetted with a 10px white stroke, placed over a flat brand-color background. This is the dominant photo style.

### Illustrations

- **Flat, minimal, uni-color silhouettes.** Bright Green on Deep Teal; Tangerine on Midnight Charcoal.
- **No facial expressions** on illustrated figures (keeps it editorial, not cartoonish).
- Isometric style for "3D scenes" (campus views, workflow diagrams). Same palette rules.
- **No harsh gradients, no drop shadows on illustrations.**

### Cards

```
radius: 16px
fill:   frosted-glass (backdrop-filter blur) — default
        OR flat brand color
border: 1px forest-green at 12% on light, white at 10% on dark
shadow: --shadow-sm on rest, --shadow-md on hover
padding: 24px (small) / 32px (default) / 48px (hero)
```

No colored-left-border cards. No rounded-corner + accent-stripe combos. No emoji in cards.

---

## ICONOGRAPHY

Mesa's iconography is **modern, rounded, and restrained.** No codebase or icon library was supplied, so the system prescribes **Lucide** (CDN) as the default family.

### Approach

- **Lucide** — loaded from CDN (`https://unpkg.com/lucide@latest`). 24×24 viewBox, 2px stroke, rounded caps/joins. Matches Mesa's calm, modern tone.
- **Use line icons as the default.** Fill variants only for active/selected states or brand-mark usage.
- **Sizes:** 16, 20, 24, 32, 48. Pair with `color: var(--fg1)` or a brand color.
- **On-selection color:** primary brand colors (Bright Green or Tangerine Glow). Never rainbow.

### When **not** to use an icon

- In body copy. Words do the job.
- As emoji substitutes for delight — Mesa's delight comes from the brand mark, not icons.
- Decoratively "floating" on backgrounds. Icons live next to labels.

### SVG vs PNG

- **All logos are PNGs** (uploaded raster assets): `logo-pg-green.png`, `logo-pg-white.png`, `logo-ug-red.png`, `logo-ug-white.png` in `assets/`.
- **Brand-mark accents are SVG** (authored per-color to avoid CSS-color complications): `assets/brand-mark-<variant>-<color>.svg`.
- **Icons** come from Lucide CDN — no local file. If offline use is needed, copy `https://unpkg.com/lucide-static@latest/icons/<name>.svg`.

### Emoji & Unicode

- **No emoji**, per the brand brief.
- Unicode arrows (`→`, `↗`, `↓`), middots (`·`), em-dashes (`—`), and multiplication signs (`×`) are fine and encouraged in copy.

### Substitution flag

**Lucide is our substitution** — the brief doesn't specify a library. If Mesa has an internal icon set, drop the SVGs into `assets/icons/` and update this section.

---

## File naming conventions

- Tokens: `--<category>-<shade>` (e.g. `--fg2`, `--bright-green`, `--shadow-md`).
- Assets: `<kind>-<descriptor>.<ext>` (e.g. `logo-pg-green.png`, `brand-mark-solid-green.svg`).
- UI kits: `ui_kits/<product>/<Component>.jsx`.

---

## Caveats

- **New York** is substituted with Source Serif 4 + local New York fallback (see "Font substitution note" above).
- **No codebase / Figma file** was provided — the visual foundations are derived from the written brief, so some choices (exact radius scale, shadow system, motion curves) are the system's opinions and should be validated by the Mesa team.
- **Iconography** uses Lucide as the prescribed default; if Mesa has a house set, swap it in.
- **Photography & illustration** assets aren't shipped with the system — compositions use labeled placeholders where a real asset would go.
