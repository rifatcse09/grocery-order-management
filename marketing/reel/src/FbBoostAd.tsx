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

// ── Timing (30fps, 18s = 540 frames) ─────────────────────────────────────────
// Phase 1  Hook      :   0 –  95  (3.2s)
// Phase 2  Pain list :  95 – 330  (7.8s)
// Phase 3  CTA       : 330 – 540  (7s)
export const FB_BOOST_DURATION = 540;

const BG = '#0A0F1E';
const RED = '#E8291A';
const BLUE = '#2B7FE0';
const W = 1080;
const H = 1080;

const PAIN_POINTS = [
  { icon: '❌', text: 'Customization করা যায় না' },
  { icon: '❌', text: 'VAT & Tax নিয়মে সমস্যা' },
  { icon: '❌', text: 'মাসে মাসে Subscription খরচ' },
  { icon: '❌', text: 'Local Support পাওয়া যায় না' },
];

// Thin horizontal circuit line decoration
const CircuitDeco: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15, pointerEvents: 'none' }}>
    <line x1="800" y1="0" x2="800" y2="260" stroke={BLUE} strokeWidth="1.5" />
    <line x1="800" y1="260" x2="1000" y2="260" stroke={BLUE} strokeWidth="1.5" />
    <circle cx="1000" cy="260" r="5" fill={BLUE} />
    <line x1="900" y1="500" x2="1080" y2="500" stroke={BLUE} strokeWidth="1" />
    <circle cx="900" cy="500" r="4" fill={BLUE} />
    <line x1="50" y1="750" x2="200" y2="750" stroke={BLUE} strokeWidth="1" />
    <line x1="50" y1="750" x2="50" y2="1000" stroke={BLUE} strokeWidth="1" />
    <circle cx="50" cy="750" r="4" fill={BLUE} />
  </svg>
);

