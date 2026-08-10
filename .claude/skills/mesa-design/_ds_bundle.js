/* @ds-bundle: {"format":3,"namespace":"MesaSchoolDesignSystem_d66e80","components":[],"sourceHashes":{"ui_kits/marketing/Components.jsx":"8c19ae2fde0b","ui_kits/marketing/Templates.jsx":"d123ae234087"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MesaSchoolDesignSystem_d66e80 = window.MesaSchoolDesignSystem_d66e80 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/marketing/Components.jsx
try { (() => {
// Mesa Marketing Kit — shared components (Babel JSX).
// Load after React + ReactDOM + Babel. Exports to window.
// Each host HTML must set window.ASSET_BASE to the path prefix where /assets/ lives,
// e.g. '../../' for ui_kits/marketing/index.html or '../../../' for templates/*.html.
const A = typeof window !== 'undefined' && window.ASSET_BASE ? window.ASSET_BASE : '../../';
const C = {
  charcoal: '#112121',
  mint: '#E4F3E7',
  bright: '#6ED190',
  tangerine: '#F6AF65',
  forest: '#11403B',
  teal: '#0B2E2A',
  charcoal900: '#0C1919',
  charcoal700: '#1E3636',
  mint300: '#AFCBB5',
  green600: '#43AF68',
  green200: '#AFF2C6',
  tangerine600: '#CB853C',
  tangerine200: '#FAC995',
  white: '#FFFFFF'
};

// Logo component. variant = 'pg' | 'ug'; tone = 'dark' (use white on dark bg) | 'light' (colored on light bg).
function Logo({
  variant = 'pg',
  tone = 'light',
  width = 200,
  style,
  markOnly = false
}) {
  const src = markOnly ? null // we don't have a mark-only asset; fall back by cropping
  : tone === 'dark' ? variant === 'pg' ? A + 'assets/logo-pg-white.png' : A + 'assets/logo-ug-white.png' : variant === 'pg' ? A + 'assets/logo-pg-green.png' : A + 'assets/logo-ug-red.png';
  // For mark-only, use a tight clip of the full logo (mark is leftmost ~25% of width)
  if (markOnly) {
    const fullSrc = tone === 'dark' ? variant === 'pg' ? A + 'assets/logo-pg-white.png' : A + 'assets/logo-ug-white.png' : variant === 'pg' ? A + 'assets/logo-pg-green.png' : A + 'assets/logo-ug-red.png';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width,
        height: width,
        overflow: 'hidden',
        display: 'inline-block',
        ...style
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: fullSrc,
      style: {
        width: width * 4,
        height: width,
        objectFit: 'contain',
        objectPosition: 'left center',
        display: 'block'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("img", {
    src: src,
    style: {
      width,
      height: 'auto',
      display: 'block',
      ...style
    }
  });
}

// Brand mark SVG (quote shape). variant: 'solid' | 'filled-concentric' | 'lined-concentric'. color: 'green'|'tangerine'|'charcoal'|'white'
function BrandMark({
  variant = 'solid',
  color = 'green',
  size = 56,
  style
}) {
  const src = `${A}assets/brand-mark-${variant}-${color}.svg`;
  return /*#__PURE__*/React.createElement("img", {
    src: src,
    style: {
      width: size,
      height: size,
      display: 'block',
      ...style
    }
  });
}

// Overline — kicker / eyebrow label.
function Overline({
  children,
  color,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 700,
      fontSize: 12,
      lineHeight: 1.2,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: color || C.forest,
      ...style
    }
  }, children);
}

// Headline — serif display.
function Headline({
  children,
  size = 56,
  color,
  weight = 700,
  italic = false,
  style
}) {
  return /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'MesaSerif, "New York", ui-serif, "Source Serif 4", Georgia, serif',
      fontWeight: weight,
      fontSize: size,
      lineHeight: 1.04,
      letterSpacing: '-0.02em',
      fontStyle: italic ? 'italic' : 'normal',
      color: color || C.charcoal,
      margin: 0,
      textWrap: 'balance',
      ...style
    }
  }, children);
}

// Sub — sans subtitle.
function Sub({
  children,
  size = 18,
  color,
  weight = 400,
  style
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Manrope, sans-serif',
      fontWeight: weight,
      fontSize: size,
      lineHeight: 1.45,
      color: color || C.forest,
      margin: 0,
      textWrap: 'pretty',
      ...style
    }
  }, children);
}

