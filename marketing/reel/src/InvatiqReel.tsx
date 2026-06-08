import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  useCurrentFrame,
  interpolate,
  staticFile,
} from "remotion";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { Scene7 } from "./scenes/Scene7";

// 30fps × 40s = 1200 frames total
const SCENES = [
  { from: 0,    duration: 150, component: Scene1 },
  { from: 150,  duration: 150, component: Scene2 },
  { from: 300,  duration: 210, component: Scene3 },
  { from: 510,  duration: 240, component: Scene4 },
  { from: 750,  duration: 216, component: Scene5 },
  { from: 966,  duration: 144, component: Scene6 },
  { from: 1110, duration: 90,  component: Scene7 },
];

const FADE = 10;

export const InvatiqReel: React.FC = () => {
  const frame = useCurrentFrame();

  let blackOpacity = 0;
  SCENES.forEach((scene, i) => {
    const end = scene.from + scene.duration;

    // Fade in from black at start — skip for scene 0 (let it open clean)
    if (i > 0 && frame >= scene.from && frame <= scene.from + FADE) {
      blackOpacity = Math.max(
        blackOpacity,
        interpolate(frame, [scene.from, scene.from + FADE], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }

    // Fade to black at end — skip for last scene
    if (i < SCENES.length - 1 && frame >= end - FADE && frame <= end) {
      blackOpacity = Math.max(
        blackOpacity,
        interpolate(frame, [end - FADE, end], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }
  });

  return (
    <AbsoluteFill style={{ background: "#020817" }}>
      {/* ── Background music ── */}
      {/* Place your MP3 as: marketing/reel/public/music.mp3 */}
      <Audio
        src={staticFile("music.mp3")}
        volume={0.7}
        startFrom={0}
      />

      {/* ── Scenes ── */}
      {SCENES.map((scene, i) => {
        const Comp = scene.component;
        return (
          <Sequence key={i} from={scene.from} durationInFrames={scene.duration}>
            <AbsoluteFill>
              <Comp />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* ── Scene transition overlay ── */}
      {blackOpacity > 0 && (
        <AbsoluteFill
          style={{
            background: "#000000",
            opacity: blackOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Progress bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: `${(frame / 1200) * 100}%`,
          height: 5,
          background: "linear-gradient(90deg, #1d4ed8, #6366f1)",
          boxShadow: "0 0 12px rgba(99,102,241,0.8)",
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};
