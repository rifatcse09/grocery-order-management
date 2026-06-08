import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { slideUp, slideIn } from "../utils/animations";

const SOLUTIONS = [
  { icon: "🛒", label: "Ecommerce Solutions",       color: "#3b82f6", rgb: "59,130,246",  delay: 8  },
  { icon: "📦", label: "Order Management Systems",  color: "#6366f1", rgb: "99,102,241",  delay: 18 },
  { icon: "🏭", label: "Inventory Management",       color: "#8b5cf6", rgb: "139,92,246",  delay: 28 },
  { icon: "🖥️", label: "POS Systems",               color: "#06b6d4", rgb: "6,182,212",   delay: 38 },
  { icon: "👥", label: "HR & Payroll",               color: "#3b82f6", rgb: "59,130,246",  delay: 48 },
  { icon: "🤝", label: "CRM Solutions",              color: "#6366f1", rgb: "99,102,241",  delay: 58 },
  { icon: "🤖", label: "AI Automation",              color: "#a855f7", rgb: "168,85,247",  delay: 68 },
];

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim = slideUp(frame, fps, 3, 45);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #020817 0%, #0d1b3e 45%, #020817 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "46px 58px",
        position: "relative",
        overflow: "hidden",
        gap: 20,
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
          width: 750,
          height: 750,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 65%)",
          top: "50%",
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
          marginBottom: 6,
        }}
      >
        <p
          style={{
            color: "#64748b",
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          What We Build
        </p>
        <h2
          style={{
            color: "#ffffff",
            fontSize: 62,
            fontWeight: 900,
            fontFamily: "sans-serif",
            margin: 0,
            textShadow: "0 0 34px rgba(99,102,241,0.65)",
          }}
        >
          Solutions We Build
        </h2>
      </div>

      {/* Cards */}
      {SOLUTIONS.map((s, i) => {
        const anim = i % 2 === 0
          ? slideIn(frame, fps, s.delay, "left", 110)
          : slideIn(frame, fps, s.delay, "right", 110);

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              background: `rgba(${s.rgb},0.1)`,
              border: `1px solid ${s.color}30`,
              borderLeft: `4px solid ${s.color}`,
              borderRadius: 16,
              padding: "19px 34px",
              width: "100%",
              zIndex: 1,
              transform: `translateX(${anim.translateX}px)`,
              opacity: anim.opacity,
            }}
          >
            <span style={{ fontSize: 46 }}>{s.icon}</span>
            <span style={{ color: s.color, fontSize: 30, fontWeight: 800 }}>✓</span>
            <p
              style={{
                color: "#e2e8f0",
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "sans-serif",
                margin: 0,
              }}
            >
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};
