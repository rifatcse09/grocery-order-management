import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { slideUp } from "../utils/animations";

const WORDS = [
  { text: "Automate.", color: "#93c5fd", size: 100, start: 4  },
  { text: "Scale.",    color: "#60a5fa", size: 116, start: 18 },
  { text: "Grow.",     color: "#3b82f6", size: 134, start: 32 },
];

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subAnim = slideUp(frame, fps, 46, 44);

  const dividerW = interpolate(frame, [40, 62], [0, 520], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const iconsOpacity = interpolate(frame, [56, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(145deg, #020817 0%, #0a1628 30%, #0d2352 55%, #1e3a8a 75%, #0d2352 88%, #020817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Concentric rings */}
      {[1, 1.5, 2].map((scale, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 540,
            height: 540,
            borderRadius: "50%",
            border: "1px solid rgba(59,130,246,0.18)",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        />
      ))}

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          width: 750,
          height: 750,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 60%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Kinetic words */}
      <div style={{ textAlign: "center", zIndex: 1, marginBottom: 28 }}>
        {WORDS.map((w, i) => {
          const wOpacity = interpolate(frame, [w.start, w.start + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const wY = interpolate(frame, [w.start, w.start + 20], [65, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={i} style={{ opacity: wOpacity, transform: `translateY(${wY}px)` }}>
              <span
                style={{
                  color: w.color,
                  fontSize: w.size,
                  fontWeight: 900,
                  fontFamily: "sans-serif",
                  lineHeight: 1.1,
                  letterSpacing: -2,
                  textShadow: `0 0 60px ${w.color}`,
                  display: "block",
                }}
              >
                {w.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div
        style={{
          width: dividerW,
          height: 3,
          background: "linear-gradient(90deg, transparent, #3b82f6, #6366f1, transparent)",
          marginBottom: 36,
          zIndex: 1,
          borderRadius: 2,
        }}
      />

      {/* Subtext */}
      <div
        style={{
          textAlign: "center",
          zIndex: 1,
          transform: `translateY(${subAnim.translateY}px)`,
          opacity: subAnim.opacity,
        }}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: 38,
            fontWeight: 500,
            fontFamily: "sans-serif",
            fontStyle: "italic",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Let technology work
          <br />
          <span style={{ color: "#e2e8f0", fontStyle: "normal", fontWeight: 700 }}>
            for your business.
          </span>
        </p>
      </div>

      {/* Success icons */}
      <div
        style={{
          display: "flex",
          gap: 48,
          zIndex: 1,
          marginTop: 60,
          opacity: iconsOpacity,
        }}
      >
        {["📈", "💼", "🏆"].map((icon, i) => (
          <span
            key={i}
            style={{
              fontSize: 76,
              filter: "drop-shadow(0 0 22px rgba(59,130,246,0.75))",
            }}
          >
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
};
