import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { ArrowUp, ChevronDown, Coins } from "lucide-react";
import { DashboardShell } from "../layouts/DashboardShell";

const suggestionChips = [
  "Say hello",
  "Set your persona",
  "Ask a question",
  "Explore skills",
];

export const DashboardWelcome: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideUp = interpolate(frame, [0, 20], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <DashboardShell>
      <div
        className="h-full flex flex-col items-center justify-center px-6 relative"
        style={{ opacity: fadeIn, transform: `translateY(${slideUp}px)` }}
      >
        {/* Top bar */}
        <div className="absolute top-4 left-4">
          <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300">
            Gemini 2.5 Flash
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </div>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
            <Coins className="h-4 w-4" />
            <span>300</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
            JK
          </div>
        </div>

        {/* Hero text */}
        <h1 className="text-4xl md:text-5xl font-light text-zinc-500 mb-10 text-center">
          Say hello to your agent
        </h1>

        {/* Input box */}
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-800/70 bg-zinc-900/60 shadow-sm px-4 py-3">
          <div className="w-full min-h-[48px] text-sm text-zinc-600">
            Send a message to your agent...
          </div>
          <div className="flex items-center justify-end pt-1">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-50 text-zinc-900 opacity-30">
              <ArrowUp className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {suggestionChips.map((label) => (
            <div
              key={label}
              className="rounded-full border border-zinc-800/70 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-400"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
};
