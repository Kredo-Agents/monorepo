import React from "react";
import { useCurrentFrame, interpolate, Easing, staticFile } from "remotion";
import { User, ArrowUp, ChevronDown, Coins } from "lucide-react";
import { DashboardShell } from "../layouts/DashboardShell";
import { useTypewriter } from "../components/TypewriterText";

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
  appearFrame: number;
};

const DEMO_MESSAGES: DemoMessage[] = [
  {
    role: "user",
    content: "Hello! What can you do?",
    appearFrame: 40,
  },
  {
    role: "assistant",
    content:
      "Hi there! I'm your Kredo AI assistant. Here's what I can help you with:\n\n- **Answer questions** on any topic\n- **Manage your schedule** and set reminders\n- **Run automations** to handle repetitive tasks\n- **Connect to Telegram** and chat with you anywhere\n\nJust ask me anything to get started!",
    appearFrame: 100,
  },
];

export const DashboardChat: React.FC = () => {
  const frame = useCurrentFrame();

  const userInput = "Hello! What can you do?";
  const typedInput = useTypewriter(userInput, 0, 0.7);
  const inputVisible = frame < 40;

  const showTypingIndicator = frame >= 42 && frame < 100;

  return (
    <DashboardShell>
      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300">
            Gemini 2.5 Flash
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Coins className="h-4 w-4" />
              <span>299</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
              JK
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {DEMO_MESSAGES.map((message, idx) => {
              if (frame < message.appearFrame) return null;

              const msgAge = frame - message.appearFrame;
              const msgOpacity = interpolate(msgAge, [0, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const msgSlide = interpolate(msgAge, [0, 12], [20, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              });

              let displayContent = message.content;
              if (message.role === "assistant") {
                const charsShown = Math.min(
                  message.content.length,
                  Math.floor(msgAge * 3)
                );
                displayContent = message.content.slice(0, charsShown);
              }

              return (
                <div
                  key={idx}
                  className={
                    message.role === "user"
                      ? "ml-auto text-right"
                      : "mr-auto text-left"
                  }
                  style={{
                    opacity: msgOpacity,
                    transform: `translateY(${msgSlide}px)`,
                  }}
                >
                  <div
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {message.role === "user" ? (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-zinc-50 text-zinc-900">
                        <User className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full shrink-0 bg-zinc-800 flex items-center justify-center p-2">
                        <img
                          src={staticFile("logo-footer.png")}
                          alt="Assistant"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-xl ${
                        message.role === "user"
                          ? "bg-zinc-50 text-zinc-900"
                          : "bg-zinc-900/60 text-zinc-100 border border-zinc-800/70"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="whitespace-pre-wrap">
                          {displayContent.split("\n").map((line, li) => {
                            const parts = line.split(/(\*\*[^*]+\*\*)/g);
                            return (
                              <React.Fragment key={li}>
                                {li > 0 && <br />}
                                {parts.map((part, pi) => {
                                  if (
                                    part.startsWith("**") &&
                                    part.endsWith("**")
                                  ) {
                                    return (
                                      <strong key={pi}>
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return <span key={pi}>{part}</span>;
                                })}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      ) : (
                        displayContent
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {showTypingIndicator && (
              <div className="mr-auto text-left">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full shrink-0 bg-zinc-800 flex items-center justify-center p-2">
                    <img
                      src={staticFile("logo-footer.png")}
                      alt="Assistant"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed bg-zinc-900/60 text-zinc-100 border border-zinc-800/70">
                    <span className="dot-wave">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="px-6 py-4">
          <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-4 py-3 shadow-sm">
            <div className="w-full min-h-[60px] text-sm text-zinc-100">
              {inputVisible ? (
                typedInput || (
                  <span className="text-zinc-600">Send a message...</span>
                )
              ) : (
                <span className="text-zinc-600">Send a message...</span>
              )}
            </div>
            <div className="flex items-center justify-end pt-1">
              <div
                className={`inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-50 text-zinc-900 transition-colors ${
                  inputVisible && typedInput ? "" : "opacity-30"
                }`}
              >
                <ArrowUp className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};
