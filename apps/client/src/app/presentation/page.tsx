"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/* SVG Icons (unique gradient IDs to avoid conflicts)                  */
/* ------------------------------------------------------------------ */

function KredoTokenIcon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="pk-g" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="pk-ring" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" stopOpacity="0.4" />
          <stop offset="1" stopColor="#92400E" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" stroke="url(#pk-ring)" strokeWidth="2" />
      <circle cx="60" cy="60" r="44" fill="url(#pk-g)" fillOpacity="0.12" />
      <circle cx="60" cy="42" r="14" stroke="#F59E0B" strokeWidth="3.5" fill="none" />
      <circle cx="60" cy="42" r="6" fill="#F59E0B" fillOpacity="0.3" />
      <rect x="58" y="56" width="4" height="30" rx="2" fill="#F59E0B" />
      <rect x="62" y="72" width="10" height="3.5" rx="1.5" fill="#F59E0B" />
      <rect x="62" y="64" width="7" height="3.5" rx="1.5" fill="#F59E0B" />
    </svg>
  );
}

function SigilTokenIcon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="ps-g" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="ps-ring" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DD3FC" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0369A1" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" stroke="url(#ps-ring)" strokeWidth="2" />
      <circle cx="60" cy="60" r="44" fill="url(#ps-g)" fillOpacity="0.12" />
      <polygon points="60,22 90,38 90,70 60,86 30,70 30,38" stroke="#38BDF8" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <circle cx="60" cy="46" r="4" fill="#38BDF8" fillOpacity="0.6" />
      <circle cx="47" cy="58" r="3" fill="#38BDF8" fillOpacity="0.4" />
      <circle cx="73" cy="58" r="3" fill="#38BDF8" fillOpacity="0.4" />
      <circle cx="60" cy="70" r="3.5" fill="#38BDF8" fillOpacity="0.5" />
      <line x1="60" y1="50" x2="49" y2="56" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="60" y1="50" x2="71" y2="56" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="49" y1="60" x2="58" y2="68" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="71" y1="60" x2="62" y2="68" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M55 76 C55 72, 60 68, 60 64 C60 68, 65 72, 65 76 C65 79, 62 81, 60 81 C58 81, 55 79, 55 76Z" fill="#38BDF8" fillOpacity="0.3" />
    </svg>
  );
}

function SolanaIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="psol-a" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path fill="url(#psol-a)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      <path fill="url(#psol-a)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
      <path fill="url(#psol-a)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Slide wrapper                                                       */
/* ------------------------------------------------------------------ */

function Slide({
  children,
  className = "",
  active,
  direction,
  scroll = false,
}: {
  children: React.ReactNode;
  className?: string;
  active: boolean;
  direction: "left" | "right" | "none";
  scroll?: boolean;
}) {
  if (!active) return null;
  const anim =
    direction === "none"
      ? "slide-fade-in"
      : direction === "right"
        ? "slide-in-right"
        : "slide-in-left";
  return (
    <div
      className={`absolute inset-0 flex flex-col ${scroll ? "justify-start pt-12 md:pt-16 pb-24" : "justify-center"} px-12 md:px-20 lg:px-28 ${scroll ? "overflow-y-auto" : "overflow-hidden"} ${className}`}
      style={{ animation: `${anim} 0.45s cubic-bezier(0.16, 1, 0.3, 1) both` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slide content fragments                                             */
/* ------------------------------------------------------------------ */

function SlideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[0.95] tracking-tight mb-6">
      {children}
    </h1>
  );
}

function SlideSub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-zinc-400 text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed">
      {children}
    </p>
  );
}

function SlideLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-5">
      {children}
    </p>
  );
}

function SlideCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 md:p-7 ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Presentation() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | "none">("none");

  const totalSlides = 10;

  const go = useCallback(
    (dir: "next" | "prev") => {
      setCurrent((c) => {
        const next = dir === "next" ? Math.min(c + 1, totalSlides - 1) : Math.max(c - 1, 0);
        if (next === c) return c;
        setDirection(dir === "next" ? "right" : "left");
        return next;
      });
    },
    [totalSlides]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        go("next");
      }
      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        go("prev");
      }
      if (e.key === "Home") {
        e.preventDefault();
        setDirection("left");
        setCurrent(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        setDirection("right");
        setCurrent(totalSlides - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, totalSlides]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(dx < 0 ? "next" : "prev");
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [go]);

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white overflow-hidden select-none">
      <div className="relative w-full h-full">

        {/* 0 - Title */}
        <Slide active={current === 0} direction={direction}>
          <div className="flex items-center gap-4 mb-10">
            <Image src="/logo-footer.png" alt="Kredo" width={56} height={56} />
            <span className="text-zinc-500 text-base font-semibold tracking-widest uppercase">Kredo</span>
          </div>
          <SlideLabel>Investor Pitch Deck</SlideLabel>
          <SlideTitle>
            AI Agents<br />for the Masses.
          </SlideTitle>
          <SlideSub>
            The platform that puts AI in every working household.
          </SlideSub>
        </Slide>

        {/* 1 - The Problem (0:00 - 0:25) */}
        <Slide active={current === 1} direction={direction}>
          <SlideLabel>The Problem · 0:00</SlideLabel>
          <SlideTitle>
            1 billion workers.<br />
            <span className="text-zinc-500">95% stuck on the sidelines.</span>
          </SlideTitle>
          <SlideSub>
            Deploying an AI agent today requires API keys, Docker, cloud consoles,
            security hardening. Basically, you need to be an engineer.
            Only 5% of companies have actually deployed a task-specific AI assistant.
          </SlideSub>
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-4xl">
            <SlideCard>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 tabular-nums">~10 hrs</div>
              <div className="text-sm text-zinc-400">lost per worker, per week, to repetitive tasks AI could handle in seconds</div>
            </SlideCard>
            <SlideCard>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 tabular-nums">5%</div>
              <div className="text-sm text-zinc-400">of companies have deployed task-specific AI agents</div>
            </SlideCard>
            <SlideCard>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 tabular-nums">95%</div>
              <div className="text-sm text-zinc-400">of the market is untouched</div>
            </SlideCard>
          </div>
        </Slide>

        {/* 2 - What Kredo Is (0:25 - 0:55) */}
        <Slide active={current === 2} direction={direction}>
          <SlideLabel>What Kredo Is · 0:25</SlideLabel>
          <SlideTitle>
            Your own AI agent.<br />
            <span className="text-zinc-500">In under five minutes.</span>
          </SlideTitle>
          <SlideSub>
            A self-hostable cloud platform that gives anyone — a freelancer, a creator,
            a small business owner — their own persistent AI agent, with zero technical
            knowledge required.
          </SlideSub>
          <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-5xl">
            {[
              { step: "01", title: "Name your agent", desc: "Define its purpose and personality. It maintains full memory across every conversation." },
              { step: "02", title: "Install skills", desc: "A marketplace of over 700 community-built capabilities. Coding, research, business analysis, and more." },
              { step: "03", title: "Connect your platforms", desc: "Discord, Slack, Telegram, WhatsApp. Meet your agent where you already spend time." },
              { step: "04", title: "It runs 24/7", desc: "Remembers everything, gets smarter over time. Always there when you need it." },
            ].map((s) => (
              <SlideCard key={s.step} className="flex gap-4">
                <div className="text-xl font-bold text-zinc-700 shrink-0 font-mono w-8">{s.step}</div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-2">{s.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </SlideCard>
            ))}
          </div>
        </Slide>

        {/* 3 - Why Different: Open Source (0:55 - 1:05) */}
        <Slide active={current === 3} direction={direction}>
          <SlideLabel>Why We&apos;re Different · 0:55</SlideLabel>
          <SlideTitle>
            Fully open source.
          </SlideTitle>
          <SlideSub>
            Every line of code is public, auditable, and forkable. In a world where
            AI agents touch sensitive data, trust is the product — and we earn it
            with transparency, not promises.
          </SlideSub>
          <div className="grid sm:grid-cols-3 gap-4 mt-10 max-w-5xl">
            <SlideCard>
              <div className="text-2xl text-zinc-500 mb-4 font-mono">{"\u2325"}</div>
              <h3 className="text-white font-semibold text-base mb-2">Fully auditable</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Every line of code that runs your agent is public. Security researchers, skeptics, and curious developers are all welcome.</p>
            </SlideCard>
            <SlideCard>
              <div className="text-2xl text-zinc-500 mb-4 font-mono">{"\u21E3"}</div>
              <h3 className="text-white font-semibold text-base mb-2">Self-host for free</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Don&apos;t want to pay for cloud? Run the entire stack yourself. Your agent, your server, your rules.</p>
            </SlideCard>
            <SlideCard>
              <div className="text-2xl text-zinc-500 mb-4 font-mono">{"\u2295"}</div>
              <h3 className="text-white font-semibold text-base mb-2">Community-driven</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Skills, integrations, and improvements come from contributors worldwide. No vendor lock-in, no hidden roadmap.</p>
            </SlideCard>
          </div>
        </Slide>

        {/* 4 - Why Different: Built for the World (1:05 - 1:15) */}
        <Slide active={current === 4} direction={direction}>
          <SlideLabel>Built for the World · 1:05</SlideLabel>
          <SlideTitle>
            No subscriptions.<br />
            <span className="text-zinc-500">No bank account required.</span>
          </SlideTitle>
          <SlideSub>
            You buy credits, pay for what you use, and payments settle on Solana.
            That means we can reach Lagos, Jakarta, S&#xE3;o Paulo — the fastest-growing
            markets that traditional SaaS literally can&apos;t serve.
          </SlideSub>
          <div className="flex items-center gap-4 mt-10">
            <SlideCard className="flex items-center gap-4">
              <SolanaIcon className="w-8 h-8 shrink-0" />
              <div>
                <div className="text-white font-semibold text-sm mb-1">Payments on Solana</div>
                <div className="text-zinc-500 text-sm leading-relaxed">
                  USDC payments settle via Helio. Fast, permissionless, global.
                </div>
              </div>
            </SlideCard>
          </div>
        </Slide>

        {/* 5 - Two-Token Economy (1:15 - 1:25) */}
        <Slide active={current === 5} direction={direction} scroll>
          <SlideLabel>Two-Token Economy · 1:15</SlideLabel>
          <SlideTitle>
            Stop renting intelligence.<br />
            <span className="text-zinc-500">Start owning it.</span>
          </SlideTitle>
          <div className="grid sm:grid-cols-2 gap-4 mt-8 max-w-5xl">
            <SlideCard className="relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <KredoTokenIcon className="w-12 h-12" />
                  <div>
                    <h3 className="text-amber-400 font-bold text-lg">KREDO</h3>
                    <p className="text-zinc-500 text-sm">The Base Asset</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Fixed supply, fair launched, no VCs. Holders stake and lock KREDO
                  to mint SIGIL — tokenized AI compute.
                </p>
              </div>
            </SlideCard>
            <SlideCard className="relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <SigilTokenIcon className="w-12 h-12" />
                  <div>
                    <h3 className="text-sky-400 font-bold text-lg">SIGIL</h3>
                    <p className="text-zinc-500 text-sm">Tokenized AI Compute</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Burn SIGIL, get credits. Sell SIGIL on a DEX to someone who needs compute.
                  Or just pay USDC directly if you don&apos;t want tokens at all.
                </p>
              </div>
            </SlideCard>
          </div>
          <div className="mt-6 max-w-5xl">
            <SlideCard>
              <p className="text-zinc-300 text-base md:text-lg leading-relaxed">
                Every time someone uses AI on Kredo, SIGIL gets permanently destroyed.
                That&apos;s real demand, real burn, funded by real usage — not emissions.
              </p>
            </SlideCard>
          </div>
        </Slide>

        {/* 6 - The Flow (visual) */}
        <Slide active={current === 6} direction={direction}>
          <SlideLabel>How It Works</SlideLabel>
          <SlideTitle>
            Three paths to AI.
          </SlideTitle>
          <div className="grid sm:grid-cols-3 gap-4 mt-8 max-w-5xl">
            <SlideCard>
              <KredoTokenIcon className="w-10 h-10 mb-4" />
              <h3 className="text-amber-400 font-bold text-base mb-2">Lock KREDO</h3>
              <p className="text-zinc-300 text-sm mb-2">Stake &#x2192; Lock &#x2192; Mint SIGIL &#x2192; Burn or Sell</p>
              <p className="text-zinc-500 text-sm">KREDO holders monetizing their position</p>
            </SlideCard>
            <SlideCard>
              <SigilTokenIcon className="w-10 h-10 mb-4" />
              <h3 className="text-sky-400 font-bold text-base mb-2">Buy SIGIL</h3>
              <p className="text-zinc-300 text-sm mb-2">Buy on DEX &#x2192; Burn for AI credits</p>
              <p className="text-zinc-500 text-sm">Users who want AI without holding KREDO</p>
            </SlideCard>
            <SlideCard>
              <SolanaIcon className="w-8 h-8 mb-4" />
              <h3 className="text-emerald-400 font-bold text-base mb-2">Pay USDC</h3>
              <p className="text-zinc-300 text-sm mb-2">Buy credits directly on kredo.cc</p>
              <p className="text-zinc-500 text-sm">Just want AI, no tokens at all</p>
            </SlideCard>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 mt-8 max-w-5xl">
            {[
              { label: "Stake KREDO", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Lock + Mint", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Burn SIGIL", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
              { label: "AI Credits", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            ].map((step, i) => (
              <div key={step.label} className="contents">
                {i > 0 && (
                  <svg viewBox="0 0 40 24" fill="none" className="w-10 h-6 text-zinc-600 shrink-0 hidden sm:block">
                    <path d="M2 12h32m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <div className={`flex-1 w-full sm:w-auto rounded-xl border ${step.bg} px-5 py-4 text-center`}>
                  <div className={`font-semibold text-base ${step.color}`}>{step.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Slide>

        {/* 7 - The Opportunity (1:25 - 1:55) */}
        <Slide active={current === 7} direction={direction}>
          <SlideLabel>The Opportunity · 1:25</SlideLabel>
          <SlideTitle>
            $5.1B today.<br />
            <span className="text-zinc-500">$47B by 2030.</span>
          </SlideTitle>
          <SlideSub>
            We&apos;re targeting the $8.2 billion SMB and prosumer segment — people who want
            an always-on AI assistant but shouldn&apos;t need an IT department to get one.
          </SlideSub>
          <div className="grid sm:grid-cols-3 gap-5 mt-10 max-w-4xl">
            <SlideCard>
              <div className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">TAM</div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">$47B</div>
              <div className="text-zinc-400 text-base">AI Agent Market by 2030</div>
            </SlideCard>
            <SlideCard>
              <div className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">SAM</div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">$8.2B</div>
              <div className="text-zinc-400 text-base">SMB + Prosumer Segment</div>
            </SlideCard>
            <SlideCard>
              <div className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">Unit Economics</div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">70x</div>
              <div className="text-zinc-400 text-base">$0.10 AI vs $7 human agent</div>
            </SlideCard>
          </div>
        </Slide>

        {/* 8 - Vision (1:55 - 2:05) */}
        <Slide active={current === 8} direction={direction}>
          <SlideLabel>The Vision · 1:55</SlideLabel>
          <SlideTitle>
            By 2030, five billion<br />people will have a<br />personal AI assistant.
          </SlideTitle>
          <SlideSub>
            Kredo is making sure that door is open to everyone — and that the people
            who believe early get to own a piece of the intelligence layer powering it all.
          </SlideSub>
        </Slide>

        {/* 9 - Close */}
        <Slide active={current === 9} direction={direction}>
          <SlideTitle>
            Not another AI tool<br />for engineers.
          </SlideTitle>
          <p className="text-zinc-400 text-lg md:text-xl lg:text-2xl max-w-3xl leading-relaxed mb-10">
            We&apos;re building the platform that puts AI in every working household.
          </p>
          <div className="flex items-center gap-5 mb-10">
            <Image src="/logo-footer.png" alt="Kredo" width={48} height={48} />
            <span className="text-white text-2xl font-bold tracking-tight">kredo.cc</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <KredoTokenIcon className="w-6 h-6" />
              <span className="text-amber-400 text-sm font-semibold">Buy KREDO</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <SigilTokenIcon className="w-6 h-6" />
              <span className="text-sky-400 text-sm font-semibold">Burn SIGIL</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <SolanaIcon className="w-5 h-5" />
              <span className="text-emerald-400 text-sm font-semibold">Pay USDC</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 mt-8 text-zinc-600 text-sm">
            <span>Open source</span>
            <span>Self-host for free</span>
            <span>No subscriptions</span>
            <span>Built on Solana</span>
          </div>
        </Slide>

      </div>

      {/* Navigation bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-50">
        <button
          onClick={() => go("prev")}
          disabled={current === 0}
          className="w-11 h-11 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? "right" : "left");
                setCurrent(i);
              }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-7 h-2 bg-white"
                  : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go("next")}
          disabled={current === totalSlides - 1}
          className="w-11 h-11 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Slide counter */}
      <div className="absolute top-5 right-8 text-zinc-600 text-sm font-mono z-50">
        {current + 1} / {totalSlides}
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes slide-fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
