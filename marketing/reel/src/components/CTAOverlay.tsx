import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import { COLORS, FONT, WIDTH, HEIGHT, TIMING } from '../constants';

export const CTAOverlay: React.FC = () => {
  // useCurrentFrame() is already local (0-based) inside a <Sequence>
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Semi-transparent dim
  const dimOpacity = interpolate(local, [0, 22], [0, 0.75], {
    extrapolateRight: 'clamp',
  });

  // Main headline spring
  const mainSpring = spring({
    frame: local,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.9 },
    durationInFrames: 26,
  });
  const mainScale = interpolate(mainSpring, [0, 1], [0.7, 1]);
  const mainOpacity = interpolate(mainSpring, [0, 1], [0, 1]);

  // Sub-text delayed spring
  const subSpring = spring({
    frame: Math.max(0, local - 18),
    fps,
    config: { damping: 14, stiffness: 140, mass: 1 },
    durationInFrames: 26,
  });
  const subScale = interpolate(subSpring, [0, 1], [0.78, 1]);
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // Logo fade
  const logoOpacity = interpolate(local, [36, 56], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulsing glow on the sub-text pill
  const pulse = 1 + 0.045 * Math.sin((local / fps) * Math.PI * 2 * 1.1);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Dark dim layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          opacity: dimOpacity,
        }}
      />

      {/* Content stack */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 52,
          paddingLeft: 56,
          paddingRight: 56,
        }}
      >
        {/* ── Headline ── */}
        <div
          style={{
            opacity: mainOpacity,
            transform: `scale(${mainScale})`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: FONT.sizeCtaMain,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.45,
              textShadow: '0 2px 24px rgba(0,0,0,0.7)',
            }}
          >
            এটা সম্পূর্ণ অটোমেটিক 🤖
          </p>
          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: FONT.sizeCtaMain,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.45,
              textShadow: '0 2px 24px rgba(0,0,0,0.7)',
            }}
          >
            কোনো মানুষ রিপ্লাই করেনি!
          </p>
        </div>

        {/* ── Sub-text with glowing pill ── */}
        <div
          style={{
            opacity: subOpacity,
            transform: `scale(${subScale})`,
            position: 'relative',
            padding: '28px 40px',
          }}
        >
          {/* Glow pill */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 56,
              backgroundColor: COLORS.ctaButtonGlow,
              opacity: 0.25,
              transform: `scale(${pulse})`,
              boxShadow: `0 0 70px 24px ${COLORS.ctaButtonGlow}`,
            }}
          />
          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: FONT.sizeCtaSub,
              fontWeight: 500,
              color: '#FFFFFF',
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1,
              whiteSpace: 'pre-wrap',
            }}
          >
            {"আপনার দোকানের জন্য এমন বট চান?\nকমেন্টে লিখুন 'আগ্রহী' 👇"}
          </p>
        </div>

        {/* ── InvatiqSoft logo ── */}
        <div
          style={{
            opacity: logoOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            marginTop: 12,
          }}
        >
          <Img
            src={staticFile('invatiqsoft-logo.png')}
            style={{
              height: 76,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
          <span
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: 26,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: 2.5,
              textTransform: 'uppercase',
            }}
          >
            Powered by InvatiqSoft
          </span>
        </div>
      </div>
    </div>
  );
};
