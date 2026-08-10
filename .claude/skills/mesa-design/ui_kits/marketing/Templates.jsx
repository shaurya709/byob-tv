// Template compositions for Mesa marketing assets.
// All templates accept props to swap copy; all render at their native logical px dims.

// ——— Template 1: Square social post (1080×1080) — headline + brand mark + cut-out
function SocialSquare({ kicker='Cohort 02 · 2026', headline='Learn to build, not to analyse.', sub='A 12-month PG in Startup Leadership & Entrepreneurship. In-person, Bengaluru.', cta='Apply →', bg=C.mint, accent='green', logoTone='light', showCutout=true }) {
  const dark = bg === C.charcoal || bg === C.teal || bg === C.forest;
  return (
    <Canvas w={1080} h={1080} bg={bg} label="social-1-1">
      <LogoLockup variant="pg" tone={dark?'dark':'light'} />
      <div style={{ position:'absolute', top:72, left:72, display:'flex', alignItems:'flex-start', gap:18 }}>
        <BrandMark variant="solid" color={accent} size={54} style={{ marginTop: 14 }}/>
        <Overline color={dark ? C.mint300 : C.forest}>{kicker}</Overline>
      </div>
      <div style={{ position:'absolute', left:72, top:180, right:72 }}>
        <Headline size={108} weight={700} color={dark?C.white:C.charcoal} style={{ lineHeight: 1 }}>{headline}</Headline>
        <Sub size={26} color={dark?C.mint300:C.forest} style={{ marginTop: 28, maxWidth: 820 }}>{sub}</Sub>
      </div>
      {showCutout && (
        <div style={{ position:'absolute', right:60, bottom:60, display:'flex', alignItems:'center', gap:20 }}>
          <PhotoCutout size={320} bg={dark?C.bright:C.forest} label="founder"/>
        </div>
      )}
      <div style={{ position:'absolute', left:72, bottom:72 }}>
        <CTA variant={dark?'primary':'dark'}>{cta}</CTA>
      </div>
    </Canvas>
  );
}

// ——— Template 2: Story / Reel (1080×1920) — vertical, photo cut-out top, headline bottom
function StoryReel({ kicker='Meet the cohort', headline='\u201CMesa put me in the room.\u201D', attribution='— Riya · Cohort 01', sub='Now building Quilt.', cta='Watch the film ▶', bg=C.teal, accent='tangerine' }) {
  return (
    <Canvas w={1080} h={1920} bg={bg} label="story-9-16">
      <LogoLockup variant="pg" tone="dark" markOnly/>
      <div style={{ position:'absolute', left:0, right:0, top:180, display:'flex', justifyContent:'center' }}>
        <PhotoCutout size={840} bg={C.tangerine} label="founder portrait"/>
      </div>
      <div style={{ position:'absolute', left:72, right:72, bottom:260 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom: 28 }}>
          <BrandMark variant="filled-concentric" color={accent} size={48}/>
          <Overline color={C.mint300}>{kicker}</Overline>
        </div>
        <Headline size={92} italic color={C.white} style={{ lineHeight: 1.02 }}>{headline}</Headline>
        <div style={{ marginTop: 24 }}>
          <Sub size={24} color={C.mint300} weight={600}>{attribution}</Sub>
          <Sub size={22} color={C.mint300} style={{ marginTop: 8 }}>{sub}</Sub>
        </div>
      </div>
      <div style={{ position:'absolute', left:72, bottom:90 }}>
        <CTA variant="warm">{cta}</CTA>
      </div>
    </Canvas>
  );
}

// ——— Template 3: YouTube / widescreen (1920×1080) — editorial split
function YouTubeWide({ kicker='Mesa · 2026 intake', headline='India\u2019s first PG in Startup Leadership.', sub='Twelve months. In-person. Bengaluru. Operators teaching operators.', cta='Apply for Cohort 02 →' }) {
  return (
    <Canvas w={1920} h={1080} bg={C.mint} label="youtube-16-9">
      <LogoLockup variant="pg" tone="light"/>
      {/* Left: text block */}
      <div style={{ position:'absolute', left:96, top:180, right: 960 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom: 28 }}>
          <BrandMark variant="solid" color="green" size={56}/>
          <Overline>{kicker}</Overline>
        </div>
        <Headline size={88} weight={700} style={{ lineHeight: 1 }}>{headline}</Headline>
        <Sub size={24} style={{ marginTop: 32, maxWidth: 760 }}>{sub}</Sub>
        <div style={{ marginTop: 44 }}>
          <CTA variant="dark">{cta}</CTA>
        </div>
      </div>
      {/* Right: photo cut-out over tangerine surface */}
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:800, background:C.tangerine, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <PhotoCutout size={720} bg={C.forest} label="cohort"/>
        <div style={{ position:'absolute', top:48, right:48 }}>
          <BrandMark variant="lined-concentric" color="charcoal" size={72}/>
        </div>
      </div>
    </Canvas>
  );
}

