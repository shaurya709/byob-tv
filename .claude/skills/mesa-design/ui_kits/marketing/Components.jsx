// Mesa Marketing Kit — shared components (Babel JSX).
// Load after React + ReactDOM + Babel. Exports to window.
// Each host HTML must set window.ASSET_BASE to the path prefix where /assets/ lives,
// e.g. '../../' for ui_kits/marketing/index.html or '../../../' for templates/*.html.
const A = (typeof window !== 'undefined' && window.ASSET_BASE) ? window.ASSET_BASE : '../../';

const C = {
  charcoal:'#112121', mint:'#E4F3E7', bright:'#6ED190', tangerine:'#F6AF65',
  forest:'#11403B', teal:'#0B2E2A', charcoal900:'#0C1919', charcoal700:'#1E3636',
  mint300:'#AFCBB5', green600:'#43AF68', green200:'#AFF2C6',
  tangerine600:'#CB853C', tangerine200:'#FAC995', white:'#FFFFFF',
};

// Logo component. variant = 'pg' | 'ug'; tone = 'dark' (use white on dark bg) | 'light' (colored on light bg).
function Logo({ variant='pg', tone='light', width=200, style, markOnly=false }) {
  const src = markOnly
    ? null // we don't have a mark-only asset; fall back by cropping
    : tone === 'dark'
      ? (variant === 'pg' ? A+'assets/logo-pg-white.png' : A+'assets/logo-ug-white.png')
      : (variant === 'pg' ? A+'assets/logo-pg-green.png' : A+'assets/logo-ug-red.png');
  // For mark-only, use a tight clip of the full logo (mark is leftmost ~25% of width)
  if (markOnly) {
    const fullSrc = tone === 'dark'
      ? (variant === 'pg' ? A+'assets/logo-pg-white.png' : A+'assets/logo-ug-white.png')
      : (variant === 'pg' ? A+'assets/logo-pg-green.png' : A+'assets/logo-ug-red.png');
    return (
      <div style={{ width, height: width, overflow:'hidden', display:'inline-block', ...style }}>
        <img src={fullSrc} style={{ width: width * 4, height: width, objectFit:'contain', objectPosition:'left center', display:'block' }}/>
      </div>
    );
  }
  return <img src={src} style={{ width, height:'auto', display:'block', ...style }}/>;
}

// Brand mark SVG (quote shape). variant: 'solid' | 'filled-concentric' | 'lined-concentric'. color: 'green'|'tangerine'|'charcoal'|'white'
function BrandMark({ variant='solid', color='green', size=56, style }) {
  const src = `${A}assets/brand-mark-${variant}-${color}.svg`;
  return <img src={src} style={{ width:size, height:size, display:'block', ...style }}/>;
}

// Overline — kicker / eyebrow label.
function Overline({ children, color, style }) {
  return <div style={{
    fontFamily:'Manrope, sans-serif', fontWeight:700, fontSize:12, lineHeight:1.2,
    textTransform:'uppercase', letterSpacing:'0.12em', color: color || C.forest, ...style,
  }}>{children}</div>;
}

// Headline — serif display.
function Headline({ children, size=56, color, weight=700, italic=false, style }) {
  return <h1 style={{
    fontFamily:'MesaSerif, "New York", ui-serif, "Source Serif 4", Georgia, serif',
    fontWeight: weight, fontSize: size, lineHeight: 1.04, letterSpacing:'-0.02em',
    fontStyle: italic?'italic':'normal', color: color || C.charcoal, margin: 0, textWrap:'balance', ...style,
  }}>{children}</h1>;
}

// Sub — sans subtitle.
function Sub({ children, size=18, color, weight=400, style }) {
  return <p style={{
    fontFamily:'Manrope, sans-serif', fontWeight: weight, fontSize: size, lineHeight: 1.45,
    color: color || C.forest, margin: 0, textWrap:'pretty', ...style,
  }}>{children}</p>;
}

