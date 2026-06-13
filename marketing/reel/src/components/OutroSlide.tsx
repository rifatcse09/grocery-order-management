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

interface ProblemRowProps {
  emoji: string;
  problem: string;
  solution: string;
  delay: number;
  localFrame: number;
  fps: number;
}

const ProblemRow: React.FC<ProblemRowProps> = ({
  emoji,
  problem,
  solution,
  delay,
  localFrame,
  fps,
}) => {
  const sp = spring({
    frame: Math.max(0, localFrame - delay),
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.85 },
    durationInFrames: 22,
  });
  const opacity = interpolate(sp, [0, 1], [0, 1]);
  const x = interpolate(sp, [0, 1], [-60, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '28px 36px',
      }}
    >
      {/* Problem line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontSize: 40 }}>❌</span>
        <span
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 34,
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 400,
            textDecoration: 'line-through',
            lineHeight: 1.4,
          }}
        >
          {problem}
        </span>
      </div>
      {/* Solution line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontSize: 40 }}>{emoji}</span>
        <span
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 36,
            color: '#FFFFFF',
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {solution}
        </span>
      </div>
    </div>
  );
};

export const OutroSlide: React.FC = () => {
  // useCurrentFrame() is already local (0-based) inside a <Sequence>
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Full slide fade-in
  const slideOpacity = interpolate(local, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Heading spring
  const headingSpring = spring({
    frame: local,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.9 },
    durationInFrames: 24,
  });
  const headingOpacity = interpolate(headingSpring, [0, 1], [0, 1]);
  const headingY = interpolate(headingSpring, [0, 1], [-40, 0]);

  // DM / contact section (appears after all rows)
  const dmSpring = spring({
    frame: Math.max(0, local - 100),
    fps,
    config: { damping: 14, stiffness: 130, mass: 1 },
    durationInFrames: 26,
  });
  const dmOpacity = interpolate(dmSpring, [0, 1], [0, 1]);
  const dmScale = interpolate(dmSpring, [0, 1], [0.8, 1]);

  // Pulsing glow on DM button
  const pulse = 1 + 0.05 * Math.sin((local / fps) * Math.PI * 2 * 1.3);

  // Logo opacity
  const logoOpacity = interpolate(local, [110, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const problems = [
    {
      emoji: '✅',
      problem: 'রাত ১২টায় কাস্টমার মেসেজ দিলে রিপ্লাই নেই',
      solution: '২৪/৭ অটোমেটিক রিপ্লাই',
      delay: 18,
    },
    {
      emoji: '✅',
      problem: 'ম্যানুয়ালি অর্ডার নিতে সময় নষ্ট',
      solution: 'বট নিজেই অর্ডার কনফার্ম করে',
      delay: 38,
    },
    {
      emoji: '✅',
      problem: 'কাস্টমার অপেক্ষা করে চলে যায়',
      solution: 'ইনস্ট্যান্ট রেসপন্স, বিক্রি বাড়ে',
      delay: 58,
    },
  ];

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
        zIndex: 300,
        opacity: slideOpacity,
        overflowY: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.brandBlue}44 0%, transparent 70%)`,
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          paddingLeft: 52,
          paddingRight: 52,
          paddingTop: 80,
          paddingBottom: 40,
          position: 'relative',
          zIndex: 2,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Heading */}
        <div
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              backgroundColor: `${COLORS.whatsappGreen}22`,
              border: `1.5px solid ${COLORS.whatsappGreen}55`,
              borderRadius: 50,
              padding: '12px 36px',
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 36 }}>🤖</span>
            <span
              style={{
                fontFamily: `'Noto Sans Bengali', sans-serif`,
                fontSize: 30,
                fontWeight: 600,
                color: COLORS.whatsappGreen,
                letterSpacing: 0.5,
              }}
            >
              AI WhatsApp Bot
            </span>
          </div>

          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
          fontSize: 62,
          fontWeight: 700,
          color: '#FFFFFF',
          margin: 0,
          lineHeight: 1.35,
        }}
        >
          আমরা যা সমস্যা
        </p>
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 62,
            fontWeight: 700,
            color: COLORS.brandAccent,
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            সমাধান করি
          </p>
        </div>

        {/* Problem → Solution rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            width: '100%',
          }}
        >
          {problems.map((p, i) => (
            <ProblemRow
              key={i}
              emoji={p.emoji}
              problem={p.problem}
              solution={p.solution}
              delay={p.delay}
              localFrame={local}
              fps={fps}
            />
          ))}
        </div>

        {/* DM / contact CTA */}
        <div
          style={{
            opacity: dmOpacity,
            transform: `scale(${dmScale})`,
            textAlign: 'center',
            width: '100%',
            marginTop: 8,
          }}
        >
          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
          fontSize: 42,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.7)',
          margin: '0 0 24px 0',
          lineHeight: 1.5,
        }}
        >
          আপনার দোকানের জন্য বট বানাতে চান?
          </p>

          {/* WhatsApp DM button with pulse */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: 56,
                backgroundColor: COLORS.whatsappGreen,
                opacity: 0.2,
                transform: `scale(${pulse})`,
                boxShadow: `0 0 60px 20px ${COLORS.whatsappGreen}`,
              }}
            />
            <div
              style={{
                position: 'relative',
                backgroundColor: COLORS.whatsappGreen,
                borderRadius: 44,
                padding: '26px 56px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span
                style={{
                  fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: 44,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            DM করুন এখনই
              </span>
            </div>
          </div>

          {/* Handle / link */}
          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: 28,
              color: 'rgba(255,255,255,0.45)',
              margin: '20px 0 0 0',
              letterSpacing: 1,
            }}
          >
            invatiqsoft.com
          </p>
        </div>

        {/* Logo footer */}
        <div
          style={{
            opacity: logoOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: 360,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              marginBottom: 8,
            }}
          />
          <Img
            src={staticFile('invatiqsoft-logo.png')}
            style={{
              height: 56,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </div>
  );
};
