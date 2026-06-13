import React from 'react';
import { useCurrentFrame, spring, interpolate, useVideoConfig, Img, staticFile } from 'remotion';
import { WIDTH, HEIGHT, COLORS, SECTIONS } from '../constants';

// Each pain card: problem on top (red tint), benefit below (green tint)
const PAIN_ITEMS = [
  {
    icon: '😩',
    pain: 'রাত ১২টায় মেসেজ আসে, কেউ রিপ্লাই দেয় না',
    benefit: '২৪/৭ বট রিপ্লাই কোনো কাস্টমার মিস নয়',
    benefitIcon: '🌙',
    stat: '৩x বেশি অর্ডার',
    statColor: '#25D366',
  },
  {
    icon: '⏰',
    pain: 'ম্যানুয়ালি অর্ডার নিতে ঘণ্টার পর ঘণ্টা নষ্ট',
    benefit: 'বট নিজেই অর্ডার কনফার্ম করে ১ মিনিটে',
    benefitIcon: '⚡',
    stat: '৯০% সময় সাশ্রয়',
    statColor: '#F59E0B',
  },
  {
    icon: '💸',
    pain: 'বিক্রয় হারায়, কাস্টমার অপেক্ষা করে চলে যায়',
    benefit: 'ইনস্ট্যান্ট রেসপন্সে বিক্রি বাড়ে সরাসরি',
    benefitIcon: '📈',
    stat: '৪০% বেশি আয়',
    statColor: '#EC4899',
  },
  {
    icon: '🤯',
    pain: 'একই প্রশ্নের উত্তর বারবার দিতে হয়',
    benefit: 'বট সব FAQ স্বয়ংক্রিয়ভাবে সামলায়',
    benefitIcon: '🤖',
    stat: '১০০% ঝামেলামুক্ত',
    statColor: '#8B5CF6',
  },
];

interface CardProps {
  item: (typeof PAIN_ITEMS)[0];
  delay: number;
  localFrame: number;
  fps: number;
}

const PainCard: React.FC<CardProps> = ({ item, delay, localFrame, fps }) => {
  const sp = spring({
    frame: Math.max(0, localFrame - delay),
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.85 },
    durationInFrames: 22,
  });
  const opacity = interpolate(sp, [0, 1], [0, 1]);
  const y = interpolate(sp, [0, 1], [50, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        border: '1.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Pain line */}
      <div
        style={{
          backgroundColor: 'rgba(239,68,68,0.15)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 40, flexShrink: 0 }}>{item.icon}</span>
        <span
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 32,
            color: '#FCA5A5',
            lineHeight: 1.45,
            fontWeight: 400,
          }}
        >
          {item.pain}
        </span>
      </div>

      {/* Benefit line */}
      <div
        style={{
          backgroundColor: 'rgba(37,211,102,0.12)',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <span style={{ fontSize: 40, flexShrink: 0 }}>{item.benefitIcon}</span>
          <span
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: 32,
              color: '#86EFAC',
              lineHeight: 1.45,
              fontWeight: 600,
            }}
          >
            {item.benefit}
          </span>
        </div>
        {/* Stat badge */}
        <div
          style={{
            backgroundColor: item.statColor + '22',
            border: `1.5px solid ${item.statColor}55`,
            borderRadius: 50,
            padding: '10px 20px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: 28,
              fontWeight: 700,
              color: item.statColor,
              whiteSpace: 'nowrap',
            }}
          >
            {item.stat}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PainPointsSlide: React.FC = () => {
  // Already local (0-based) inside <Sequence>
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  const duration = SECTIONS.painEnd - SECTIONS.painStart; // 300 frames = 10s

  // Whole slide opacity fade in + fade out
  const fadeIn = interpolate(local, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(local, [duration - 16, duration], [1, 0], { extrapolateLeft: 'clamp' });
  const slideOpacity = Math.min(fadeIn, fadeOut);

  // Heading spring
  const headingSp = spring({
    frame: local,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.9 },
    durationInFrames: 24,
  });
  const headingOpacity = interpolate(headingSp, [0, 1], [0, 1]);
  const headingY = interpolate(headingSp, [0, 1], [-36, 0]);

  // "Watch how we fix it" teaser appears at ~8s into the 10s slide (frame 240/300)
  const teaserOpacity = interpolate(local, [240, 262], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const arrowBounce = interpolate(
    Math.sin((local / fps) * Math.PI * 2 * 1.5),
    [-1, 1],
    [0, 12]
  );

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
        zIndex: 250,
        opacity: slideOpacity,
        overflow: 'hidden',
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, #7F1D1D44 0%, transparent 70%)`,
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          paddingLeft: 48,
          paddingRight: 48,
          paddingTop: 80,
          paddingBottom: 40,
          gap: 28,
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
            marginBottom: 8,
          }}
        >
          {/* Tag badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(239,68,68,0.15)',
              border: '1.5px solid rgba(239,68,68,0.35)',
              borderRadius: 50,
              padding: '10px 32px',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 30 }}>😔</span>
            <span
              style={{
                fontFamily: `'Noto Sans Bengali', sans-serif`,
                fontSize: 28,
                fontWeight: 600,
                color: '#FCA5A5',
              }}
            >
              অনলাইন দোকানদারের সমস্যা
            </span>
          </div>

          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
          fontSize: 64,
          fontWeight: 700,
          color: '#FFFFFF',
          margin: 0,
          lineHeight: 1.3,
        }}
        >
          আপনিও কি এই
        </p>
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: 64,
            fontWeight: 700,
            color: '#FCA5A5',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            সমস্যায় আছেন?
          </p>
        </div>

        {/* Pain cards staggered */}
        {/* Cards stagger across 10s: 0.7s, 2.3s, 4.0s, 5.7s */}
        {PAIN_ITEMS.map((item, i) => (
          <PainCard
            key={i}
            item={item}
            delay={20 + i * 50}   // 50 frames (~1.7s) between each card
            localFrame={local}
            fps={fps}
          />
        ))}

        {/* Teaser: "watch how we solve it" sits above narration bar */}
        <div
          style={{
            opacity: teaserOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            paddingBottom: 180,
          }}
        >
          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
          fontSize: 36,
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
          textAlign: 'center',
        }}
        >
          দেখুন আমাদের AI বট কীভাবে সব সমাধান করে 👇
          </p>
          <div style={{ transform: `translateY(${arrowBounce}px)` }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4v16m0 0l-6-6m6 6l6-6"
                stroke={COLORS.whatsappGreen}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