// ——— Template 4: Feed ad (1080×1350, 4:5) — bold hero
function FeedAd45({ kicker='Early deadline · 30 June', headline='Build it. Don\u2019t just study it.', sub='12 months · in-person · Bengaluru', cta='Apply now →', bg=C.charcoal }) {
  return (
    <Canvas w={1080} h={1350} bg={bg} label="feed-4-5">
      <LogoLockup variant="pg" tone="dark"/>
      <div style={{ position:'absolute', left:72, top:140, right:72, display:'flex', alignItems:'center', gap:18 }}>
        <BrandMark variant="solid" color="tangerine" size={60}/>
        <Overline color={C.tangerine200}>{kicker}</Overline>
      </div>
      <div style={{ position:'absolute', left:72, top:270, right:72 }}>
        <Headline size={124} weight={700} color={C.white} style={{ lineHeight: 0.96 }}>{headline}</Headline>
      </div>
      <div style={{ position:'absolute', left:72, bottom:260, right:72 }}>
        <Glass tone="dark" radius={18} pad={28} style={{ maxWidth: 560 }}>
          <Sub size={26} color={C.white} weight={500}>{sub}</Sub>
        </Glass>
      </div>
      <div style={{ position:'absolute', left:72, bottom:96 }}>
        <CTA variant="primary">{cta}</CTA>
      </div>
    </Canvas>
  );
}

// ——— Template 5: Quote card (1:1) — serif-forward, minimal
function QuoteCard({ quote='\u201CMesa didn\u2019t teach me a framework. It put me in the room.\u201D', attribution='Riya Sharma', role='Cohort 01 · founder, Quilt', bg=C.mint }) {
  return (
    <Canvas w={1080} h={1080} bg={C.mint} label="quote-1-1">
      <LogoLockup variant="pg" tone="light" markOnly/>
      <div style={{ position:'absolute', top:120, left:90 }}>
        <BrandMark variant="solid" color="green" size={96}/>
      </div>
      <div style={{ position:'absolute', left:90, right:90, top:260 }}>
        <Headline size={76} weight={600} italic style={{ lineHeight: 1.1, color: C.charcoal }}>{quote}</Headline>
      </div>
      <div style={{ position:'absolute', left:90, bottom:130, display:'flex', gap:24, alignItems:'center' }}>
        <PhotoCutout size={180} bg={C.forest} label="photo"/>
        <div>
          <Sub size={28} weight={700} color={C.charcoal}>{attribution}</Sub>
          <Sub size={20} color={C.forest} style={{ marginTop: 4 }}>{role}</Sub>
        </div>
      </div>
    </Canvas>
  );
}

Object.assign(window, { SocialSquare, StoryReel, YouTubeWide, FeedAd45, QuoteCard, EventThumb });