export const FbBoostAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Phase 1: Hook (0–90) ────────────────────────────────────────────────────
  const hookVisible = frame < 95;

  const hookTitleSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 200, mass: 0.8 },
    durationInFrames: 18,
  });
  const hookTitleY = interpolate(hookTitleSpring, [0, 1], [60, 0]);
  const hookTitleOpacity = interpolate(hookTitleSpring, [0, 1], [0, 1]);

  const hookSubSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 18, stiffness: 170 },
    durationInFrames: 18,
  });
  const hookSubY = interpolate(hookSubSpring, [0, 1], [40, 0]);
  const hookSubOpacity = interpolate(hookSubSpring, [0, 1], [0, 1]);

  const hookOut = interpolate(frame, [75, 95], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Phase 2: Pain list (90–310) ─────────────────────────────────────────────
  const painVisible = frame >= 88 && frame < 340;
  const painPhase = frame - 95;

  // ── Phase 3: CTA (330–540) ──────────────────────────────────────────────────
  const ctaVisible = frame >= 325;
  const ctaPhase = frame - 330;

  const ctaTitleSpring = spring({
    frame: Math.max(0, ctaPhase),
    fps,
    config: { damping: 20, stiffness: 180 },
    durationInFrames: 22,
  });
  const ctaTitleY = interpolate(ctaTitleSpring, [0, 1], [50, 0]);
  const ctaTitleOpacity = interpolate(ctaTitleSpring, [0, 1], [0, 1]);

  const ctaBtnSpring = spring({
    frame: Math.max(0, ctaPhase - 18),
    fps,
    config: { damping: 16, stiffness: 160 },
    durationInFrames: 22,
  });
  const ctaBtnScale = interpolate(ctaBtnSpring, [0, 1], [0.7, 1]);
  const ctaBtnOpacity = interpolate(ctaBtnSpring, [0, 1], [0, 1]);

  const ctaSubOpacity = interpolate(
    Math.max(0, ctaPhase - 28),
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  // Logo opacity (always visible once rendered)
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: `'Noto Sans Bengali', sans-serif`, overflow: 'hidden' }}>
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, #1A3C6E44 0%, transparent 65%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <CircuitDeco />

      {/* Logo — always top left */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 48,
          backgroundColor: 'white',
          borderRadius: 18,
          padding: '14px 24px',
          opacity: logoOpacity,
          zIndex: 100,
        }}
      >
        <Img
          src={staticFile('invatiqsoft-logo-color.png')}
          style={{ height: 54, objectFit: 'contain' }}
        />
      </div>

      {/* ── PHASE 1: HOOK ─────────────────────────────────────────────────── */}
      {hookVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, width: W, height: H,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 72,
            paddingRight: 72,
            paddingTop: 140,
            opacity: hookOut,
          }}
        >
          {/* Red accent bar */}
          <div
            style={{
              width: interpolate(hookTitleSpring, [0, 1], [0, 140]),
              height: 8,
              backgroundColor: RED,
              borderRadius: 4,
              marginBottom: 32,
            }}
          />

          <div style={{ transform: `translateY(${hookTitleY}px)`, opacity: hookTitleOpacity }}>
            <p style={{ fontSize: 68, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
              সফটওয়্যার কিনেও
            </p>
            <p style={{ fontSize: 68, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
              সমস্যার সমাধান হচ্ছে না?
            </p>
          </div>

          <div style={{ transform: `translateY(${hookSubY}px)`, opacity: hookSubOpacity, marginTop: 28 }}>
            <p style={{ fontSize: 40, fontWeight: 500, color: RED, margin: 0, lineHeight: 1.5 }}>
              আপনি কি একা? — না!
            </p>
            <p style={{ fontSize: 34, fontWeight: 400, color: 'rgba(255,255,255,0.6)', margin: 0, marginTop: 10, lineHeight: 1.5 }}>
              বাংলাদেশের হাজারো ব্যবসা এই সমস্যায় আছে।
            </p>
          </div>
        </div>
      )}

      {/* ── PHASE 2: PAIN LIST ────────────────────────────────────────────── */}
      {painVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, width: W, height: H,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 72,
            paddingRight: 72,
            paddingTop: 140,
            gap: 0,
            opacity: interpolate(frame, [85, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {/* Section title */}
          <div
            style={{
              opacity: interpolate(painPhase, [0, 16], [0, 1], { extrapolateRight: 'clamp' }),
              marginBottom: 36,
            }}
          >
            <p style={{ fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: 1 }}>
              বেশিরভাগ বিদেশি সফটওয়্যারে —
            </p>
          </div>

          {PAIN_POINTS.map((pain, i) => {
            // Each item enters 30 frames apart
            const itemDelay = i * 38;
            const itemSpring = spring({
              frame: Math.max(0, painPhase - itemDelay),
              fps,
              config: { damping: 20, stiffness: 160 },
              durationInFrames: 22,
            });
            const itemX = interpolate(itemSpring, [0, 1], [120, 0]);
            const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 28,
                  transform: `translateX(${itemX}px)`,
                  opacity: itemOpacity,
                  paddingTop: 18,
                  paddingBottom: 18,
                  borderBottom: i < PAIN_POINTS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: 48 }}>{pain.icon}</span>
                <p style={{ fontSize: 48, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
                  {pain.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PHASE 3: CTA ─────────────────────────────────────────────────── */}
      {ctaVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, width: W, height: H,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 120,
            paddingLeft: 64,
            paddingRight: 64,
          }}
        >
          {/* CTA glow burst */}
          <div
            style={{
              position: 'absolute',
              width: 750,
              height: 750,
              borderRadius: '50%',
              background: `radial-gradient(circle, #2B7FE04A 0%, transparent 65%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div
            style={{
              transform: `translateY(${ctaTitleY}px)`,
              opacity: ctaTitleOpacity,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 62, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
              আমরা বানাই আপনার ব্যবসার
            </p>
            <p style={{ fontSize: 62, fontWeight: 800, color: BLUE, margin: 0, lineHeight: 1.3 }}>
              নিজস্ব Custom Software
            </p>
          </div>

          <div
            style={{
              opacity: ctaSubOpacity,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            <p style={{ fontSize: 34, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
              আপনার প্রক্রিয়ায় • আপনার ভাষায় • Local Support
            </p>
          </div>

          {/* Follow button */}
          <div
            style={{
              marginTop: 60,
              transform: `scale(${ctaBtnScale})`,
              opacity: ctaBtnOpacity,
              backgroundColor: BLUE,
              borderRadius: 28,
              paddingTop: 36,
              paddingBottom: 36,
              paddingLeft: 80,
              paddingRight: 80,
              boxShadow: `0 0 80px 16px #2B7FE055`,
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 800, color: '#FFFFFF' }}>
              👍 Page Follow করুন
            </span>
          </div>

          <div style={{ marginTop: 30, opacity: ctaBtnOpacity }}>
            <p style={{ fontSize: 38, fontWeight: 700, color: BLUE, margin: 0, textAlign: 'center' }}>
              @InvatiqSoft
            </p>
          </div>

          {/* Hashtags */}
          <div
            style={{
              position: 'absolute',
              bottom: 44,
              opacity: ctaSubOpacity * 0.55,
            }}
          >
            <p style={{ fontSize: 24, color: '#777777', margin: 0, textAlign: 'center' }}>
              #InvatiqSoft #BangladeshBusiness #CustomSoftware
            </p>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
