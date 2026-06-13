import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
  Audio,
} from 'remotion';

export const FB_LIGHT_DURATION = 630;

const W    = 1080;
const H    = 1080;
const WHITE = '#F8FAFB';
const NAVY  = '#0D1B2A';
const BLUE  = '#2B7FE0';
const RED   = '#E8291A';
const GRAY  = '#6B7280';
const FONT  = `'Noto Sans Bengali', sans-serif`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function spr(frame: number, fps: number, delay = 0, damping = 20, stiff = 160) {
  return spring({ frame: Math.max(0, frame - delay), fps, config: { damping, stiffness: stiff, mass: 0.9 }, durationInFrames: 24 });
}
const tx0 = (s: number) => interpolate(s, [0, 1], [-70, 0]);
const op0 = (s: number) => interpolate(s, [0, 1], [0, 1]);
const ty0 = (s: number) => interpolate(s, [0, 1], [30, 0]);
const sc0 = (s: number) => interpolate(s, [0, 1], [0.6, 1]);

// ── Shared slide enter/exit ───────────────────────────────────────────────────
function useSlideAnim(start: number, dur: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const enterSp = spr(local, fps, 0, 24, 200);
  const enterX  = interpolate(enterSp, [0, 1], [W, 0]);
  const exitProg = interpolate(local, [dur - 16, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitX   = interpolate(exitProg, [0, 1], [0, -W]);
  const txVal   = local < 0 ? W : enterX + exitX;
  const baseOp  = interpolate(Math.max(0, local), [0, 14], [0, 1], { extrapolateRight: 'clamp' });
  const visible = local >= 0 && local <= dur + 20;
  return { local, fps, txVal, baseOp, visible };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Logo: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ position: 'absolute', top: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op0(s), transform: `scale(${interpolate(s,[0,1],[0.8,1])})` }}>
    <Img src={staticFile('invatiqsoft-logo-color.png')} style={{ height: 66, objectFit: 'contain' }} />
  </div>
);

