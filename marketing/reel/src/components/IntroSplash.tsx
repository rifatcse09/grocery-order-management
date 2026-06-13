import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import { WIDTH, HEIGHT, COLORS, FONT, SECTIONS } from '../constants';

export const IntroSplash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const duration = SECTIONS.introEnd; // now 120 frames = 4s
  const local = frame;

  // Fade out the whole splash as it transitions to the chat
  const splashOpacity = interpolate(
    local,
    [duration - 18, duration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Logo spring entrance
  const logoSpring = spring({
    frame: local,
    fps,
    config: { damping: 18, stiffness: 140, mass: 1 },
    durationInFrames: 30,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.6, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // Tagline slides up after logo
  const taglineSpring = spring({
    frame: Math.max(0, local - 22),
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.9 },
    durationInFrames: 26,
  });
  const taglineY = interpolate(taglineSpring, [0, 1], [40, 0]);
  const taglineOpacity = interpolate(taglineSpring, [0, 1], [0, 1]);

  // Sub-label (what we do) delayed further
  const subSpring = spring({
    frame: Math.max(0, local - 36),
    fps,
    config: { damping: 14, stiffness: 120, mass: 1 },
    durationInFrames: 24,
  });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);
  const subY = interpolate(subSpring, [0, 1], [30, 0]);

  // Pulsing ring around logo
  const ring = 1 + 0.06 * Math.sin((local / fps) * Math.PI * 2 * 1.2);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: COLORS.brandDark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        zIndex: 300,
        opacity: splashOpacity,
      }}
    >
      {/* Background gradient circles */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.brandBlue}55 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.brandAccent}33 0%, transparent 70%)`,
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Pulsing ring behind logo */}
      <div
        style={{
          position: 'absolute',
          width: 340,
          height: 340,
          borderRadius: '50%',
          border: `3px solid ${COLORS.brandAccent}55`,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -62%) scale(${ring})`,
        }}
      />

      {/* Logo block */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 48,
        }}
      >
        {/* Logo container with a soft glow */}
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 32,
            padding: '40px 64px',
            border: `1.5px solid rgba(255,255,255,0.12)`,
            boxShadow: `0 0 80px 8px ${COLORS.brandAccent}30`,
          }}
        >
          <Img
            src={staticFile('invatiqsoft-logo.png')}
            style={{
              height: 120,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
        </div>
      </div>

      {/* Divider line */}
      <div
        style={{
          width: interpolate(logoOpacity, [0, 1], [0, 340]),
          height: 2,
          backgroundColor: COLORS.brandAccent,
          borderRadius: 2,
          marginBottom: 44,
          opacity: logoOpacity,
        }}
      />

      {/* Main tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
          paddingLeft: 60,
          paddingRight: 60,
          marginBottom: 28,
        }}
      >
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 52,
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.45,
            textShadow: `0 2px 24px ${COLORS.brandAccent}88`,
          }}
        >
          ইনভাটিক সফট নিয়ে আসছে
        </p>
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 52,
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          আপনার ব্যবসার জন্য
        </p>
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 68,
            fontWeight: 800,
            color: COLORS.brandAccent,
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: 2,
          }}
        >
          AI BOT!
        </p>
      </div>

      {/* Sub label */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          textAlign: 'center',
          paddingLeft: 80,
          paddingRight: 80,
        }}
      >
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 30,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            margin: 0,
            lineHeight: 1.6,
            letterSpacing: 0.5,
          }}
        >
          Innovate • Solve • Grow
        </p>
      </div>

      {/* Bottom: animated WhatsApp icon teaser */}
      <div
        style={{
          position: 'absolute',
          bottom: 310,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: subOpacity,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: COLORS.whatsappGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 40px 8px ${COLORS.whatsappGreen}55`,
          }}
        >
          {/* WhatsApp icon */}
          <svg width="46" height="46" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 26,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          দেখুন কীভাবে কাজ করে...
        </span>
      </div>
    </div>
  );
};