// Frosted glass surface.
function Glass({
  children,
  tone = 'light',
  radius = 16,
  pad = 20,
  style
}) {
  const bg = tone === 'dark' ? 'rgba(228,243,231,0.08)' : 'rgba(17,64,59,0.08)';
  const border = tone === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(17,33,33,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      backdropFilter: 'blur(18px) saturate(1.1)',
      WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
      border,
      borderRadius: radius,
      padding: pad,
      boxShadow: '0 8px 24px rgba(11,46,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
      ...style
    }
  }, children);
}

// Pill (status chip / small tag).
function Pill({
  children,
  bg = C.forest,
  color = C.mint,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 14px',
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 600,
      fontSize: 13,
      ...style
    }
  }, children);
}

// CTA Button — filled pill; primary = bright, warm = tangerine.
function CTA({
  children,
  variant = 'primary',
  style
}) {
  const bg = variant === 'warm' ? C.tangerine : variant === 'dark' ? C.charcoal : C.bright;
  const color = variant === 'dark' ? C.white : C.charcoal;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '14px 22px',
      borderRadius: 12,
      background: bg,
      color,
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 600,
      fontSize: 15,
      ...style
    }
  }, children);
}

// Photo cut-out placeholder — circle with 10px white stroke.
// When no photo is supplied, shows an unmistakable "image goes here" placeholder
// (soft gradient + mountain/sun picture glyph + caption).
function PhotoCutout({
  size = 120,
  bg = C.forest,
  label = 'photo',
  src,
  style
}) {
  const hasPhoto = !!src;
  const capSize = Math.max(9, Math.round(size * 0.075));
  const glyphSize = Math.round(size * 0.38);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      border: '10px solid #fff',
      flex: 'none',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 18px rgba(11,46,42,0.12)',
      background: hasPhoto ? `url(${src}) center/cover no-repeat` : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), transparent 55%), ${bg}`,
      ...style
    }
  }, !hasPhoto && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 10,
      borderRadius: '50%',
      border: '1.5px dashed rgba(255,255,255,0.45)'
    }
  }), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "rgba(255,255,255,0.75)",
    strokeWidth: "1.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      width: glyphSize,
      height: glyphSize,
      position: 'absolute',
      left: '50%',
      top: '44%',
      transform: 'translate(-50%,-50%)'
    }
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10",
    r: "1.4",
    fill: "rgba(255,255,255,0.8)",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 16l-5-5-5 5-3-3-5 5"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: Math.round(size * 0.14),
      textAlign: 'center',
      fontFamily: 'Manrope, sans-serif',
      fontSize: capSize,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.7)',
      fontWeight: 600
    }
  }, label)));
}

// Logo lockup — positioned top-right on ads per brand rules.
function LogoLockup({
  variant = 'pg',
  tone = 'light',
  markOnly = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 28,
      right: 28,
      ...style
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: variant,
    tone: tone,
    width: markOnly ? 44 : 120,
    markOnly: markOnly
  }));
}

// Canvas — aspect-ratio container for a marketing asset. dims in logical px.
function Canvas({
  w,
  h,
  bg = C.mint,
  children,
  label,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      height: h,
      background: bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Manrope, sans-serif',
      color: C.charcoal,
      ...style
    },
    "data-asset-label": label
  }, children);
}
Object.assign(window, {
  C,
  Logo,
  BrandMark,
  Overline,
  Headline,
  Sub,
  Glass,
  Pill,
  CTA,
  PhotoCutout,
  LogoLockup,
  Canvas
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Templates.jsx
try { (() => {
// Template compositions for Mesa marketing assets.
// All templates accept props to swap copy; all render at their native logical px dims.

// ——— Template 1: Square social post (1080×1080) — headline + brand mark + cut-out
function SocialSquare({
  kicker = 'Cohort 02 · 2026',
  headline = 'Learn to build, not to analyse.',
  sub = 'A 12-month PG in Startup Leadership & Entrepreneurship. In-person, Bengaluru.',
  cta = 'Apply →',
  bg = C.mint,
  accent = 'green',
  logoTone = 'light',
  showCutout = true
}) {
  const dark = bg === C.charcoal || bg === C.teal || bg === C.forest;
  return /*#__PURE__*/React.createElement(Canvas, {
    w: 1080,
    h: 1080,
    bg: bg,
    label: "social-1-1"
  }, /*#__PURE__*/React.createElement(LogoLockup, {
    variant: "pg",
    tone: dark ? 'dark' : 'light'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 72,
      left: 72,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    variant: "solid",
    color: accent,
    size: 54,
    style: {
      marginTop: 14
    }
  }), /*#__PURE__*/React.createElement(Overline, {
    color: dark ? C.mint300 : C.forest
  }, kicker)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      top: 180,
      right: 72
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 108,
    weight: 700,
    color: dark ? C.white : C.charcoal,
    style: {
      lineHeight: 1
    }
  }, headline), /*#__PURE__*/React.createElement(Sub, {
    size: 26,
    color: dark ? C.mint300 : C.forest,
    style: {
      marginTop: 28,
      maxWidth: 820
    }
  }, sub)), showCutout && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 60,
      bottom: 60,
      display: 'flex',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(PhotoCutout, {
    size: 320,
    bg: dark ? C.bright : C.forest,
    label: "founder"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      bottom: 72
    }
  }, /*#__PURE__*/React.createElement(CTA, {
    variant: dark ? 'primary' : 'dark'
  }, cta)));
}

// ——— Template 2: Story / Reel (1080×1920) — vertical, photo cut-out top, headline bottom
function StoryReel({
  kicker = 'Meet the cohort',
  headline = '\u201CMesa put me in the room.\u201D',
  attribution = '— Riya · Cohort 01',
  sub = 'Now building Quilt.',
  cta = 'Watch the film ▶',
  bg = C.teal,
  accent = 'tangerine'
}) {
  return /*#__PURE__*/React.createElement(Canvas, {
    w: 1080,
    h: 1920,
    bg: bg,
    label: "story-9-16"
  }, /*#__PURE__*/React.createElement(LogoLockup, {
    variant: "pg",
    tone: "dark",
    markOnly: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 180,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(PhotoCutout, {
    size: 840,
    bg: C.tangerine,
    label: "founder portrait"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      right: 72,
      bottom: 260
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    variant: "filled-concentric",
    color: accent,
    size: 48
  }), /*#__PURE__*/React.createElement(Overline, {
    color: C.mint300
  }, kicker)), /*#__PURE__*/React.createElement(Headline, {
    size: 92,
    italic: true,
    color: C.white,
    style: {
      lineHeight: 1.02
    }
  }, headline), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Sub, {
    size: 24,
    color: C.mint300,
    weight: 600
  }, attribution), /*#__PURE__*/React.createElement(Sub, {
    size: 22,
    color: C.mint300,
    style: {
      marginTop: 8
    }
  }, sub))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      bottom: 90
    }
  }, /*#__PURE__*/React.createElement(CTA, {
    variant: "warm"
  }, cta)));
}

// ——— Template 3: YouTube / widescreen (1920×1080) — editorial split
function YouTubeWide({
  kicker = 'Mesa · 2026 intake',
  headline = 'India\u2019s first PG in Startup Leadership.',
  sub = 'Twelve months. In-person. Bengaluru. Operators teaching operators.',
  cta = 'Apply for Cohort 02 →'
}) {
  return /*#__PURE__*/React.createElement(Canvas, {
    w: 1920,
    h: 1080,
    bg: C.mint,
    label: "youtube-16-9"
  }, /*#__PURE__*/React.createElement(LogoLockup, {
    variant: "pg",
    tone: "light"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 96,
      top: 180,
      right: 960
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    variant: "solid",
    color: "green",
    size: 56
  }), /*#__PURE__*/React.createElement(Overline, null, kicker)), /*#__PURE__*/React.createElement(Headline, {
    size: 88,
    weight: 700,
    style: {
      lineHeight: 1
    }
  }, headline), /*#__PURE__*/React.createElement(Sub, {
    size: 24,
    style: {
      marginTop: 32,
      maxWidth: 760
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 44
    }
  }, /*#__PURE__*/React.createElement(CTA, {
    variant: "dark"
  }, cta))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 800,
      background: C.tangerine,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(PhotoCutout, {
    size: 720,
    bg: C.forest,
    label: "cohort"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 48,
      right: 48
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    variant: "lined-concentric",
    color: "charcoal",
    size: 72
  }))));
}

// ——— Template 4: Feed ad (1080×1350, 4:5) — bold hero
function FeedAd45({
  kicker = 'Early deadline · 30 June',
  headline = 'Build it. Don\u2019t just study it.',
  sub = '12 months · in-person · Bengaluru',
  cta = 'Apply now →',
  bg = C.charcoal
}) {
  return /*#__PURE__*/React.createElement(Canvas, {
    w: 1080,
    h: 1350,
    bg: bg,
    label: "feed-4-5"
  }, /*#__PURE__*/React.createElement(LogoLockup, {
    variant: "pg",
    tone: "dark"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      top: 140,
      right: 72,
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    variant: "solid",
    color: "tangerine",
    size: 60
  }), /*#__PURE__*/React.createElement(Overline, {
    color: C.tangerine200
  }, kicker)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      top: 270,
      right: 72
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 124,
    weight: 700,
    color: C.white,
    style: {
      lineHeight: 0.96
    }
  }, headline)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      bottom: 260,
      right: 72
    }
  }, /*#__PURE__*/React.createElement(Glass, {
    tone: "dark",
    radius: 18,
    pad: 28,
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(Sub, {
    size: 26,
    color: C.white,
    weight: 500
  }, sub))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      bottom: 96
    }
  }, /*#__PURE__*/React.createElement(CTA, {
    variant: "primary"
  }, cta)));
}

// ——— Template 5: Quote card (1:1) — serif-forward, minimal
function QuoteCard({
  quote = '\u201CMesa didn\u2019t teach me a framework. It put me in the room.\u201D',
  attribution = 'Riya Sharma',
  role = 'Cohort 01 · founder, Quilt',
  bg = C.mint
}) {
  return /*#__PURE__*/React.createElement(Canvas, {
    w: 1080,
    h: 1080,
    bg: C.mint,
    label: "quote-1-1"
  }, /*#__PURE__*/React.createElement(LogoLockup, {
    variant: "pg",
    tone: "light",
    markOnly: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 120,
      left: 90
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    variant: "solid",
    color: "green",
    size: 96
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 90,
      right: 90,
      top: 260
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: 76,
    weight: 600,
    italic: true,
    style: {
      lineHeight: 1.1,
      color: C.charcoal
    }
  }, quote)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 90,
      bottom: 130,
      display: 'flex',
      gap: 24,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(PhotoCutout, {
    size: 180,
    bg: C.forest,
    label: "photo"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sub, {
    size: 28,
    weight: 700,
    color: C.charcoal
  }, attribution), /*#__PURE__*/React.createElement(Sub, {
    size: 20,
    color: C.forest,
    style: {
      marginTop: 4
    }
  }, role))));
}
Object.assign(window, {
  SocialSquare,
  StoryReel,
  YouTubeWide,
  FeedAd45,
  QuoteCard,
  EventThumb
});

// ——— Template 6: Event thumbnail (speaker + credentials card)
// ratio: '16:9' | '1:1' | '9:16'
function EventThumb({
  ratio = '16:9',
  title = 'Data Storytelling',
  featuring = 'with Nipun Jasuja',
  date = '12th August, Saturday, 2023',
  time = '12:00 PM — 1:30 PM',
  credRole = 'GTM Lead @',
  credCompany = 'JPMorgan Chase & Co.',
  credSchool = 'Wharton',
  bg,
  showPlayBadge = false,
  playCount = '2.3 M'
}) {
  const dims = {
    '16:9': [1920, 1080],
    '1:1': [1080, 1080],
    '9:16': [1080, 1920]
  }[ratio];
  const [w, h] = dims;
  const vertical = ratio === '9:16';
  const square = ratio === '1:1';
  const surface = bg || (vertical ? '#9BD9A8' : square ? '#EAF5EC' : C.teal);
  const isLight = vertical || square;

  // Concentric ring backdrop (lined-concentric mark, huge, offset)
  const ringColor = vertical ? 'rgba(17,64,59,0.18)' : square ? 'rgba(110,209,144,0.35)' : 'rgba(110,209,144,0.22)';
  return /*#__PURE__*/React.createElement(Canvas, {
    w: w,
    h: h,
    bg: surface,
    label: `event-${ratio}`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    preserveAspectRatio: "xMidYMid meet",
    style: {
      position: 'absolute',
      width: vertical ? '180%' : square ? '140%' : '120%',
      height: vertical ? '180%' : square ? '140%' : '120%',
      left: vertical ? '-20%' : square ? '-20%' : '-10%',
      top: vertical ? '-30%' : square ? '-20%' : '-20%'
    }
  }, [48, 40, 32, 24, 16].map((r, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: 50,
    cy: 50,
    r: r,
    fill: "none",
    stroke: ringColor,
    strokeWidth: 0.35
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: vertical ? 40 : 32,
      left: vertical ? 40 : 32
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "pg",
    tone: isLight ? 'light' : 'dark',
    width: vertical ? 64 : 56,
    markOnly: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: vertical ? 0 : square ? 56 : 72,
      right: vertical ? 0 : square ? '46%' : '42%',
      top: vertical ? 110 : square ? 140 : 180,
      textAlign: vertical ? 'center' : 'left',
      paddingLeft: vertical ? 60 : 0,
      paddingRight: vertical ? 60 : 0
    }
  }, /*#__PURE__*/React.createElement(Headline, {
    size: vertical ? 68 : square ? 72 : 92,
    weight: 700,
    color: isLight ? C.charcoal : C.white,
    style: {
      lineHeight: 1.05
    }
  }, title, '\u00a0', /*#__PURE__*/React.createElement("span", {
    style: {
      color: isLight ? '#2E9F5B' : C.tangerine,
      whiteSpace: 'nowrap'
    }
  }, featuring)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: vertical ? 22 : 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: vertical ? 'center' : 'flex-start',
      color: isLight ? C.forest : C.mint300,
      fontFamily: 'Manrope, sans-serif',
      fontSize: vertical ? 22 : 24,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 9h18M8 3v4M16 3v4"
  })), date), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })), time))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      zIndex: 3,
      ...(ratio === '16:9' ? {
        right: 340,
        top: 360
      } : ratio === '1:1' ? {
        right: 120,
        top: 360
      } : {
        left: '50%',
        transform: 'translateX(-50%)',
        top: 560
      })
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 16,
      padding: '14px 22px',
      boxShadow: '0 12px 32px rgba(11,46,42,0.18)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      minWidth: 220,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: 13,
      fontWeight: 600,
      color: C.charcoal700
    }
  }, credRole), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '"Times New Roman",serif',
      fontSize: 20,
      fontWeight: 700,
      color: C.charcoal,
      letterSpacing: '-0.01em',
      lineHeight: 1
    }
  }, credCompany), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 1,
      background: 'rgba(17,33,33,0.1)',
      margin: '4px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '"Times New Roman",serif',
      fontSize: 20,
      fontWeight: 700,
      color: '#990000',
      fontStyle: 'italic',
      letterSpacing: '-0.01em',
      lineHeight: 1
    }
  }, credSchool), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -10,
      right: 40,
      width: 0,
      height: 0,
      borderLeft: '12px solid transparent',
      borderRight: '12px solid transparent',
      borderTop: '12px solid #fff'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      ...(ratio === '16:9' ? {
        right: 40,
        bottom: 0,
        width: 560,
        height: 560
      } : ratio === '1:1' ? {
        right: 0,
        bottom: 0,
        width: 480,
        height: 560
      } : {
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        width: 720,
        height: 960
      })
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '15%',
      right: '15%',
      bottom: '6%',
      height: 24,
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.22), transparent 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 200 240",
    style: {
      width: '80%',
      height: 'auto'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 10 240 Q 10 170 55 155 L 80 150 L 120 150 L 145 155 Q 190 170 190 240 Z",
    fill: "#3A4A5A"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 80 152 L 100 200 L 120 152 Z",
    fill: "#E8EEF3"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "88",
    y: "130",
    width: "24",
    height: "28",
    fill: "#D4A27E"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "100",
    cy: "95",
    rx: "42",
    ry: "52",
    fill: "#D4A27E"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 58 92 Q 60 45 100 40 Q 140 45 142 92 Q 142 68 100 64 Q 58 68 58 92 Z",
    fill: "#2C1810"
  })))), showPlayBadge && vertical && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 60,
      bottom: 60,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      color: C.charcoal,
      fontFamily: 'Manrope,sans-serif',
      fontWeight: 600,
      fontSize: 28
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "36",
    height: "36",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "5,3 19,12 5,21"
  })), playCount));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Templates.jsx", error: String((e && e.message) || e) }); }

})();
