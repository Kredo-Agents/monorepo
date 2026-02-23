import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { SetupShell } from "../layouts/SetupShell";

export const SetupWelcome: React.FC = () => {
  const frame = useCurrentFrame();

  const contentOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentSlide = interpolate(frame, [8, 25], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <SetupShell currentStep={1}>
      <div
        className="space-y-6 sm:space-y-8"
        style={{
          opacity: contentOpacity,
          transform: `translateY(${contentSlide}px)`,
        }}
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-50">
            Welcome to Kredo
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            You're a minute away from getting your very own AI assistant.
          </p>
          <p className="text-sm sm:text-base text-zinc-400">
            This setup wizard will guide you through the process.
          </p>
        </div>
      </div>
    </SetupShell>
  );
};
