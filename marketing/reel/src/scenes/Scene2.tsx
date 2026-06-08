import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { slideUp, slideIn } from "../utils/animations";

const PROBLEMS = [
  { icon: "❌", label: "Lost Orders",        sub: "Costing you customers",   color: "#ef4444", rgb: "239,68,68",  delay: 5  },
  { icon: "📦", label: "Inventory Mistakes", sub: "Stock mismatches daily",  color: "#f97316", rgb: "249,115,22", delay: 20 },
  { icon: "📉", label: "Manual Reporting",   sub: "Hours wasted every week", color: "#eab308", rgb: "234,179,8",  delay: 35 },
];

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAnim = slideUp(frame, fps, 2, 45);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #0a0f1e 0%, #1a0a0a 50%, #0f0a1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 65px",
        position: "relative",
        overflow: "hidden",
        gap: 44,
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Red glow */}
      <div
        style={{
          position: "absolute",
          width: 650,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(239,68,68,0.14) 0%, transparent 70%)",
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
        }}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            marginBottom: 10,
          }}
        >
          Sound familiar?
        </p>
        <h2
          style={{
            color: "#ef4444",
            fontSize: 68,
            fontWeight: 900,
            fontFamily: "sans-serif",
            textShadow: "0 0 36px rgba(239,68,68,0.65)",
            margin: 0,
          }}
        >
          Business Pain Points
        </h2>
      </div>

      {/* Problem cards */}
      {PROBLEMS.map((p, i) => {
        const anim = slideIn(frame, fps, p.delay, "left", 130);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              background: `rgba(${p.rgb},0.1)`,
              border: `1.5px solid ${p.color}45`,
              borderLeft: `5px solid ${p.color}`,
              borderRadius: 22,
              padding: "34px 46px",
              width: "100%",
              zIndex: 1,
              transform: `translateX(${anim.translateX}px)`,
              opacity: anim.opacity,
            }}
          >
            <span style={{ fontSize: 72 }}>{p.icon}</span>
            <div>
              <p
                style={{
                  color: p.color,
                  fontSize: 42,
                  fontWeight: 900,
                  fontFamily: "sans-serif",
                  margin: 0,
                  textShadow: `0 0 22px ${p.color}88`,
                }}
              >
                {p.label}
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 26,
                  fontFamily: "sans-serif",
                  margin: "8px 0 0",
                  fontWeight: 500,
                }}
              >
                {p.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
