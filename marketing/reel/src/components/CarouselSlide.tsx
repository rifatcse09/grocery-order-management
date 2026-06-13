import React from 'react';
import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

export type SlideVariant = 'hook' | 'pain' | 'double_pain' | 'cta';

export interface PainItem {
  label: string;
  sub: string;
}

export interface SlideProps {
  /** Absolute frame at which this slide enters the viewport */
  startFrame: number;
  /** Duration in frames for this slide (before next slide slides in) */
  durationFrames: number;
  variant: SlideVariant;
  badgeText?: string;
  headline?: string;
  subText?: string;
  painItems?: PainItem[];
  slideNumber?: number;
  totalSlides?: number;
}

const BG = '#0A0F1E';
const RED = '#E8291A';
const BLUE_ACCENT = '#2B7FE0';
const W = 1080;
const H = 1080;

const CircuitLines: React.FC = () => (
  <svg
    width={W}
    height={H}
    style={{ position: 'absolute', top: 0, left: 0, opacity: 0.18 }}
  >
    <line x1="820" y1="0" x2="820" y2="300" stroke={BLUE_ACCENT} strokeWidth="1.5" />
    <line x1="820" y1="300" x2="920" y2="300" stroke={BLUE_ACCENT} strokeWidth="1.5" />
    <circle cx="920" cy="300" r="5" fill={BLUE_ACCENT} />
    <line x1="920" y1="300" x2="920" y2="500" stroke={BLUE_ACCENT} strokeWidth="1.5" />
    <line x1="920" y1="500" x2="1000" y2="500" stroke={BLUE_ACCENT} strokeWidth="1.5" />
    <circle cx="1000" cy="500" r="4" fill={BLUE_ACCENT} />
    <line x1="880" y1="600" x2="1080" y2="600" stroke={BLUE_ACCENT} strokeWidth="1" />
    <circle cx="880" cy="600" r="4" fill={BLUE_ACCENT} />
    <line x1="750" y1="800" x2="750" y2="1080" stroke={BLUE_ACCENT} strokeWidth="1" />
    <circle cx="750" cy="800" r="4" fill={BLUE_ACCENT} />
    <line x1="60" y1="700" x2="200" y2="700" stroke={BLUE_ACCENT} strokeWidth="1" />
    <line x1="60" y1="700" x2="60" y2="1000" stroke={BLUE_ACCENT} strokeWidth="1" />
    <circle cx="60" cy="700" r="4" fill={BLUE_ACCENT} />
    <line x1="140" y1="900" x2="0" y2="900" stroke={BLUE_ACCENT} strokeWidth="1" />
    <circle cx="140" cy="900" r="4" fill={BLUE_ACCENT} />
  </svg>
);

