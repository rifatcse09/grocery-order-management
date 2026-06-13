import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, HEADER, TIMING, WIDTH } from '../constants';

export const ChatHeader: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, TIMING.headerFadeIn], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [0, TIMING.headerFadeIn], [-30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEADER.height,
        backgroundColor: COLORS.headerBg,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: HEADER.paddingH,
        paddingRight: HEADER.paddingH,
        gap: 20,
        opacity,
        transform: `translateY(${translateY}px)`,
        zIndex: 100,
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
      }}
    >
      {/* Back arrow */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="white" />
      </svg>

      {/* Avatar circle */}
      <div
        style={{
          width: HEADER.avatarSize,
          height: HEADER.avatarSize,
          borderRadius: '50%',
          backgroundColor: COLORS.avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.25)',
        }}
      >
        <span
            style={{
              fontFamily: FONT.family,
              fontSize: 28,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 1,
            }}
          >
            SS
          </span>
      </div>

      {/* Name + status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: FONT.family,
            fontSize: 34,
            fontWeight: 600,
            color: COLORS.headerText,
            lineHeight: 1.1,
          }}
        >
          Sharmin Shop
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Green online dot */}
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: COLORS.onlineGreen,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: FONT.family,
              fontSize: 22,
              color: 'rgba(255,255,255,0.82)',
              fontWeight: 400,
            }}
          >
            অনলাইন
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Video call icon */}
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
          fill="white"
          opacity="0.9"
        />
      </svg>

      {/* More options */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity="0.9">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </div>
  );
};
