import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { SetupShell } from "../layouts/SetupShell";

const PAIRING_CODE = "TVBEQND5";

export const SetupPairing: React.FC = () => {
  const frame = useCurrentFrame();

  const contentOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const charsVisible = Math.min(8, Math.max(0, Math.floor((frame - 20) / 6)));
  const codeChars = PAIRING_CODE.split("").map((char, i) =>
    i < charsVisible ? char : "\u00A0"
  );

  const showSuccess = frame >= 95;
  const isApproving = frame >= 80 && frame < 95;

  return (
    <SetupShell
      currentStep={4}
      footerRight={
        <button className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-900 bg-zinc-100 rounded-xl">
          {showSuccess ? "Go to dashboard \u2192" : "Continue \u2192"}
        </button>
      }
    >
      <div className="space-y-6 sm:space-y-8" style={{ opacity: contentOpacity }}>
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-50">
            Pair Telegram
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            <span className="block">
              1) Send <span>/start</span> to your Telegram bot.
            </span>
            <span className="block">
              2) Copy the 8-character code (example: <span>TVBEQND5</span>).
            </span>
            <span className="block">3) Paste it below.</span>
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-800/80 max-w-2xl mx-auto">
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-widest text-zinc-400">
              Pairing code
            </label>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
              {codeChars.map((char, index) => (
                <div
                  key={`pair-${index}`}
                  className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-zinc-800/80 bg-zinc-900 text-lg sm:text-xl font-semibold text-zinc-50 flex items-center justify-center"
                >
                  {char}
                </div>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 text-center">
              Paste your code or type it. We'll auto-format.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-900 bg-zinc-100 hover:bg-white transition-colors ${
                  isApproving ? "opacity-70" : ""
                }`}
              >
                {isApproving ? "Approving..." : "Approve pairing"}
              </button>
              {showSuccess && (
                <p className="text-xs text-emerald-300">
                  Pairing approved. Your bot is now connected!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SetupShell>
  );
};
