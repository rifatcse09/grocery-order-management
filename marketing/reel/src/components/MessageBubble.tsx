import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { COLORS, FONT, BUBBLE, Sender } from '../constants';

interface Props {
  sender: Sender;
  text: string;
  timestamp: string;
  /** Absolute frame at which this bubble animates in */
  startFrame: number;
}

export const MessageBubble: React.FC<Props> = ({
  sender,
  text,
  timestamp,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  const isCustomer = sender === 'customer';

  // Before this bubble should exist → render nothing (no space reserved intentionally;
  // the column grows as messages appear, just like a real chat)
  if (localFrame < 0) return null;

  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 200, mass: 0.75 },
    durationInFrames: 18,
  });

  const scale = interpolate(progress, [0, 1], [0.84, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [isCustomer ? 70 : -70, 0]);

  const bubbleBg = isCustomer ? COLORS.customerBubble : COLORS.botBubble;

  // WhatsApp tail: bottom-right pointy for customer, bottom-left for bot
  const borderRadius = isCustomer
    ? `${BUBBLE.radiusBase}px ${BUBBLE.radiusTail}px ${BUBBLE.radiusBase}px ${BUBBLE.radiusBase}px`
    : `${BUBBLE.radiusTail}px ${BUBBLE.radiusBase}px ${BUBBLE.radiusBase}px ${BUBBLE.radiusBase}px`;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isCustomer ? 'flex-end' : 'flex-start',
        paddingLeft: isCustomer ? 0 : BUBBLE.marginH,
        paddingRight: isCustomer ? BUBBLE.marginH : 0,
        marginBottom: BUBBLE.marginBetween + 4,
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        transformOrigin: isCustomer ? 'right center' : 'left center',
      }}
    >
      <div
        style={{
          maxWidth: BUBBLE.maxWidth,
          backgroundColor: bubbleBg,
          borderRadius,
          paddingTop: BUBBLE.paddingV,
          paddingBottom: BUBBLE.paddingV,
          paddingLeft: BUBBLE.paddingH,
          paddingRight: BUBBLE.paddingH,
          boxShadow: `0 1px 3px ${COLORS.shadowColor}`,
        }}
      >
        {/* Message text */}
        <p
          style={{
            fontFamily: `'Noto Sans Bengali', sans-serif`,
            fontSize: FONT.sizeMessage,
            lineHeight: FONT.lineHeight,
            color: COLORS.bubbleText,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </p>

        {/* Timestamp + tick row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: `'Noto Sans Bengali', sans-serif`,
              fontSize: FONT.sizeTimestamp,
              color: COLORS.timestampText,
              lineHeight: 1,
            }}
          >
            {timestamp}
          </span>
          {isCustomer && (
            <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
              <path
                d="M1 7L5.5 11.5L14.5 2.5"
                stroke="#53BDEB"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 7L11.5 11.5L20.5 2.5"
                stroke="#53BDEB"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
