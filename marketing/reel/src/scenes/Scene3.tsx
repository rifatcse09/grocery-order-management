import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import { slideUp, scaleIn, pulse } from "../utils/animations";

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoAnim  = scaleIn(frame, fps, 5, 0.4);
  const textAnim  = slideUp(frame, fps, 24, 60);
  const subAnim   = slideUp(frame, fps, 36, 50);
  const glowPulse = pulse(frame, 0.04, 0.2);

  const ring1Scale   = interpolate(frame, [0, 70], [0.3, 1.9], { extrapolateRight: "clamp" });
  const ring1Opacity = interpolate(frame, [0, 35, 70], [0, 0.55, 0], { extrapolateRight: "clamp" });
  const ring2Scale   = interpolate(frame, [20, 90], [0.3, 1.9], { extrapolateRight: "clamp" });
  const ring2Opacity = interpolate(frame, [20, 55, 90], [0, 0.45, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(145deg, #020817 0%, #0d1b3e 35%, #1e3a8a 65%, #0d1b3e 85%, #020817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 70px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Particles */}
      {Array.from({ length: 22 }).map((_, i) => {
        const x = ((i * 137.5) % 100);
        const y = ((i * 97.3) % 100);
        const pOpacity = interpolate(
          (frame + i * 11) % 70,
          [0, 35, 70],
          [0, 0.55, 0],
          { extrapolateRight: "clamp" }
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#3b82f6",
              opacity: pOpacity * 0.5,
              boxShadow: "0 0 10px #3b82f6",
            }}
          />
        );
      })}

      {/* Expanding rings */}
      {[
        { scale: ring1Scale, opacity: ring1Opacity },
        { scale: ring2Scale, opacity: ring2Opacity },
      ].map((ring, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            border: "2px solid rgba(59,130,246,0.7)",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${ring.scale})`,
            opacity: ring.opacity,
          }}
        />
      ))}

      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(37,99,235,${0.25 * glowPulse}) 0%, transparent 65%)`,
          top: "48%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Logo — white version looks great on dark BG */}
      <div
        style={{
          opacity: logoAnim.opacity,
          transform: `scale(${logoAnim.scale})`,
          marginBottom: 56,
          filter: `drop-shadow(0 0 ${42 * glowPulse}px rgba(59,130,246,0.8))`,
          zIndex: 1,
        }}
      >
        <img
          src={staticFile("logo.png")}
          style={{ width: 500, objectFit: "contain" }}
          alt="Invatiq Soft"
        />
      </div>

      {/* Headline */}
      <div
        style={{
          textAlign: "center",
          zIndex: 1,
          transform: `translateY(${textAnim.translateY}px)`,
          opacity: textAnim.opacity,
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontSize: 66,
            fontWeight: 900,
            lineHeight: 1.2,
            fontFamily: "sans-serif",
            textShadow: "0 0 50px rgba(59,130,246,0.75)",
            margin: 0,
          }}
        >
          Transform Your Business with Smart Software
        </h1>
      </div>

      {/* Subtext pill */}
      <div
        style={{
          transform: `translateY(${subAnim.translateY}px)`,
          opacity: subAnim.opacity,
          marginTop: 40,
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(99,102,241,0.3))",
            border: "1.5px solid rgba(99,102,241,0.55)",
            borderRadius: 100,
            padding: "18px 56px",
          }}
        >
          <p
            style={{
              color: "#93c5fd",
              fontSize: 34,
              fontWeight: 700,
              fontFamily: "sans-serif",
              margin: 0,
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            Custom Software & Business Automation
          </p>
        </div>
      </div>
    </div>
  );
};
