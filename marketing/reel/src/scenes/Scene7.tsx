import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import { slideUp, scaleIn, pulse, floatY } from "../utils/animations";

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoAnim    = scaleIn(frame, fps, 3, 0.3);
  const followAnim  = slideUp(frame, fps, 16, 44);
  const contactAnim = slideUp(frame, fps, 28, 44);
  const ctaAnim     = slideUp(frame, fps, 42, 44);
  const glowPulse   = pulse(frame, 0.04, 0.24);
  const floatLogo   = floatY(frame, 0.025, 6);

  const dividerW = interpolate(frame, [18, 40], [0, 460], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #020817 0%, #051030 30%, #0d1b3e 55%, #1e3a8a 75%, #0d1b3e 88%, #020817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 64px",
        position: "relative",
        overflow: "hidden",
        gap: 0,
      }}
    >
      {/* Particles */}
      {Array.from({ length: 24 }).map((_, i) => {
        const x = ((i * 137.5) % 100);
        const y = ((i * 79.4) % 100);
        const pOpacity = interpolate(
          (frame * 0.8 + i * 12) % 60,
          [0, 30, 60],
          [0, 0.65, 0],
          { extrapolateRight: "clamp" }
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 3 + (i % 3) * 2,
              height: 3 + (i % 3) * 2,
              borderRadius: "50%",
              background: "#3b82f6",
              opacity: pOpacity * 0.55,
              boxShadow: "0 0 12px #3b82f6",
            }}
          />
        );
      })}

      {/* Big glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(37,99,235,${0.2 * glowPulse}) 0%, transparent 60%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoAnim.opacity,
          transform: `scale(${logoAnim.scale}) translateY(${floatLogo}px)`,
          marginBottom: 28,
          filter: `drop-shadow(0 0 ${34 * glowPulse}px rgba(59,130,246,0.9))`,
          zIndex: 1,
        }}
      >
        <img
          src={staticFile("logo.png")}
          style={{ width: 420, objectFit: "contain" }}
          alt="Invatiq Soft"
        />
      </div>

      {/* Divider */}
      <div
        style={{
          width: dividerW,
          height: 2,
          background: "linear-gradient(90deg, transparent, #3b82f6, #6366f1, transparent)",
          marginBottom: 24,
          zIndex: 1,
          borderRadius: 2,
        }}
      />

      {/* Follow text */}
      <div
        style={{
          transform: `translateY(${followAnim.translateY}px)`,
          opacity: followAnim.opacity,
          textAlign: "center",
          zIndex: 1,
          marginBottom: 22,
        }}
      >
        <p style={{ color: "#93c5fd", fontSize: 34, fontWeight: 700, fontFamily: "sans-serif", margin: 0 }}>
          Follow Us For
        </p>
        <h2
          style={{
            color: "#ffffff",
            fontSize: 50,
            fontWeight: 900,
            fontFamily: "sans-serif",
            margin: "4px 0 0",
            textShadow: "0 0 36px rgba(59,130,246,0.75)",
            lineHeight: 1.2,
          }}
        >
          Business Automation Tips
        </h2>
      </div>

      {/* Contact cards */}
      <div
        style={{
          transform: `translateY(${contactAnim.translateY}px)`,
          opacity: contactAnim.opacity,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          marginBottom: 24,
        }}
      >
        {[
          { icon: "📞", text: "+8801867254624",       color: "#22c55e" },
          { icon: "✉️",  text: "info@invatiqsoft.com", color: "#60a5fa" },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              padding: "18px 32px",
            }}
          >
            <span style={{ fontSize: 40 }}>{c.icon}</span>
            <p
              style={{
                color: c.color,
                fontSize: 30,
                fontWeight: 700,
                fontFamily: "sans-serif",
                margin: 0,
              }}
            >
              {c.text}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          transform: `translateY(${ctaAnim.translateY}px)`,
          opacity: ctaAnim.opacity,
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #4f46e5 100%)",
            borderRadius: 100,
            padding: "24px 68px",
            boxShadow: `0 0 ${44 * glowPulse}px rgba(37,99,235,0.7), 0 8px 34px rgba(37,99,235,0.45)`,
          }}
        >
          <p
            style={{
              color: "#ffffff",
              fontSize: 40,
              fontWeight: 900,
              fontFamily: "sans-serif",
              margin: 0,
              letterSpacing: 0.5,
            }}
          >
            💬 Message Us Today
          </p>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 44,
          opacity: taglineOpacity,
          zIndex: 1,
        }}
      >
        <p
          style={{
            color: "#475569",
            fontSize: 22,
            fontFamily: "sans-serif",
            fontWeight: 600,
            letterSpacing: 5,
            textTransform: "uppercase",
            textAlign: "center",
            margin: 0,
          }}
        >
          Innovate • Solve • Grow
        </p>
      </div>
    </div>
  );
};
