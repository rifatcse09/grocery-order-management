import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { slideUp, slideIn, pulse } from "../utils/animations";

const POINTS = [
  { icon: "⚡", label: "Custom Built Solutions", desc: "Tailored to your exact needs",  delay: 6  },
  { icon: "🏗️", label: "Scalable Architecture",  desc: "Grows with your business",      delay: 18 },
  { icon: "🛡️", label: "Dedicated Support",      desc: "We're with you every step",     delay: 30 },
  { icon: "🚀", label: "Fast Delivery",           desc: "Go live in weeks, not months",  delay: 42 },
  { icon: "🔒", label: "Secure & Reliable",       desc: "Enterprise-grade security",     delay: 54 },
];

const BARS = [
  { label: "Efficiency", value: 92 },
  { label: "ROI",        value: 85 },
  { label: "Growth",     value: 78 },
];

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim = slideUp(frame, fps, 3, 45);
  const glowPulse = pulse(frame, 0.035, 0.1);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(155deg, #020817 0%, #041029 40%, #0d1b3e 70%, #020817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "42px 58px",
        position: "relative",
        overflow: "hidden",
        gap: 18,
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(37,99,235,${0.12 * glowPulse}) 0%, transparent 65%)`,
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          zIndex: 1,
          transform: `translateY(${titleAnim.translateY}px)`,
          opacity: titleAnim.opacity,
          marginBottom: 4,
        }}
      >
        <p
          style={{
            color: "#64748b",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Trusted By Businesses
        </p>
        <h2
          style={{
            color: "#ffffff",
            fontSize: 54,
            fontWeight: 900,
            fontFamily: "sans-serif",
            margin: 0,
            textShadow: "0 0 34px rgba(59,130,246,0.65)",
            lineHeight: 1.15,
          }}
        >
          Why Businesses Choose Invatiq Soft
        </h2>
      </div>

      {/* Points */}
      {POINTS.map((p, i) => {
        const anim = slideIn(frame, fps, p.delay, "left", 100);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              background: "rgba(37,99,235,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderLeft: "4px solid #2563eb",
              borderRadius: 16,
              padding: "18px 28px",
              width: "100%",
              zIndex: 1,
              transform: `translateX(${anim.translateX}px)`,
              opacity: anim.opacity,
            }}
          >
            <span style={{ fontSize: 42 }}>{p.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#22c55e", fontSize: 26, fontWeight: 700 }}>✓</span>
                <p
                  style={{
                    color: "#f1f5f9",
                    fontSize: 30,
                    fontWeight: 700,
                    fontFamily: "sans-serif",
                    margin: 0,
                  }}
                >
                  {p.label}
                </p>
              </div>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 22,
                  fontFamily: "sans-serif",
                  margin: "3px 0 0 36px",
                  fontWeight: 400,
                }}
              >
                {p.desc}
              </p>
            </div>
          </div>
        );
      })}

      {/* Growth bars */}
      <div
        style={{
          display: "flex",
          gap: 28,
          zIndex: 1,
          marginTop: 4,
          opacity: interpolate(frame, [60, 76], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {BARS.map((b, i) => {
          const barH = interpolate(frame, [60 + i * 5, 95 + i * 5], [0, b.value * 1.4], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
            >
              <p style={{ color: "#93c5fd", fontSize: 24, fontWeight: 700, fontFamily: "sans-serif", margin: 0 }}>
                {b.value}%
              </p>
              <div
                style={{
                  width: 66,
                  height: 140,
                  background: "rgba(59,130,246,0.1)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "flex-end",
                  overflow: "hidden",
                  border: "1px solid rgba(59,130,246,0.22)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: barH,
                    background: "linear-gradient(180deg, #3b82f6, #1d4ed8)",
                    borderRadius: 10,
                    boxShadow: "0 0 16px rgba(59,130,246,0.6)",
                  }}
                />
              </div>
              <p style={{ color: "#64748b", fontSize: 20, fontFamily: "sans-serif", margin: 0 }}>
                {b.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
