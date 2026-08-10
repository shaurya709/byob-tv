---
name: mesa-design
description: Use this skill to generate well-branded interfaces and assets for Mesa School of Business, either for production or throwaway prototypes/mocks/social collateral. Contains essential design guidelines, colors, type, fonts, logos, brand marks, and a marketing UI kit.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, marketing assets, throwaway prototypes), copy assets out (`fonts/`, `assets/`, `colors_and_type.css`) and create static HTML files for the user to view. The marketing UI kit lives in `ui_kits/marketing/` — import `Components.jsx` + `Templates.jsx` to reuse `SocialSquare`, `StoryReel`, `YouTubeWide`, `FeedAd45`, `QuoteCard`.

If working on production code, copy assets and read the rules in `README.md` (sections: CONTENT FUNDAMENTALS, VISUAL FOUNDATIONS, ICONOGRAPHY) to become an expert in designing with the Mesa brand.

If the user invokes this skill without any other guidance, ask them what they want to build (a social post? a reel template? a deck?), ask a few questions about copy / tone / audience, and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

Key rules to remember:
- Logo top-right on ads, always. Full lockup for new audiences, mark-only for returning.
- Brand mark (circle + notch) is an accent, top-left of headline. Never dominant.
- Photo cut-outs have min 10px white stroke on brand-color backgrounds.
- Frosted glass > solid cards for callouts.
- Serif headlines (New York / MesaSerif), Manrope for everything else.
- No emoji. Unicode arrows/middots are fine.
- No multi-hue gradients. Flat brand fills only.
