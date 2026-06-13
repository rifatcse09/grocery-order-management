import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansBengali';

import {
  WIDTH,
  HEIGHT,
  HEADER,
  COLORS,
  MESSAGES,
  TIMING,
  SECTIONS,
} from './constants';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { CTAOverlay } from './components/CTAOverlay';
import { IntroSplash } from './components/IntroSplash';
import { PainPointsSlide } from './components/PainPointsSlide';
import { OutroSlide } from './components/OutroSlide';
import { AudioTrack } from './components/AudioTrack';

loadFont();

export const WhatsAppReel: React.FC = () => {
  const frame = useCurrentFrame();

  // Smooth auto-scroll shifts chat upward so newest messages stay visible
  const scrollY = interpolate(
    frame,
    [TIMING.scrollStart, SECTIONS.ctaStart - 10],
    [0, -760],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Fade the chat section out when the CTA overlay fully dims it
  const chatOpacity = interpolate(
    frame,
    [SECTIONS.ctaStart + 10, SECTIONS.ctaStart + 30],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{ width: WIDTH, height: HEIGHT, backgroundColor: COLORS.background, overflow: 'hidden' }}
    >
      {/* ── WhatsApp chat (always mounted, opacity-controlled) ────────── */}
      <div style={{ position: 'absolute', inset: 0, opacity: chatOpacity }}>

        {/* Wallpaper dot pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.045) 1.5px, transparent 1.5px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Scrollable message column */}
        <div
          style={{
            position: 'absolute',
            top: HEADER.height,
            left: 0,
            right: 0,
            bottom: 120,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingTop: 28,
              paddingBottom: 28,
              transform: `translateY(${scrollY}px)`,
            }}
          >
            {MESSAGES.map((msg, i) => {
              const isBot = msg.sender === 'bot';
              const typingStart = msg.startFrame - TIMING.typingDuration - 4;
              return (
                <React.Fragment key={i}>
                  {isBot && (
                    <TypingIndicator
                      startFrame={typingStart}
                      durationFrames={TIMING.typingDuration + 4}
                    />
                  )}
                  <MessageBubble
                    sender={msg.sender}
                    text={msg.text}
                    timestamp={msg.timestamp}
                    startFrame={msg.startFrame}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <ChatHeader />
        <BottomBar />
      </div>

      {/* ── CTA: "এটা সম্পূর্ণ অটোমেটিক" frames 780-870 ──────────── */}
      <Sequence
        from={SECTIONS.ctaStart}
        durationInFrames={SECTIONS.ctaEnd - SECTIONS.ctaStart}
        layout="none"
      >
        <CTAOverlay />
      </Sequence>

      {/* ── Outro: what we solve + DM frames 870-1050 ─────────────── */}
      <Sequence from={SECTIONS.outroStart} layout="none">
        <OutroSlide />
      </Sequence>

      {/* ── Pain points frames 80-240 (on top of chat) ─────────────── */}
      <Sequence
        from={SECTIONS.painStart}
        durationInFrames={SECTIONS.painEnd - SECTIONS.painStart}
        layout="none"
      >
        <PainPointsSlide />
      </Sequence>

      {/* ── Intro splash frames 0-80 (topmost layer) ───────────────── */}
      <Sequence
        from={SECTIONS.introStart}
        durationInFrames={SECTIONS.introEnd}
        layout="none"
      >
        <IntroSplash />
      </Sequence>


      {/* ── Audio track Bangla voiceover, one clip per narration ───── */}
      <AudioTrack />
    </AbsoluteFill>
  );
};

/* ─── Decorative WhatsApp input bar ─────────────────────────────────────── */
const BottomBar: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = interpolate(
    frame,
    [SECTIONS.chatStart, SECTIONS.chatStart + TIMING.headerFadeIn],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const disappear = interpolate(
    frame,
    [SECTIONS.ctaStart - 10, SECTIONS.ctaStart + 10],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: WIDTH,
        height: 120,
        backgroundColor: '#F0F2F5',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 18,
        paddingRight: 18,
        gap: 14,
        zIndex: 90,
        opacity: appear * disappear,
        boxSizing: 'border-box',
        borderTop: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <svg width="46" height="46" viewBox="0 0 24 24" fill="#8696A0">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
      </svg>
      <div
        style={{
          flex: 1,
          height: 76,
          backgroundColor: '#FFFFFF',
          borderRadius: 38,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 30,
        }}
      >
        <span style={{ fontFamily: `'Noto Sans Bengali', sans-serif`, fontSize: 30, color: '#8696A0' }}>
          মেসেজ লিখুন...
        </span>
      </div>
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: '50%',
          backgroundColor: COLORS.headerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
      </div>
    </div>
  );
};
