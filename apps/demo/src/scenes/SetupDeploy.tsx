import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Send, Sparkles } from "lucide-react";
import { SetupShell } from "../layouts/SetupShell";

export const SetupDeploy: React.FC = () => {
  const frame = useCurrentFrame();

  const isDeploying = frame >= 120;
  const isReady = frame >= 240;

  const contentOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bootStatus = frame < 160
    ? "booting"
    : frame < 200
    ? "connecting"
    : frame < 240
    ? "starting services"
    : "ready";

  return (
    <SetupShell
      currentStep={3}
      footerRight={
        <button className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-900 bg-zinc-100 rounded-xl">
          {!isDeploying ? "Deploy Instance" : isReady ? "Continue \u2192" : "Deploying\u2026"}
        </button>
      }
    >
      <div className="space-y-6 sm:space-y-8" style={{ opacity: contentOpacity }}>
        {isDeploying && !isReady ? (
          <div className="text-center py-10 sm:py-16">
            <div className="flex items-center justify-center gap-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-zinc-50 mb-2">
              Starting your OpenClaw instance…
            </h3>
            <p className="text-sm sm:text-base text-zinc-400">
              This takes a minute. Pairing appears as soon as we're ready.
            </p>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400">
              Status: {bootStatus}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-50">
                {isReady ? "Deployed" : "Review and deploy"}
              </h2>
              <p className="text-sm sm:text-base text-zinc-400">
                {isReady
                  ? "Your assistant is live. Continue when you are ready."
                  : "One last look. Then we'll quietly launch your assistant."}
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800/80">
                <p className="text-xs sm:text-sm text-zinc-400 uppercase tracking-widest">
                  Connected App
                </p>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-800/70 px-4 py-3 bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-zinc-300" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Telegram</p>
                      <p className="text-xs text-zinc-400">
                        {isReady ? "Connected" : "Awaiting Agent"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 rounded-2xl p-5 sm:p-6 border border-zinc-800/80">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-zinc-300" />
                  <div>
                    <h4 className="font-semibold text-zinc-100 mb-1">
                      {isReady ? "Deployed" : "Ready to deploy"}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      {isReady
                        ? "Your assistant is live. Continue when you are ready."
                        : "We will launch your assistant and take you to the dashboard."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SetupShell>
  );
};
