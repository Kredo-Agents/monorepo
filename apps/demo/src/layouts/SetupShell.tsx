import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

type Step = { id: number; title: string; description: string };

const allSteps: Step[] = [
  { id: 1, title: "Welcome", description: "Name your assistant" },
  { id: 2, title: "Connected App", description: "Pick one app to connect" },
  { id: 3, title: "Deploy", description: "Review and launch" },
  { id: 4, title: "Pairing", description: "Connect your account" },
];

export const SetupShell: React.FC<{
  currentStep: number;
  children: React.ReactNode;
  showPairingStep?: boolean;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
}> = ({ currentStep, children, showPairingStep = true, footerLeft, footerRight }) => {
  const frame = useCurrentFrame();
  const steps = showPairingStep ? allSteps : allSteps.slice(0, 3);

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const slideUp = interpolate(frame, [0, 18], [28, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <main
      className="min-h-full bg-black py-10 sm:py-16 flex-1"
      style={{ opacity: fadeIn, transform: `translateY(${slideUp}px)` }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-left sm:text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            OpenClaw Setup
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[44px] leading-tight font-semibold text-zinc-50 mb-3 tracking-tight">
            Set up your assistant
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl sm:mx-auto">
            A two-minute setup. You can change everything later.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      isActive
                        ? "border-zinc-100 text-zinc-100"
                        : isComplete
                        ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {step.id}
                  </div>
                  <div
                    className={`text-sm font-semibold transition-colors ${
                      isActive || isComplete ? "text-zinc-50" : "text-zinc-400"
                    }`}
                  >
                    {step.title}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block h-px w-8 bg-zinc-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur overflow-hidden">
          <div className="px-6 sm:px-10 py-5 border-b border-zinc-800/70 bg-zinc-900/50 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-400">
                Step {currentStep} of {steps.length}
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-50">
                {steps.find((s) => s.id === currentStep)?.title}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex h-2 w-2 rounded-full bg-zinc-600" />
              In progress
            </div>
          </div>

          <div className="p-6 sm:p-10 min-h-[380px]">{children}</div>

          <div className="px-6 sm:px-10 pb-6 sm:pb-10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
              {footerLeft || (
                <button className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-50 border border-zinc-700/80 rounded-xl">
                  {currentStep === 1 ? "Cancel" : "Back"}
                </button>
              )}
              {footerRight || (
                <button className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-zinc-900 bg-zinc-100 rounded-xl">
                  {currentStep === 1 ? "Get started \u2192" : "Continue \u2192"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
