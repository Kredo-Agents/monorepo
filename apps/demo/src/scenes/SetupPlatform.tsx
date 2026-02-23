import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Send } from "lucide-react";
import { SetupShell } from "../layouts/SetupShell";
import { useTypewriter } from "../components/TypewriterText";

export const SetupPlatform: React.FC = () => {
  const frame = useCurrentFrame();

  const isTelegramSelected = frame >= 30;
  const showDetails = frame >= 90;

  const contentOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const contentSlide = interpolate(frame, [0, 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const tokenMask = "\u2022".repeat(30);
  const typedToken = useTypewriter(tokenMask, 100, 0.8);

  return (
    <SetupShell currentStep={2}>
      <div
        className="space-y-6 sm:space-y-8"
        style={{
          opacity: contentOpacity,
          transform: `translateY(${contentSlide}px)`,
        }}
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-50 mb-2">
            Connect an app
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Pick one connected app to start. We will show the exact steps and token inputs below.
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Your agent will reach you there, you will also be able to talk to it directly in the app.
          </p>
        </div>

        {!showDetails && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                  isTelegramSelected
                    ? "border-blue-600 bg-blue-950/30"
                    : "border-zinc-800/80 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Send
                      className={`h-5 w-5 ${
                        isTelegramSelected ? "text-blue-300" : "text-zinc-500"
                      }`}
                    />
                    <div>
                      <h3 className="text-base font-semibold text-zinc-50">Telegram</h3>
                      <p className="text-xs sm:text-sm text-zinc-400">Telegram bots</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isTelegramSelected
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {isTelegramSelected ? "Selected" : "Choose"}
                  </span>
                </div>
              </button>
            </div>

            {isTelegramSelected && (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900 p-6 text-center space-y-2">
                <p className="text-sm sm:text-base text-zinc-400">
                  Great, press Continue to view the setup steps for{" "}
                  <span className="font-semibold text-zinc-100">Telegram</span>.
                </p>
                <button
                  type="button"
                  className="text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Choose a different connected app
                </button>
              </div>
            )}
          </>
        )}

        {showDetails && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-zinc-500" />
              <div>
                <h3 className="text-base font-semibold text-zinc-50">Telegram setup</h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Create a bot with BotFather and paste the token.
                </p>
              </div>
            </div>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>1) Message @BotFather and create a new bot.</p>
              <p>2) Copy the bot token.</p>
              <p>3) Optional: restrict access to chat IDs.</p>
            </div>
            <div className="space-y-3">
              <div className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-50 min-h-[44px]">
                {typedToken || (
                  <span className="text-zinc-400">Telegram bot token</span>
                )}
              </div>
              <div className="w-full px-4 py-3 text-sm sm:text-base rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 min-h-[44px]">
                Allowed chat IDs (comma-separated, optional)
              </div>
            </div>
          </div>
        )}
      </div>
    </SetupShell>
  );
};
