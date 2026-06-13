import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ── Timeline (30fps) ──────────────────────────────────────────────────────────
// Slide 1  Hook      :   0 – 140  (4.7s)
// Slide 2  Pain 1    : 130 – 250  (4s)
// Slide 3  Pain 2    : 240 – 360  (4s)
// Slide 4  Pain 3    : 350 – 470  (4s)
// Slide 5  CTA       : 460 – 620  (5.3s)
// Total: 620 frames ≈ 20.7s
export const FB_PAIN_DURATION = 620;

const BG   = '#0A0F1E';
const RED  = '#E8291A';
const BLUE = '#2B7FE0';
const W    = 1080;
const H    = 1080;

const TOP_3_PAINS = [
  { badge: 'সমস্যা ০১', text: 'ব্যবসার প্রক্রিয়ার সাথে সফটওয়্যার পুরোপুরি মেলে না' },
  { badge: 'সমস্যা ০২', text: 'বাংলাদেশের ভ্যাট ও ট্যাক্স নিয়মের সাথে সামঞ্জস্য নেই' },
  { badge: 'সমস্যা ০৩', text: 'সমস্যা হলে দ্রুত লোকাল সাপোর্ট পাওয়া যায় না' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function useSlide(startFrame: number, duration: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const enterSpring = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 22, stiffness: 185, mass: 0.85 },
    durationInFrames: 20,
  });
  const enterX = interpolate(enterSpring, [0, 1], [W, 0]);

  const exitProgress = interpolate(local, [duration - 18, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitX = interpolate(exitProgress, [0, 1], [0, -W]);

  const translateX    = local < 0 ? W : enterX + exitX;
  const contentOpacity = interpolate(Math.max(0, local), [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  const visible        = local >= 0 && local <= duration;

  return { local, fps, translateX, contentOpacity, visible };
}

const BgGlow: React.FC<{ color?: string }> = ({ color = '#1A3C6E' }) => (
  <div style={{
    position: 'absolute', width: 860, height: 860, borderRadius: '50%',
    background: `radial-gradient(circle, ${color}44 0%, transparent 65%)`,
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
  }} />
);

const CircuitLines: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.13, pointerEvents: 'none' }}>
    <line x1="820" y1="0"   x2="820" y2="270" stroke={BLUE} strokeWidth="1.5" />
    <line x1="820" y1="270" x2="980" y2="270" stroke={BLUE} strokeWidth="1.5" />
    <circle cx="980" cy="270" r="5" fill={BLUE} />
    <line x1="940" y1="510" x2="1080" y2="510" stroke={BLUE} strokeWidth="1" />
    <circle cx="940" cy="510" r="4" fill={BLUE} />
    <line x1="50"  y1="740" x2="50"  y2="1000" stroke={BLUE} strokeWidth="1" />
    <circle cx="50" cy="740" r="4" fill={BLUE} />
  </svg>
);

const Logo: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ position: 'absolute', top: 38, left: 46, backgroundColor: 'white', borderRadius: 16, padding: '12px 22px', opacity, zIndex: 50 }}>
    <Img src={staticFile('invatiqsoft-logo-color.png')} style={{ height: 52, objectFit: 'contain' }} />
  </div>
);

const SlideBase: React.FC<{ translateX: number; glowColor?: string; children: React.ReactNode }> = ({ translateX, glowColor, children }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundColor: BG, transform: `translateX(${translateX}px)`, overflow: 'hidden', fontFamily: `'Noto Sans Bengali', sans-serif` }}>
    <BgGlow color={glowColor} />
    <CircuitLines />
    {children}
  </div>
);

// ── Slide 1 — Hook ───────────────────────────────────────────────────────────
const Slide1Hook: React.FC = () => {
  const { local, fps, translateX, contentOpacity, visible } = useSlide(0, 140);
  if (!visible) return null;

  const h = spring({ frame: Math.max(0, local), fps, config: { damping: 18, stiffness: 160 }, durationInFrames: 22 });
  const hY = interpolate(h, [0, 1], [55, 0]);

  const s = spring({ frame: Math.max(0, local - 14), fps, config: { damping: 16, stiffness: 140 }, durationInFrames: 22 });
  const sY  = interpolate(s, [0, 1], [35, 0]);
  const sOp = interpolate(s, [0, 1], [0, 1]);

  return (
    <SlideBase translateX={translateX}>
      <Logo opacity={contentOpacity} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 72, paddingRight: 72, paddingTop: 130 }}>
        <div style={{ width: interpolate(h, [0, 1], [0, 130]), height: 7, backgroundColor: RED, borderRadius: 4, marginBottom: 30, opacity: contentOpacity }} />

        <div style={{ transform: `translateY(${hY}px)`, opacity: contentOpacity }}>
          <p style={{ fontSize: 64, fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.35 }}>সফটওয়্যার কিনেও কি</p>
          <p style={{ fontSize: 64, fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.35 }}>আপনার ব্যবসার সমস্যা</p>
          <p style={{ fontSize: 64, fontWeight: 800, color: RED,   margin: 0, lineHeight: 1.35 }}>সমাধান হচ্ছে না?</p>
        </div>

        <div style={{ transform: `translateY(${sY}px)`, opacity: sOp, marginTop: 36 }}>
          <p style={{ fontSize: 38, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>বাংলাদেশের হাজারো ব্যবসা এই সমস্যায় আছে।</p>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, opacity: sOp * 0.6 }}>
        <span style={{ color: '#999', fontSize: 26 }}>Swipe to see</span>
        <span style={{ color: BLUE, fontSize: 28 }}>→</span>
      </div>
    </SlideBase>
  );
};

