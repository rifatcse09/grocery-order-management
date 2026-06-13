import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CarouselSlide } from './components/CarouselSlide';

// ── Timeline (30 fps) ─────────────────────────────────────────────────────────
// Slide 1 Hook          :   0 – 160  (5.3s)
// Slide 2 Customization : 140 – 300  (5s, enters at 140 while slide 1 exits)
// Slide 3 VAT           : 280 – 440  (5s)
// Slide 4 Double Pain   : 420 – 590  (5.7s)
// Slide 5 CTA           : 570 – 760  (6.3s)
// Total: 760 frames ≈ 25.3s

export const FB_CAROUSEL_DURATION = 760;

export const FbCarousel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0F1E' }}>
      {/* Slide 1 — Hook */}
      <CarouselSlide
        startFrame={0}
        durationFrames={160}
        variant="hook"
        slideNumber={1}
        totalSlides={5}
      />

      {/* Slide 2 — Customization সমস্যা */}
      <CarouselSlide
        startFrame={140}
        durationFrames={160}
        variant="pain"
        badgeText="সমস্যা ০১"
        headline="Customization সমস্যা"
        subText="বিদেশি সফটওয়্যার আপনার ব্যবসার প্রক্রিয়ার সাথে মেলে না। আপনাকেই সফটওয়্যারের মতো করে কাজ করতে হয়।"
        slideNumber={2}
        totalSlides={5}
      />

      {/* Slide 3 — VAT & Tax সীমাবদ্ধতা */}
      <CarouselSlide
        startFrame={280}
        durationFrames={160}
        variant="pain"
        badgeText="সমস্যা ০২"
        headline="VAT & Tax সীমাবদ্ধতা"
        subText="বাংলাদেশের NBR VAT ও Tax নিয়মের সাথে বেশিরভাগ বিদেশি সফটওয়্যার সম্পূর্ণ সামঞ্জস্যপূর্ণ নয়।"
        slideNumber={3}
        totalSlides={5}
      />

      {/* Slide 4 — Subscription খরচ + Local Support নেই */}
      <CarouselSlide
        startFrame={420}
        durationFrames={170}
        variant="double_pain"
        badgeText="সমস্যা ০৩ ও ০৪"
        painItems={[
          {
            label: 'Subscription খরচ',
            sub: 'প্রতি মাসে বড় খরচ, অথচ দরকারি ফিচার নেই।',
          },
          {
            label: 'Local Support নেই',
            sub: 'সমস্যা হলে দ্রুত সাহায্য পাওয়া যায় না।',
          },
        ]}
        slideNumber={4}
        totalSlides={5}
      />

      {/* Slide 5 — CTA */}
      <CarouselSlide
        startFrame={570}
        durationFrames={190}
        variant="cta"
        slideNumber={5}
        totalSlides={5}
      />
    </AbsoluteFill>
  );
};
