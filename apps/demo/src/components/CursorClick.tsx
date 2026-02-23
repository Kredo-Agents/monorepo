import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const CursorClick: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  moveStart: number;
  moveDuration?: number;
  clickFrame?: number;
  visible?: boolean;
}> = ({
  fromX,
  fromY,
  toX,
  toY,
  moveStart,
  clickFrame,
  visible = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!visible || frame < moveStart) return null;

  const progress = spring({
    frame: frame - moveStart,
    fps,
    config: { damping: 30, stiffness: 120, mass: 0.8 },
  });

  const x = interpolate(Math.min(progress, 1), [0, 1], [fromX, toX]);
  const y = interpolate(Math.min(progress, 1), [0, 1], [fromY, toY]);

  const isClicking = clickFrame !== undefined && frame >= clickFrame && frame < clickFrame + 4;
  const scale = isClicking ? 0.85 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