// ── Slides 2–4 — Pain Points ─────────────────────────────────────────────────
const PAIN_STARTS = [130, 240, 350];

const PainSlide: React.FC<{ index: number }> = ({ index }) => {
  const { local, fps, translateX, contentOpacity, visible } = useSlide(PAIN_STARTS[index], 120);
  if (!visible) return null;

  const pain = TOP_3_PAINS[index];

  const xSp = spring({ frame: Math.max(0, local - 8), fps, config: { damping: 18, stiffness: 155 }, durationInFrames: 22 });
  const xVal = interpolate(xSp, [0, 1], [80, 0]);
  const xOp  = interpolate(xSp, [0, 1], [0, 1]);

  const sSp = spring({ frame: Math.max(0, local - 20), fps, config: { damping: 16, stiffness: 140 }, durationInFrames: 22 });
  const sOp = interpolate(sSp, [0, 1], [0, 1]);
  const sY  = interpolate(sSp, [0, 1], [25, 0]);

  const progress = (index + 1) / 3;
  const barWidth = interpolate(Math.max(0, local - 10), [0, 30], [0, W * 0.82 * progress], { extrapolateRight: 'clamp' });

  return (
    <SlideBase translateX={translateX} glowColor="#E8291A">
      <Logo opacity={contentOpacity} />

      {/* Badge top right */}
      <div style={{ position: 'absolute', top: 42, right: 46, backgroundColor: RED, borderRadius: 14, paddingTop: 10, paddingBottom: 10, paddingLeft: 26, paddingRight: 26, opacity: contentOpacity }}>
        <span style={{ color: 'white', fontSize: 30, fontWeight: 700 }}>{pain.badge}</span>
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 68, paddingRight: 68, paddingTop: 120 }}>
        {/* X icon */}
        <div style={{ opacity: contentOpacity, marginBottom: 40 }}>
          <div style={{ width: 116, height: 116, borderRadius: 24, backgroundColor: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 48px 8px ${RED}44` }}>
            <svg width="62" height="62" viewBox="0 0 24 24">
              <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="21" y1="3" x2="3" y2="21" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div style={{ transform: `translateX(${xVal}px)`, opacity: xOp }}>
          <p style={{ fontSize: 56, fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.45 }}>{pain.text}</p>
        </div>

        {/* Progress bar */}
        <div style={{ transform: `translateY(${sY}px)`, opacity: sOp, marginTop: 48 }}>
          <div style={{ width: W * 0.82, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
            <div style={{ width: barWidth, height: 5, backgroundColor: RED, borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: 14 }}>{index + 1} / 3 সমস্যা</p>
        </div>
      </div>
    </SlideBase>
  );
};

// ── Slide 5 — CTA ────────────────────────────────────────────────────────────
const Slide5CTA: React.FC = () => {
  const { local, fps, translateX, contentOpacity, visible } = useSlide(460, 160);
  if (!visible) return null;

  const tSp = spring({ frame: Math.max(0, local), fps, config: { damping: 20, stiffness: 175 }, durationInFrames: 22 });
  const tY  = interpolate(tSp, [0, 1], [50, 0]);

  const bSp = spring({ frame: Math.max(0, local - 20), fps, config: { damping: 16, stiffness: 150 }, durationInFrames: 22 });
  const bSc = interpolate(bSp, [0, 1], [0.72, 1]);
  const bOp = interpolate(bSp, [0, 1], [0, 1]);

  const subOp = interpolate(Math.max(0, local - 32), [0, 22], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SlideBase translateX={translateX} glowColor="#2B7FE0">
      <Logo opacity={contentOpacity} />

      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 120, paddingLeft: 60, paddingRight: 60 }}>
        <div style={{ transform: `translateY(${tY}px)`, opacity: contentOpacity, textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 56, fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.4 }}>আপনার সফটওয়্যার নিয়ে</p>
          <p style={{ fontSize: 56, fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.4 }}>সবচেয়ে বড় সমস্যাটি কী?</p>
          <p style={{ fontSize: 34, color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: 16 }}>কমেন্টে জানাতে পারেন।</p>
        </div>

        <div style={{ transform: `scale(${bSc})`, opacity: bOp, backgroundColor: BLUE, borderRadius: 26, paddingTop: 34, paddingBottom: 34, paddingLeft: 68, paddingRight: 68, boxShadow: `0 0 80px 16px #2B7FE055`, marginTop: 16 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#FFF' }}>👍 InvatiqSoft Follow করুন</span>
        </div>

        <div style={{ opacity: bOp, marginTop: 28 }}>
          <p style={{ fontSize: 36, fontWeight: 700, color: BLUE, margin: 0 }}>@InvatiqSoft</p>
        </div>

        <div style={{ position: 'absolute', bottom: 44, opacity: subOp * 0.5 }}>
          <p style={{ fontSize: 24, color: '#666', margin: 0, textAlign: 'center' }}>
            #BusinessSoftware #BangladeshBusiness #InvatiqSoft
          </p>
        </div>
      </div>
    </SlideBase>
  );
};

// ── Root ─────────────────────────────────────────────────────────────────────
export const FbPainVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG, fontFamily: `'Noto Sans Bengali', sans-serif` }}>
    <Slide1Hook />
    <PainSlide index={0} />
    <PainSlide index={1} />
    <PainSlide index={2} />
    <Slide5CTA />
  </AbsoluteFill>
);
