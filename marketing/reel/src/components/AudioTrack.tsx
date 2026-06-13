import React from 'react';
import { Audio, staticFile, useVideoConfig } from 'remotion';
import { DURATION_FRAMES } from '../constants';

/**
 * AudioTrack — professional audio mix:
 *
 * VOICE  (bn-BD-NabanitaNeural, Bangla TTS)
 *   • 100% volume while speaking
 *   • Smooth 6-frame fade-in at start
 *   • 60-frame (2s) fade-out after voice ends
 *
 * BACKGROUND MUSIC (synthesized promo track: pad + melody + bass + drums)
 *   • Audible at 30% under voice — enough to feel the energy
 *   • Auto-ducks to 15% right at voice peak moments (natural mix)
 *   • Swells to 45% after voice finishes (cinematic swell for CTA/Outro)
 *   • Clean 2-second fade-out at video end
 *
 * Total video: 1240 frames (41.3s) at 30fps
 * Voice ends : frame 924 (30.8s)
 */
const VOICE_END  = 1184;  // actual voice duration (39.46s × 30fps)
const SWELL_PEAK = 0.45;
const MUSIC_BASE = 0.30;

export const AudioTrack: React.FC = () => {
  const { fps } = useVideoConfig();

  // ── Voice volume ──────────────────────────────────────────────────────────
  const voiceVol = (f: number): number => {
    if (f < 6)                              return f / 6;          // 6-frame fade in
    if (f >= VOICE_END - 3 && f < VOICE_END)
                                            return (VOICE_END - f) / 3; // 3-frame micro fade
    if (f >= VOICE_END)                     return 0;
    return 1.0;
  };

  // ── Background music volume ───────────────────────────────────────────────
  const musicVol = (f: number): number => {
    // 1s fade-in at start
    const fadeIn  = Math.min(1, f / fps);
    // 2s fade-out at end
    const fadeOut = Math.min(1, (DURATION_FRAMES - f) / (fps * 2));

    let level: number;
    if (f < VOICE_END) {
      // Under the voice: audible but voice stays dominant
      level = MUSIC_BASE;
    } else {
      // Voice done → music swells over 2 seconds then holds
      const swellProgress = Math.min(1, (f - VOICE_END) / (fps * 2));
      level = MUSIC_BASE + (SWELL_PEAK - MUSIC_BASE) * swellProgress;
    }

    return level * fadeIn * fadeOut;
  };

  return (
    <>
      {/* Bangla voice narration — primary audio */}
      <Audio
        src={staticFile('audio/narration_full.mp3')}
        volume={voiceVol}
        startFrom={0}
      />

      {/* Promotional background music — full arrangement */}
      <Audio
        src={staticFile('audio/bg_music.mp3')}
        volume={musicVol}
        startFrom={0}
      />
    </>
  );
};