const XMark: React.FC<{ size?: number }> = ({ size = 110 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.18,
      backgroundColor: RED,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
      <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="21" y1="3" x2="3" y2="21" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
);

export const CarouselSlide: React.FC<SlideProps> = ({
  startFrame,
  durationFrames,
  variant,
  badgeText,
  headline,
  subText,
  painItems,
  slideNumber,
  totalSlides,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = frame - startFrame;

  // Slide-in from right
  const slideProgress = spring({
    frame: Math.max(0, local),
    fps,
    config: { damping: 22, stiffness: 180, mass: 0.9 },
    durationInFrames: 22,
  });
  const slideX = interpolate(slideProgress, [0, 1], [W, 0]);

  // Slide-out to left before next slide
  const slideOutStart = durationFrames - 20;
  const slideOutProgress = interpolate(
    local,
    [slideOutStart, durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const slideOutX = interpolate(slideOutProgress, [0, 1], [0, -W]);

  const translateX = local < 0 ? W : slideX + slideOutX;

  // Content fade-in (staggered)
  const contentOpacity = interpolate(
    Math.max(0, local),
    [0, 18],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const headlineSpring = spring({
    frame: Math.max(0, local - 10),
    fps,
    config: { damping: 18, stiffness: 150 },
    durationInFrames: 24,
  });
  const headlineY = interpolate(headlineSpring, [0, 1], [40, 0]);

  const subSpring = spring({
    frame: Math.max(0, local - 18),
    fps,
    config: { damping: 16, stiffness: 130 },
    durationInFrames: 24,
  });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  if (local < 0 || local > durationFrames) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: W,
        height: H,
        backgroundColor: BG,
        transform: `translateX(${translateX}px)`,
        overflow: 'hidden',
        fontFamily: `'Noto Sans Bengali', sans-serif`,
      }}
    >
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
          pointerEvents: 'none',
        }}
      />

      <CircuitLines />

      {/* Logo — top left */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 48,
          backgroundColor: 'white',
          borderRadius: 18,
          padding: '14px 24px',
          opacity: contentOpacity,
        }}
      >
        <Img
          src={staticFile('invatiqsoft-logo-color.png')}
          style={{ height: 56, objectFit: 'contain' }}
        />
      </div>

      {/* Badge — top right */}
      {badgeText && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 48,
            backgroundColor: RED,
            borderRadius: 14,
            padding: '12px 28px',
            opacity: contentOpacity,
          }}
        >
          <span style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>
            {badgeText}
          </span>
        </div>
      )}

      {/* ── HOOK variant ────────────────────────────── */}
      {variant === 'hook' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 80,
            paddingRight: 80,
            paddingTop: 160,
          }}
        >
          <div
            style={{
              transform: `translateY(${headlineY}px)`,
              opacity: contentOpacity,
            }}
          >
            <p
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              আপনার Software কি
            </p>
            <p
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              আপনার ব্যবসার জন্য?
            </p>
          </div>

          <div
            style={{
              transform: `translateY(${subY}px)`,
              opacity: subOpacity,
              marginTop: 32,
            }}
          >
            <p
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: RED,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              নাকি আপনার ব্যবসা
            </p>
            <p
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: RED,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Software-এর জন্য?
            </p>
          </div>

          {/* Swipe indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              opacity: subOpacity * 0.7,
            }}
          >
            <span style={{ color: '#aaaaaa', fontSize: 28 }}>Swipe to see</span>
            <span style={{ color: BLUE_ACCENT, fontSize: 32 }}>→</span>
          </div>
        </div>
      )}

      {/* ── PAIN variant ────────────────────────────── */}
      {variant === 'pain' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 64,
            paddingRight: 64,
            paddingTop: 160,
            gap: 48,
          }}
        >
          <div style={{ opacity: contentOpacity }}>
            <XMark size={120} />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                transform: `translateY(${headlineY}px)`,
                opacity: contentOpacity,
              }}
            >
              <p
                style={{
                  fontSize: 66,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {headline}
              </p>
            </div>
            <div
              style={{
                transform: `translateY(${subY}px)`,
                opacity: subOpacity,
                marginTop: 28,
              }}
            >
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.65)',
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                {subText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DOUBLE PAIN variant ─────────────────────── */}
      {variant === 'double_pain' && painItems && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 64,
            paddingRight: 64,
            paddingTop: 140,
            gap: 0,
          }}
        >
          {painItems.map((item, i) => {
            const itemSpring = spring({
              frame: Math.max(0, local - 12 - i * 16),
              fps,
              config: { damping: 18, stiffness: 140 },
              durationInFrames: 22,
            });
            const itemY = interpolate(itemSpring, [0, 1], [35, 0]);
            const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 40,
                    transform: `translateY(${itemY}px)`,
                    opacity: itemOpacity,
                    paddingTop: i === 0 ? 0 : 50,
                    paddingBottom: 50,
                  }}
                >
                  <XMark size={100} />
                  <div>
                    <p
                      style={{
                        fontSize: 58,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: 34,
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.6)',
                        margin: 0,
                        marginTop: 10,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </div>
                {i === 0 && (
                  <div
                    style={{
                      height: 2,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      width: '100%',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── CTA variant ─────────────────────────────── */}
      {variant === 'cta' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 120,
            paddingLeft: 60,
            paddingRight: 60,
          }}
        >
          {/* Glow burst */}
          <div
            style={{
              position: 'absolute',
              width: 700,
              height: 700,
              borderRadius: '50%',
              background: `radial-gradient(circle, #2B7FE055 0%, transparent 68%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div
            style={{
              transform: `translateY(${headlineY}px)`,
              opacity: contentOpacity,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              সমাধান জানতে চান?
            </p>
          </div>

          <div
            style={{
              transform: `translateY(${subY}px)`,
              opacity: subOpacity,
              textAlign: 'center',
              marginTop: 28,
            }}
          >
            <p
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                lineHeight: 1.65,
              }}
            >
              InvatiqSoft তৈরি করে বাংলাদেশের ব্যবসার জন্য{'\n'}
              কাস্টম সফটওয়্যার — আপনার প্রক্রিয়ায়, আপনার ভাষায়।
            </p>
          </div>

          {/* Follow button */}
          <div
            style={{
              marginTop: 72,
              opacity: subOpacity,
              transform: `translateY(${subY}px)`,
              backgroundColor: BLUE_ACCENT,
              borderRadius: 24,
              paddingTop: 32,
              paddingBottom: 32,
              paddingLeft: 64,
              paddingRight: 64,
              boxShadow: `0 0 60px 12px #2B7FE044`,
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: '#FFFFFF',
              }}
            >
              👍 Page Follow করুন
            </span>
          </div>

          <div
            style={{
              marginTop: 36,
              opacity: subOpacity,
            }}
          >
            <p
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: BLUE_ACCENT,
                margin: 0,
              }}
            >
              @InvatiqSoft
            </p>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 48,
              opacity: subOpacity * 0.6,
            }}
          >
            <p
              style={{
                fontSize: 26,
                color: '#888888',
                margin: 0,
                textAlign: 'center',
              }}
            >
              #BusinessSoftware #BangladeshBusiness #InvatiqSoft
            </p>
          </div>
        </div>
      )}

      {/* Slide counter */}
      {slideNumber && totalSlides && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 56,
            opacity: contentOpacity * 0.5,
          }}
        >
          <span
            style={{
              color: '#888888',
              fontSize: 30,
              fontWeight: 600,
            }}
          >
            {slideNumber} / {totalSlides}
          </span>
        </div>
      )}
    </div>
  );
};