// ——— Template 6: Event thumbnail (speaker + credentials card)
// ratio: '16:9' | '1:1' | '9:16'
function EventThumb({
  ratio='16:9',
  title='Data Storytelling',
  featuring='with Nipun Jasuja',
  date='12th August, Saturday, 2023',
  time='12:00 PM — 1:30 PM',
  credRole='GTM Lead @',
  credCompany='JPMorgan Chase & Co.',
  credSchool='Wharton',
  bg,
  showPlayBadge=false,
  playCount='2.3 M',
}) {
  const dims = { '16:9': [1920,1080], '1:1': [1080,1080], '9:16': [1080,1920] }[ratio];
  const [w,h] = dims;
  const vertical = ratio === '9:16';
  const square = ratio === '1:1';
  const surface = bg || (vertical ? '#9BD9A8' : square ? '#EAF5EC' : C.teal);
  const isLight = vertical || square;

  // Concentric ring backdrop (lined-concentric mark, huge, offset)
  const ringColor = vertical ? 'rgba(17,64,59,0.18)' : square ? 'rgba(110,209,144,0.35)' : 'rgba(110,209,144,0.22)';

  return (
    <Canvas w={w} h={h} bg={surface} label={`event-${ratio}`}>
      {/* Concentric ring backdrop */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{
          position:'absolute',
          width: vertical ? '180%' : square ? '140%' : '120%',
          height: vertical ? '180%' : square ? '140%' : '120%',
          left: vertical ? '-20%' : square ? '-20%' : '-10%',
          top:  vertical ? '-30%' : square ? '-20%' : '-20%',
        }}>
          {[48,40,32,24,16].map((r,i) => (
            <circle key={i} cx={50} cy={50} r={r} fill="none" stroke={ringColor} strokeWidth={0.35}/>
          ))}
        </svg>
      </div>

      {/* Mesa logo mark, top-left on dark/right on light */}
      <div style={{ position:'absolute', top: vertical?40:32, left: vertical?40:32 }}>
        <Logo variant="pg" tone={isLight?'light':'dark'} width={vertical?64:56} markOnly/>
      </div>

      {/* Headline block */}
      <div style={{
        position:'absolute',
        left: vertical ? 0 : square ? 56 : 72,
        right: vertical ? 0 : (square ? '46%' : '42%'),
        top: vertical ? 110 : square ? 140 : 180,
        textAlign: vertical ? 'center' : 'left',
        paddingLeft: vertical ? 60 : 0,
        paddingRight: vertical ? 60 : 0,
      }}>
        <Headline size={vertical?68:square?72:92} weight={700} color={isLight?C.charcoal:C.white} style={{ lineHeight: 1.05 }}>
          {title}{'\u00a0'}
          <span style={{ color: isLight? '#2E9F5B' : C.tangerine, whiteSpace:'nowrap' }}>{featuring}</span>
        </Headline>

        {/* date/time info */}
        <div style={{
          marginTop: vertical?22:28,
          display:'flex', flexDirection:'column', gap:10,
          alignItems: vertical?'center':'flex-start',
          color: isLight?C.forest:C.mint300,
          fontFamily:'Manrope, sans-serif', fontSize: vertical?22:24, fontWeight:500,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
            {date}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            {time}
          </div>
        </div>
      </div>

      {/* Credentials floating card — speech bubble above/near the head */}
      <div style={{
        position:'absolute',
        zIndex: 3,
        ...(ratio==='16:9' ? { right: 340, top: 360 } :
            ratio==='1:1'  ? { right: 120, top: 360 } :
                             { left: '50%', transform:'translateX(-50%)', top: 560 }),
      }}>
        <div style={{
          background:'#fff',
          borderRadius:16,
          padding:'14px 22px',
          boxShadow:'0 12px 32px rgba(11,46,42,0.18)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          minWidth: 220,
          position:'relative',
        }}>
          <div style={{ fontFamily:'Manrope, sans-serif', fontSize:13, fontWeight:600, color:C.charcoal700 }}>{credRole}</div>
          <div style={{ fontFamily:'"Times New Roman",serif', fontSize:20, fontWeight:700, color:C.charcoal, letterSpacing:'-0.01em', lineHeight:1 }}>{credCompany}</div>
          <div style={{ width:'100%', height:1, background:'rgba(17,33,33,0.1)', margin:'4px 0' }}/>
          <div style={{ fontFamily:'"Times New Roman",serif', fontSize:20, fontWeight:700, color:'#990000', fontStyle:'italic', letterSpacing:'-0.01em', lineHeight:1 }}>{credSchool}</div>
          {/* tail pointing to head */}
          <div style={{ position:'absolute', bottom:-10, right:40, width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderTop:'12px solid #fff' }}/>
        </div>
      </div>

      {/* Speaker headshot placeholder — cut-out (no circle frame) */}
      <div style={{
        position:'absolute',
        ...(ratio==='16:9' ? { right: 40, bottom: 0, width: 560, height: 560 } :
            ratio==='1:1'  ? { right: 0,  bottom: 0, width: 480, height: 560 } :
                             { left: '50%', transform:'translateX(-50%)', bottom: 0, width: 720, height: 960 }),
      }}>
        {/* soft ground shadow */}
        <div style={{ position:'absolute', left:'15%', right:'15%', bottom:'6%', height:24, background:'radial-gradient(ellipse at center, rgba(0,0,0,0.22), transparent 70%)' }}/>
        {/* "headshot" placeholder: shoulders + head silhouette */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <svg viewBox="0 0 200 240" style={{ width:'80%', height:'auto' }}>
            {/* shoulders (suit) */}
            <path d="M 10 240 Q 10 170 55 155 L 80 150 L 120 150 L 145 155 Q 190 170 190 240 Z" fill="#3A4A5A"/>
            {/* shirt V */}
            <path d="M 80 152 L 100 200 L 120 152 Z" fill="#E8EEF3"/>
            {/* neck */}
            <rect x="88" y="130" width="24" height="28" fill="#D4A27E"/>
            {/* head */}
            <ellipse cx="100" cy="95" rx="42" ry="52" fill="#D4A27E"/>
            {/* hair */}
            <path d="M 58 92 Q 60 45 100 40 Q 140 45 142 92 Q 142 68 100 64 Q 58 68 58 92 Z" fill="#2C1810"/>
          </svg>
        </div>
      </div>

      {/* 9:16 play badge */}
      {showPlayBadge && vertical && (
        <div style={{ position:'absolute', left:60, bottom:60, display:'flex', alignItems:'center', gap:12, color:C.charcoal, fontFamily:'Manrope,sans-serif', fontWeight:600, fontSize:28 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          {playCount}
        </div>
      )}
    </Canvas>
  );
}