// Frosted glass surface.
function Glass({ children, tone='light', radius=16, pad=20, style }) {
  const bg = tone==='dark' ? 'rgba(228,243,231,0.08)' : 'rgba(17,64,59,0.08)';
  const border = tone==='dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(17,33,33,0.12)';
  return <div style={{
    background: bg, backdropFilter:'blur(18px) saturate(1.1)', WebkitBackdropFilter:'blur(18px) saturate(1.1)',
    border, borderRadius: radius, padding: pad,
    boxShadow:'0 8px 24px rgba(11,46,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)', ...style,
  }}>{children}</div>;
}

// Pill (status chip / small tag).
function Pill({ children, bg=C.forest, color=C.mint, style }) {
  return <span style={{
    display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999,
    background: bg, color, fontFamily:'Manrope, sans-serif', fontWeight:600, fontSize:13, ...style,
  }}>{children}</span>;
}

// CTA Button — filled pill; primary = bright, warm = tangerine.
function CTA({ children, variant='primary', style }) {
  const bg = variant==='warm' ? C.tangerine : variant==='dark' ? C.charcoal : C.bright;
  const color = variant==='dark' ? C.white : C.charcoal;
  return <span style={{
    display:'inline-flex', alignItems:'center', gap:8, padding:'14px 22px', borderRadius:12,
    background: bg, color, fontFamily:'Manrope, sans-serif', fontWeight:600, fontSize:15, ...style,
  }}>{children}</span>;
}

// Photo cut-out placeholder — circle with 10px white stroke.
// When no photo is supplied, shows an unmistakable "image goes here" placeholder
// (soft gradient + mountain/sun picture glyph + caption).
function PhotoCutout({ size=120, bg=C.forest, label='photo', src, style }) {
  const hasPhoto = !!src;
  const capSize = Math.max(9, Math.round(size * 0.075));
  const glyphSize = Math.round(size * 0.38);
  return <div style={{
    width:size, height:size, borderRadius:'50%', border:'10px solid #fff', flex:'none',
    position:'relative', overflow:'hidden', boxShadow:'0 4px 18px rgba(11,46,42,0.12)',
    background: hasPhoto ? `url(${src}) center/cover no-repeat` :
      `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), transparent 55%), ${bg}`,
    ...style,
  }}>
    {!hasPhoto && <>
      {/* dashed inner ring to read as a placeholder */}
      <div style={{
        position:'absolute', inset:10, borderRadius:'50%',
        border:'1.5px dashed rgba(255,255,255,0.45)',
      }}/>
      {/* picture glyph */}
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4"
           strokeLinecap="round" strokeLinejoin="round"
           style={{
             width: glyphSize, height: glyphSize, position:'absolute',
             left:'50%', top:'44%', transform:'translate(-50%,-50%)',
           }}>
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <circle cx="8.5" cy="10" r="1.4" fill="rgba(255,255,255,0.8)" stroke="none"/>
        <path d="M21 16l-5-5-5 5-3-3-5 5"/>
      </svg>
      {/* caption */}
      <div style={{
        position:'absolute', left:0, right:0, bottom: Math.round(size * 0.14),
        textAlign:'center',
        fontFamily:'Manrope, sans-serif', fontSize: capSize, letterSpacing:'0.14em',
        textTransform:'uppercase', color:'rgba(255,255,255,0.7)', fontWeight:600,
      }}>{label}</div>
    </>}
  </div>;
}

// Logo lockup — positioned top-right on ads per brand rules.
function LogoLockup({ variant='pg', tone='light', markOnly=false, style }) {
  return <div style={{ position:'absolute', top:28, right:28, ...style }}>
    <Logo variant={variant} tone={tone} width={markOnly ? 44 : 120} markOnly={markOnly}/>
  </div>;
}

// Canvas — aspect-ratio container for a marketing asset. dims in logical px.
function Canvas({ w, h, bg=C.mint, children, label, style }) {
  return <div style={{
    width: w, height: h, background: bg, position:'relative', overflow:'hidden',
    fontFamily:'Manrope, sans-serif', color: C.charcoal, ...style,
  }} data-asset-label={label}>{children}</div>;
}

Object.assign(window, { C, Logo, BrandMark, Overline, Headline, Sub, Glass, Pill, CTA, PhotoCutout, LogoLockup, Canvas });
