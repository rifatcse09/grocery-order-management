import { interpolate, spring, SpringConfig } from "remotion";

export const SPRING_CONFIG: SpringConfig = {
  damping: 18,
  mass: 0.8,
  stiffness: 100,
  overshootClamping: false,
};

export const SPRING_CONFIG_STIFF: SpringConfig = {
  damping: 22,
  mass: 0.6,
  stiffness: 140,
  overshootClamping: true,
};

export function fadeIn(frame: number, startFrame: number, duration = 20): number {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function fadeOut(frame: number, startFrame: number, duration = 20): number {
  return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function slideUp(
  frame: number,
  fps: number,
  startFrame: number,
  distance = 60
): { translateY: number; opacity: number } {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIG,
  });
  const translateY = interpolate(progress, [0, 1], [distance, 0]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });
  return { translateY, opacity };
}

export function slideIn(
  frame: number,
  fps: number,
  startFrame: number,
  direction: "left" | "right" = "left",
  distance = 80
): { translateX: number; opacity: number } {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIG,
  });
  const sign = direction === "left" ? -1 : 1;
  const translateX = interpolate(progress, [0, 1], [sign * distance, 0]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });
  return { translateX, opacity };
}

export function scaleIn(
  frame: number,
  fps: number,
  startFrame: number,
  fromScale = 0.8
): { scale: number; opacity: number } {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_CONFIG,
  });
  const scale = interpolate(progress, [0, 1], [fromScale, 1]);
  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: "clamp",
  });
  return { scale, opacity };
}

export function pulse(frame: number, frequency = 0.05, amplitude = 0.03): number {
  return 1 + Math.sin(frame * frequency * Math.PI * 2) * amplitude;
}

export function floatY(frame: number, frequency = 0.03, amplitude = 8): number {
  return Math.sin(frame * frequency * Math.PI * 2) * amplitude;
}
