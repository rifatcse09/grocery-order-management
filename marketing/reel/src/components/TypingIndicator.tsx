import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS, BUBBLE } from '../constants';

interface Props {
  startFrame: number;
  durationFrames: number;
}

export const TypingIndicator: React.FC<Props> = ({
  startFrame,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  if (local < 0 || local >= durationFrames) return null;

  const appear = interpolate(local, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const dotBounce = (phase: number) => {
    const t = ((local * 1.6 + phase) % 20) / 20;
    return interpolate(Math.sin(t * Math.PI * 2), [-1, 1], [0, -14]);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        paddingLeft: BUBBLE.marginH,
        marginBottom: BUBBLE.marginBetween + 4,
        opacity: appear,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.botBubble,
          borderRadius: `${BUBBLE.radiusTail}px ${BUBBLE.radiusBase}px ${BUBBLE.radiusBase}px ${BUBBLE.radiusBase}px`,
          padding: `${BUBBLE.paddingV + 4}px ${BUBBLE.paddingH + 12}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: `0 1px 3px ${COLORS.shadowColor}`,
        }}
      >
        {([0, 7, 14] as const).map((phase, i) => (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: COLORS.typingDot,
              transform: `translateY(${dotBounce(phase)}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
