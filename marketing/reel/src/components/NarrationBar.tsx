import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { NARRATIONS, FONT, COLORS, WIDTH } from '../constants';

/**
 * NarrationBar renders the active Bangla voiceover subtitle
 * for whichever time window the current frame falls into.
 * Placed as a sticky overlay above the bottom-most element of each section.
 */
export const NarrationBar: React.FC<{
  /** Bottom offset in px so the bar clears the bottom action bar / footer */
  bottomOffset?: number;
}> = ({ bottomOffset = 140 }) => {
  const frame = useCurrentFrame();

  // Find the active narration for this frame
  const active = NARRATIONS.find((n) => frame >= n.from && frame < n.to);

  if (!active) return null;

  const localFrame = frame - active.from;
  const duration = active.to - active.from;

  // Fade in over 10 frames, hold, fade out over 10 frames
  const fadeIn = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(localFrame, [duration - 10, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  // Slide up from 14px below on entrance
  const translateY = interpolate(localFrame, [0, 10], [14, 0], {
    extrapolateRight: 'clamp',
  });

  // Animated progress bar under the text
  const barWidth = interpolate(localFrame, [0, duration], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 0,
        width: WIDTH,
        zIndex: 500,
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: 'none',
        padding: '0 32px',
        boxSizing: 'border-box',
      }}
    >
      {/* Pill container */}
      <div
        style={{
          backgroundColor: COLORS.narrationBg,
          borderRadius: 28,
          padding: '24px 36px 20px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Mic icon + text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 18,
          }}
        >
          {/* Mic icon */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: COLORS.whatsappGreen + '33',
              border: `2px solid ${COLORS.whatsappGreen}88`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill={COLORS.whatsappGreen}>
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </div>

          <p
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: FONT.sizeNarration,
              fontWeight: 500,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.55,
              flex: 1,
            }}
          >
            {active.text}
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 16,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: '100%',
              backgroundColor: COLORS.whatsappGreen,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};
