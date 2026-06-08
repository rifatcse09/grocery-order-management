import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { slideUp, floatY, scaleIn } from "../utils/animations";

const ICONS = ["📊", "📋", "🗂️", "📁", "📌", "🗃️"];

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textAnim  = slideUp(frame, fps, 8,  70);
  const subAnim   = slideUp(frame, fps, 20, 55);
  const emojiAnim = scaleIn(frame, fps, 3,  0.3);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(160deg, #0a0f1e 0%, #0d1b3e 40%, #122459 70%, #0a0f1e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 70px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating icons */}
      {ICONS.map((icon, i) => {
        const angle = (i / ICONS.length) * Math.PI * 2;
        const r = 360;
        const float = floatY(frame + i * 18, 0.025, 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${Math.cos(angle) * r}px), calc(-50% + ${Math.sin(angle) * r + float}px))`,
              fontSize: 60,
              opacity: 0.4,
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Emoji */}
      <div
        style={{
          fontSize: 120,
          marginBottom: 40,
          opacity: emojiAnim.opacity,
          transform: `scale(${emojiAnim.scale})`,
          filter: "drop-shadow(0 0 28px rgba(37,99,235,0.55))",
          zIndex: 1,
        }}
      >
        😤
      </div>

      {/* Headline */}
      <div
        style={{
          textAlign: "center",
          transform: `translateY(${textAnim.translateY}px)`,
          opacity: textAnim.opacity,
          zIndex: 1,
        }}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 20,
            fontFamily: "sans-serif",
          }}
        >
          Still managing your business with
        </p>
        <h1
          style={{
            color: "#ffffff",
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.15,
            fontFamily: "sans-serif",
            textShadow: "0 0 50px rgba(59,130,246,0.65)",
            margin: 0,
          }}
        >
          Excel Sheets & Manual Processes?
        </h1>
      </div>

      {/* Tags */}
      <div
        style={{
          transform: `translateY(${subAnim.translateY}px)`,
          opacity: subAnim.opacity,
          marginTop: 50,
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        {["Spreadsheets", "Paperwork", "Multiple Systems"].map((tag, i) => (
          <div
            key={i}
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1.5px solid rgba(239,68,68,0.5)",
              borderRadius: 100,
              padding: "14px 34px",
              color: "#fca5a5",
              fontSize: 30,
              fontFamily: "sans-serif",
              fontWeight: 700,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
};