const Banner: React.FC<{ s: number; counter?: string }> = ({ s, counter }) => (
  <div style={{ position: 'absolute', bottom: 0, left: 0, width: W, height: 84, backgroundColor: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 50, paddingRight: 44, transform: `translateY(${interpolate(s,[0,1],[84,0])}px)`, opacity: op0(s) }}>
    <span style={{ fontFamily: FONT, fontSize: 31, fontWeight: 700, color: 'white' }}>স্মার্ট ব্যবসার জন্য স্মার্ট সমাধান</span>
    {counter && <span style={{ fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{counter}</span>}
  </div>
);

const XMark: React.FC<{ s: number; size?: number }> = ({ s, size = 104 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.2, backgroundColor: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${sc0(s)})`, opacity: op0(s), boxShadow: `0 6px 28px ${RED}44`, flexShrink: 0 }}>
    <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24">
      <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="21" y1="3" x2="3" y2="21" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
);

const RedBadge: React.FC<{ s: number; text: string }> = ({ s, text }) => (
  <div style={{ position: 'absolute', top: 32, right: 46, backgroundColor: RED, borderRadius: 14, paddingTop: 10, paddingBottom: 10, paddingLeft: 26, paddingRight: 26, transform: `translateX(${interpolate(s,[0,1],[120,0])}px)`, opacity: op0(s) }}>
    <span style={{ fontFamily: FONT, fontSize: 30, fontWeight: 700, color: 'white' }}>{text}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — Hook
// ─────────────────────────────────────────────────────────────────────────────
const Slide1: React.FC = () => {
  const { local, fps, txVal, baseOp, visible } = useSlideAnim(0, 135);
  // ALL hooks before any return
  const logoS   = spr(local, fps, 0,  20, 180);
  const accentS = spr(local, fps, 4,  22, 180);
  const line1S  = spr(local, fps, 10, 20, 162);
  const line2S  = spr(local, fps, 17, 20, 158);
  const line3S  = spr(local, fps, 24, 18, 152);
  const p0S     = spr(local, fps, 36, 18, 155);
  const p1S     = spr(local, fps, 44, 18, 155);
  const p2S     = spr(local, fps, 52, 18, 155);
  const p3S     = spr(local, fps, 60, 18, 155);
  const bannerS = spr(local, fps, 40, 22, 170);
  const qS      = spr(local, fps, 20, 16, 140);

  if (!visible) return null;

  const painSprings = [p0S, p1S, p2S, p3S];
  const painItems   = ['সময় নষ্ট', 'অপ্রয়োজনীয় জটিলতা', 'অতিরিক্ত খরচ', 'সাপোর্ট নেই'];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: WHITE, transform: `translateX(${txVal}px)`, overflow: 'hidden', fontFamily: FONT }}>
      <Logo s={logoS} />

      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 128, left: 52, width: interpolate(accentS,[0,1],[0,160]), height: 7, backgroundColor: RED, borderRadius: 4, opacity: baseOp }} />

      {/* Headline */}
      <div style={{ position: 'absolute', top: 148, left: 52, right: 52 }}>
        {[
          { text: 'আপনার Software কি', s: line1S },
          { text: 'আপনার ব্যবসার জন্য,', s: line2S },
        ].map(({ text, s }, i) => (
          <p key={i} style={{ fontSize: 60, fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1.35, transform: `translateX(${tx0(s)}px)`, opacity: op0(s) }}>{text}</p>
        ))}
        <div style={{ marginTop: 10, transform: `translateX(${tx0(line3S)}px)`, opacity: op0(line3S) }}>
          <div style={{ backgroundColor: BLUE, borderRadius: 12, paddingTop: 8, paddingBottom: 8, paddingLeft: 20, paddingRight: 20, display: 'inline-block' }}>
            <p style={{ fontSize: 50, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.3 }}>নাকি আপনার ব্যবসা Software-এর জন্য?</p>
          </div>
        </div>
      </div>

      {/* Pain items */}
      <div style={{ position: 'absolute', top: 494, left: 52, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {painItems.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, transform: `translateX(${tx0(painSprings[i])}px)`, opacity: op0(painSprings[i]) }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="3.2" strokeLinecap="round" /><line x1="20" y1="4" x2="4" y2="20" stroke="white" strokeWidth="3.2" strokeLinecap="round" /></svg>
            </div>
            <span style={{ fontSize: 32, fontWeight: 600, color: NAVY }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Big ? */}
      <div style={{ position: 'absolute', right: 44, top: 470, opacity: op0(qS) * 0.12, transform: `scale(${sc0(qS)})` }}>
        <span style={{ fontSize: 200, fontWeight: 900, color: BLUE, lineHeight: 1 }}>?</span>
      </div>

      <Banner s={bannerS} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — Customization সমস্যা
// ─────────────────────────────────────────────────────────────────────────────
const Slide2: React.FC = () => {
  const { local, fps, txVal, baseOp, visible } = useSlideAnim(120, 135);
  const logoS   = spr(local, fps, 0,  20, 180);
  const badgeS  = spr(local, fps, 6,  18, 200);
  const accentS = spr(local, fps, 6,  22, 180);
  const xS      = spr(local, fps, 8,  14, 220);
  const headS   = spr(local, fps, 10, 20, 165);
  const l0S     = spr(local, fps, 26, 18, 150);
  const l1S     = spr(local, fps, 34, 18, 150);
  const l2S     = spr(local, fps, 42, 18, 150);
  const l3S     = spr(local, fps, 50, 18, 150);
  const lineS   = spr(local, fps, 30, 18, 155);
  const bannerS = spr(local, fps, 40, 22, 170);

  if (!visible) return null;

  const lSps  = [l0S, l1S, l2S, l3S];
  const lines = ['বিদেশি সফটওয়্যার আপনার ব্যবসার', 'প্রক্রিয়ার সাথে পুরোপুরি মেলে না।', 'আপনাকেই সফটওয়্যারের মতো', 'করে কাজ করতে হয়।'];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: WHITE, transform: `translateX(${txVal}px)`, overflow: 'hidden', fontFamily: FONT }}>
      <Logo s={logoS} />
      <RedBadge s={badgeS} text="সমস্যা ০১" />

      <div style={{ position: 'absolute', top: 128, left: 52, width: interpolate(accentS,[0,1],[0,140]), height: 6, backgroundColor: RED, borderRadius: 3, opacity: baseOp }} />

      <div style={{ position: 'absolute', top: 148, left: 52 }}><XMark s={xS} size={96} /></div>
      <div style={{ position: 'absolute', top: 142, left: 172 }}>
        <p style={{ fontSize: 62, fontWeight: 900, color: NAVY, margin: 0, lineHeight: 1.25, transform: `translateX(${tx0(headS)}px)`, opacity: op0(headS) }}>Customization</p>
        <p style={{ fontSize: 62, fontWeight: 900, color: RED,  margin: 0, lineHeight: 1.25, transform: `translateX(${tx0(headS)}px)`, opacity: op0(headS) }}>সমস্যা</p>
      </div>

      <div style={{ position: 'absolute', top: 308, left: 52, right: 52, height: 2, backgroundColor: `${NAVY}14`, opacity: baseOp }} />

      {lines.map((line, i) => (
        <p key={i} style={{ position: 'absolute', top: 326 + i * 66, left: 52, right: 60, fontSize: 40, color: i < 2 ? NAVY : GRAY, fontWeight: i < 2 ? 600 : 400, margin: 0, lineHeight: 1.5, transform: `translateY(${ty0(lSps[i])}px)`, opacity: op0(lSps[i]) }}>{line}</p>
      ))}

      <div style={{ position: 'absolute', bottom: 104, left: 52, right: 52, backgroundColor: `${BLUE}10`, border: `2px solid ${BLUE}28`, borderRadius: 18, padding: '18px 26px', transform: `translateY(${ty0(lineS)}px)`, opacity: op0(lineS) }}>
        <p style={{ fontFamily: FONT, fontSize: 30, color: BLUE, fontWeight: 600, margin: 0 }}>সঠিক সফটওয়্যার আপনার ব্যবসার সাথে মানিয়ে নেয়।</p>
      </div>

      <Banner s={bannerS} counter="2 / 5" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — VAT & Tax
// ─────────────────────────────────────────────────────────────────────────────
const Slide3: React.FC = () => {
  const { local, fps, txVal, baseOp, visible } = useSlideAnim(240, 135);
  const logoS   = spr(local, fps, 0,  20, 180);
  const badgeS  = spr(local, fps, 6,  18, 200);
  const accentS = spr(local, fps, 4,  22, 180);
  const xS      = spr(local, fps, 8,  14, 220);
  const headS   = spr(local, fps, 10, 20, 165);
  const subS    = spr(local, fps, 24, 18, 150);
  const b0S     = spr(local, fps, 36, 18, 150);
  const b1S     = spr(local, fps, 48, 18, 150);
  const b2S     = spr(local, fps, 60, 18, 150);
  const bannerS = spr(local, fps, 40, 22, 170);

  if (!visible) return null;

  const stats   = [{ label: 'ভ্যাট হিসাব', pct: 85 }, { label: 'ট্যাক্স রিটার্ন', pct: 70 }, { label: 'NBR সামঞ্জস্য', pct: 45 }];
  const bSps    = [b0S, b1S, b2S];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: WHITE, transform: `translateX(${txVal}px)`, overflow: 'hidden', fontFamily: FONT }}>
      <svg style={{ position: 'absolute', right: -20, top: 90, opacity: 0.05 }} width="400" height="480" viewBox="0 0 100 120">
        <path d="M50,5 L80,20 L90,50 L75,80 L60,100 L40,110 L20,90 L10,60 L25,30 Z" fill={BLUE} />
      </svg>
      <Logo s={logoS} />
      <RedBadge s={badgeS} text="সমস্যা ০২" />

      <div style={{ position: 'absolute', top: 128, left: 52, width: interpolate(accentS,[0,1],[0,140]), height: 6, backgroundColor: RED, borderRadius: 3, opacity: baseOp }} />
      <div style={{ position: 'absolute', top: 148, left: 52 }}><XMark s={xS} size={96} /></div>
      <div style={{ position: 'absolute', top: 142, left: 172 }}>
        <p style={{ fontSize: 62, fontWeight: 900, color: NAVY, margin: 0, lineHeight: 1.25, transform: `translateX(${tx0(headS)}px)`, opacity: op0(headS) }}>VAT ও Tax</p>
        <p style={{ fontSize: 62, fontWeight: 900, color: RED,  margin: 0, lineHeight: 1.25, transform: `translateX(${tx0(headS)}px)`, opacity: op0(headS) }}>সীমাবদ্ধতা</p>
      </div>

      <div style={{ position: 'absolute', top: 308, left: 52, right: 52, height: 2, backgroundColor: `${NAVY}14`, opacity: baseOp }} />
      <p style={{ position: 'absolute', top: 324, left: 52, right: 60, fontSize: 36, color: GRAY, margin: 0, lineHeight: 1.65, transform: `translateY(${ty0(subS)}px)`, opacity: op0(subS) }}>বাংলাদেশের NBR VAT ও Tax নিয়মের সাথে বেশিরভাগ বিদেশি সফটওয়্যার সম্পূর্ণ সামঞ্জস্যপূর্ণ নয়।</p>

      <div style={{ position: 'absolute', bottom: 104, left: 52, right: 52, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {stats.map((s, i) => {
          const barW = interpolate(bSps[i], [0, 1], [0, (W - 104) * s.pct / 100]);
          return (
            <div key={i} style={{ opacity: op0(bSps[i]) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 28, color: NAVY, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 26, color: RED, fontWeight: 700 }}>{s.pct}% সমস্যা</span>
              </div>
              <div style={{ width: '100%', height: 11, backgroundColor: `${RED}18`, borderRadius: 6 }}>
                <div style={{ width: barW, height: 11, backgroundColor: RED, borderRadius: 6 }} />
              </div>
            </div>
          );
        })}
      </div>

      <Banner s={bannerS} counter="3 / 5" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4 — Subscription + Support
// ─────────────────────────────────────────────────────────────────────────────
const Slide4: React.FC = () => {
  const { local, fps, txVal, baseOp, visible } = useSlideAnim(360, 135);
  const logoS   = spr(local, fps, 0,  20, 180);
  const accentS = spr(local, fps, 4,  22, 180);
  const b0S     = spr(local, fps, 8,  18, 200);
  const x0S     = spr(local, fps, 12, 14, 220);
  const s0S     = spr(local, fps, 20, 16, 145);
  const b1S     = spr(local, fps, 34, 18, 200);
  const x1S     = spr(local, fps, 38, 14, 220);
  const s1S     = spr(local, fps, 46, 16, 145);
  const bannerS = spr(local, fps, 44, 22, 170);

  if (!visible) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: WHITE, transform: `translateX(${txVal}px)`, overflow: 'hidden', fontFamily: FONT }}>
      <Logo s={logoS} />
      <div style={{ position: 'absolute', top: 128, left: 52, width: interpolate(accentS,[0,1],[0,200]), height: 6, backgroundColor: RED, borderRadius: 3, opacity: baseOp }} />

      {/* Item 1 */}
      <div style={{ position: 'absolute', top: 158, left: 52, right: 52 }}>
        <div style={{ display: 'inline-block', backgroundColor: RED, borderRadius: 10, paddingTop: 6, paddingBottom: 6, paddingLeft: 18, paddingRight: 18, marginBottom: 16, transform: `translateX(${tx0(b0S)}px)`, opacity: op0(b0S) }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>সমস্যা ০৩</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, transform: `translateX(${tx0(b0S)}px)`, opacity: op0(b0S) }}>
          <XMark s={x0S} size={88} />
          <div>
            <p style={{ fontSize: 52, fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1.2 }}>Subscription খরচ</p>
            <p style={{ fontSize: 32, color: GRAY, margin: 0, marginTop: 10, lineHeight: 1.5, transform: `translateY(${ty0(s0S)}px)`, opacity: op0(s0S) }}>প্রতি মাসে বড় খরচ, অথচ দরকারি ফিচার নেই।</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 448, left: 52, right: 52, height: 2, backgroundColor: `${NAVY}12`, opacity: baseOp }} />

      {/* Item 2 */}
      <div style={{ position: 'absolute', top: 468, left: 52, right: 52 }}>
        <div style={{ display: 'inline-block', backgroundColor: RED, borderRadius: 10, paddingTop: 6, paddingBottom: 6, paddingLeft: 18, paddingRight: 18, marginBottom: 16, transform: `translateX(${tx0(b1S)}px)`, opacity: op0(b1S) }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>সমস্যা ০৪</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, transform: `translateX(${tx0(b1S)}px)`, opacity: op0(b1S) }}>
          <XMark s={x1S} size={88} />
          <div>
            <p style={{ fontSize: 52, fontWeight: 800, color: NAVY, margin: 0, lineHeight: 1.2 }}>Local Support নেই</p>
            <p style={{ fontSize: 32, color: GRAY, margin: 0, marginTop: 10, lineHeight: 1.5, transform: `translateY(${ty0(s1S)}px)`, opacity: op0(s1S) }}>সমস্যা হলে দ্রুত সাহায্য পাওয়া যায় না।</p>
          </div>
        </div>
      </div>

      <Banner s={bannerS} counter="4 / 5" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 5 — CTA
// ─────────────────────────────────────────────────────────────────────────────
const Slide5: React.FC = () => {
  const frame = useCurrentFrame();
  const { local, fps, txVal, baseOp, visible } = useSlideAnim(480, 150);
  const logoS  = spr(local, fps, 0,  20, 180);
  const headS  = spr(local, fps, 8,  20, 165);
  const subS   = spr(local, fps, 20, 18, 155);
  const btnS   = spr(local, fps, 32, 14, 220);
  const tagS   = spr(local, fps, 44, 16, 145);
  const bannerS = spr(local, fps, 44, 22, 170);

  if (!visible) return null;

  const pulse = 1 + 0.035 * Math.sin(((frame - 480) / 30) * Math.PI * 2 * 1.5);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: WHITE, transform: `translateX(${txVal}px)`, overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${BLUE}16 0%, transparent 65%)` }} />
      <Logo s={logoS} />

      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H - 84, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: 60, paddingRight: 60, paddingTop: 100 }}>
        <div style={{ textAlign: 'center', transform: `translateY(${ty0(headS)}px)`, opacity: op0(headS), marginBottom: 18 }}>
          <p style={{ fontSize: 58, fontWeight: 900, color: NAVY, margin: 0, lineHeight: 1.35 }}>আপনার সফটওয়্যার নিয়ে</p>
          <p style={{ fontSize: 58, fontWeight: 900, color: NAVY, margin: 0, lineHeight: 1.35 }}>সবচেয়ে বড় সমস্যাটি কী?</p>
        </div>

        <div style={{ textAlign: 'center', transform: `translateY(${ty0(subS)}px)`, opacity: op0(subS), marginBottom: 50 }}>
          <p style={{ fontSize: 34, color: GRAY, margin: 0, lineHeight: 1.6 }}>কমেন্টে জানান। InvatiqSoft আপনার জন্য সমাধান তৈরি করে।</p>
        </div>

        <div style={{ transform: `scale(${sc0(btnS) * pulse})`, opacity: op0(btnS), backgroundColor: BLUE, borderRadius: 26, paddingTop: 34, paddingBottom: 34, paddingLeft: 68, paddingRight: 68, boxShadow: `0 8px 48px ${BLUE}55`, marginBottom: 24 }}>
          <span style={{ fontSize: 46, fontWeight: 800, color: 'white' }}>👍 Page Follow করুন</span>
        </div>

        <div style={{ transform: `translateY(${ty0(tagS)}px)`, opacity: op0(tagS) }}>
          <p style={{ fontSize: 36, fontWeight: 700, color: BLUE, margin: 0, textAlign: 'center' }}>@InvatiqSoft</p>
        </div>
      </div>

      <Banner s={bannerS} counter="5 / 5" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export const FbLightCarousel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: WHITE, fontFamily: FONT }}>
    <Audio src={staticFile('audio/bg_music.mp3')} volume={0.18} />
    <Slide1 />
    <Slide2 />
    <Slide3 />
    <Slide4 />
    <Slide5 />
  </AbsoluteFill>
);
