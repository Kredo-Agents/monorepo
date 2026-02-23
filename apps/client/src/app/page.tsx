"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound, Monitor, Blocks, MessageSquare, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Icons                                                                 */
/* ------------------------------------------------------------------ */

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.118 18.1.138 18.113a19.873 19.873 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function SolanaIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sol-a" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path fill="url(#sol-a)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      <path fill="url(#sol-a)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
      <path fill="url(#sol-a)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Animation primitives                                                  */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.15) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [el, threshold]);
  return { ref: setEl, inView };
}

function useCounter(to: number, duration = 2000, active: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setV(Math.round((1 - (1 - p) ** 3) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, to, duration]);
  return v;
}

// Scroll-triggered reveal: fades in + slides up when entering the viewport.
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout primitives                                                     */
/* ------------------------------------------------------------------ */

function InsightSection({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`border-b border-zinc-800 px-6 sm:px-8 md:px-16 py-16 md:py-24 lg:py-32 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-5">
      {children}
    </p>
  );
}

function Card({
  children,
  className = "",
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 p-5 md:p-8 ${active ? "bg-zinc-800/60" : "bg-zinc-900/60"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat counter card — entrance tied to same flag as the counter        */
/* ------------------------------------------------------------------ */

function StatCard({
  value,
  suffix = "",
  prefix = "",
  label,
  sub,
  active,
  duration = 2000,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sub: string;
  active: boolean;
  duration?: number;
  delay?: number;
}) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);

  const count = useCounter(value, duration, go);
  return (
    <div style={{
      opacity: go ? 1 : 0,
      transform: go ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
    }}>
      <Card>
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tabular-nums tracking-tight">
          {prefix}
          {count.toLocaleString()}
          {suffix}
        </div>
        <div className="text-sm font-semibold text-zinc-300 mb-1">{label}</div>
        <div className="text-xs text-zinc-500 leading-relaxed">{sub}</div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Growth bar                                                            */
/* ------------------------------------------------------------------ */

function GrowthBar({
  label,
  value,
  max,
  active,
  delay = 0,
}: {
  label: string;
  value: number;
  max: number;
  active: boolean;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setWidth((value / max) * 100), delay);
    return () => clearTimeout(t);
  }, [active, value, max, delay]);

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="text-zinc-500 text-xs sm:text-sm w-9 sm:w-10 shrink-0 font-mono">
        {label}
      </div>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="text-zinc-400 text-xs sm:text-sm font-medium w-12 sm:w-14 text-right shrink-0">
        ${value}B
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating big number                                                   */
/* ------------------------------------------------------------------ */

function FloatingBig({ to, active }: { to: number; active: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 2000, 1);
      setV((1 - (1 - p) ** 3) * to);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, to]);
  return <>{v.toFixed(1)}</>;
}

/* ------------------------------------------------------------------ */
/* TAM card                                                              */
/* ------------------------------------------------------------------ */

function TamCard({
  label,
  amount,
  sub,
  active,
  delay,
}: {
  label: string;
  amount: string;
  sub: string;
  active: boolean;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
    }}>
      <Card>
        <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          {label}
        </div>
        <div className="text-3xl md:text-4xl font-bold text-white mb-2">{amount}</div>
        <div className="text-sm text-zinc-400">{sub}</div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home feature cards data                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: <UserRound className="w-5 h-5 text-zinc-400" />,
    title: "Unique AI identity",
    desc: "Give your agent a name and personality. It remembers everything.",
  },
  {
    icon: <Monitor className="w-5 h-5 text-zinc-400" />,
    title: "Persistent memory & skills",
    desc: "24/7 cloud assistant that keeps full context and memory.",
  },
  {
    icon: <Blocks className="w-5 h-5 text-zinc-400" />,
    title: "Custom skills",
    desc: "Equip your assistant with expert knowledge from ClawHub.",
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-zinc-400" />,
    title: "Works in your messenger",
    desc: "Available on Discord, Slack, Matrix and more.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [showInsight, setShowInsight] = useState(false);
  const insightRef = useRef<HTMLDivElement>(null);

  const { ref: statsRef, inView: statsIn } = useInView();
  const { ref: growthRef, inView: growthIn } = useInView();
  const { ref: tamRef, inView: tamIn } = useInView();
  const { ref: visionRef, inView: visionIn } = useInView();
  const visionCount = useCounter(5, 1500, visionIn);

  const handleReadMore = () => {
    setShowInsight(true);
    setTimeout(() => {
      insightRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <main className="bg-zinc-950">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-20 md:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center">

          {/* Phone visual */}
          <div
            className="relative w-full max-w-[500px] h-[280px] animate-hero-in"
            style={{ animationDelay: "0ms" }}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 overflow-hidden w-52 rounded-t-[2.5rem] shadow-2xl"
              style={{ top: "calc(50% - 160px)", height: "200px" }}
            >
              <div className="w-full h-80 bg-zinc-900 border border-zinc-700/70 rounded-t-[2.5rem]">
                <div className="flex justify-center pt-4">
                  <div className="w-14 h-1.5 bg-zinc-700 rounded-full" />
                </div>
                <div className="flex justify-center mt-2">
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                </div>
              </div>
            </div>

            <div className="absolute left-[12%] top-[20%]">
              <div className="animate-float-1 w-14 h-14 rounded-full bg-[#229ED9] flex items-center justify-center shadow-xl">
                <TelegramIcon />
              </div>
            </div>

            <div className="absolute top-[-5%] left-[20%]">
              <div className="animate-float-2 w-14 h-14 rounded-full bg-[#5865F2] flex items-center justify-center shadow-xl">
                <DiscordIcon />
              </div>
            </div>

            <div className="absolute top-[-5%] right-[20%]">
              <div className="animate-float-3 w-14 h-14 rounded-full bg-[#4A154B] flex items-center justify-center shadow-xl">
                <SlackIcon />
              </div>
            </div>

            <div className="absolute right-[12%] top-[20%]">
              <div className="animate-float-4 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl">
                <WhatsAppIcon />
              </div>
            </div>

            <div className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-zinc-800 border border-zinc-700/80 rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3 w-64">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 p-2">
                  <Image src="/logo-footer.png" alt="Kredo" width={28} height={28} className="light:invert" />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-sm">Kredo</span>
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="dot-wave mt-2">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl mt-[-90px] md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-5 animate-hero-in"
            style={{ animationDelay: "160ms" }}
          >
            Claim your own agent
          </h1>

          {/* Subtitle */}
          <p
            className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 animate-hero-in"
            style={{ animationDelay: "300ms" }}
          >
            Deploy your AI assistant in the cloud. Connect it to your favorite
            messengers. Install skills from ClawHub or write your own.
          </p>

          {/* CTA */}
          <a
            href="/setup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-zinc-900 bg-white rounded-xl hover:bg-zinc-100 transition-colors mb-20 animate-hero-in"
            style={{ animationDelay: "420ms" }}
          >
            Get Started
          </a>

          {/* Feature cards */}
          <div
            id="features"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl"
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left animate-hero-in"
                style={{ animationDelay: `${520 + i * 80}ms` }}
              >
                <div className="mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Floating read-more button ────────────────────────────────── */}
      {!showInsight && (
        <div className="sticky bottom-8 flex justify-center z-50 pointer-events-none pb-4 animate-hero-in" style={{ animationDelay: "800ms", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={handleReadMore}
            className="pointer-events-auto flex flex-col items-center gap-1.5 group"
          >
            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest group-hover:text-white transition-colors">
              Read more
            </span>
            <div className="w-10 h-10 mt-2 rounded-full border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center group-hover:border-zinc-500 group-hover:bg-zinc-800 transition-all animate-bounce">
              <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
      )}

      {/* ── Insight content ──────────────────────────────────────────── */}
      <div ref={insightRef} />
      {showInsight && (
        <div className="text-white">

          {/* ── Insight Hero ───────────────────────────────────────── */}
          <section className="relative border-b border-zinc-800 min-h-[85vh] flex flex-col justify-end px-6 sm:px-8 md:px-16 py-16 md:py-24">
            <div className="max-w-xl relative z-10">
              <div className="animate-hero-in" style={{ animationDelay: "0ms" }}>
                <SectionLabel>Business Insight · 2026</SectionLabel>
              </div>
              <h1
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tight mb-6 md:mb-8 animate-hero-in"
                style={{ animationDelay: "100ms" }}
              >
                The AI Agent<br />Revolution<br />Has Begun.
              </h1>
              <p
                className="text-zinc-400 text-base md:text-lg max-w-sm leading-relaxed mb-8 md:mb-12 animate-hero-in"
                style={{ animationDelay: "220ms" }}
              >
                Most people are watching from the outside.
                We&apos;re building the door.
              </p>
              <div
                className="flex flex-wrap gap-3 animate-hero-in"
                style={{ animationDelay: "340ms" }}
              >
                <Link
                  href="/setup"
                  className="px-5 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
                >
                  Claim your agent →
                </Link>
                <a
                  href="#problem"
                  className="px-5 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-semibold text-sm hover:border-zinc-500 hover:text-white transition-colors"
                >
                  See the opportunity
                </a>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-[240px] sm:w-[340px] md:w-[480px] translate-y-[18%] hidden sm:block animate-hero-in" style={{ animationDelay: "200ms" }}>
              <Image
                src="/insight-1.png"
                alt=""
                width={480}
                height={360}
                className="object-cover object-top w-full rounded-tl-2xl"
                priority
              />
            </div>
          </section>

          {/* ── Problem ──────────────────────────────────────────────── */}
          <InsightSection id="problem" className="relative z-10 bg-zinc-950">
            <div className="max-w-5xl mx-auto">
              <Reveal><SectionLabel>The Problem</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  AI is only for<br />the privileged.
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
                  Despite the hype, running your own AI agent is locked behind
                  engineering teams and enterprise budgets.
                </p>
              </Reveal>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "The knowledge barrier is real",
                    desc: "You don't need a dev team, but you do need to know what you're doing. Cloud infra, API keys, model config, and security aren't trivial. And running it on your own machine isn't safe.",
                  },
                  {
                    title: "Enterprise or nothing",
                    desc: "Custom deployments start at $50K and balloon from there. The gap between a toy chatbot and a real agent is a six-figure bill.",
                  },
                  {
                    title: "You own nothing",
                    desc: "Most platforms are closed. You can't move your agent, customize it, or run it in the messengers you actually use.",
                  },
                ].map((item, i) => (
                  <Reveal key={item.title} delay={300 + i * 100} className="h-full">
                    <Card active={i === 0} className="h-full">
                      <h3 className="text-white font-semibold text-base md:text-lg mb-3">{item.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          </InsightSection>

          {/* ── Market Reality ───────────────────────────────────────── */}
          <InsightSection>
            <div className="max-w-5xl mx-auto" ref={statsRef}>
              <Reveal><SectionLabel>Market Reality</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-10 md:mb-16 leading-tight">
                  The numbers<br />don&apos;t lie.
                </h2>
              </Reveal>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
                <StatCard value={1} suffix="B+" label="Knowledge workers" sub="globally who could benefit from a personal AI agent" active={statsIn} delay={0} />
                <StatCard value={5} suffix="%" label="Have AI agents" sub="Fewer than 1 in 20 companies has deployed task-specific AI agents" active={statsIn} delay={100} />
                <StatCard value={95} suffix="%" label="Market gap" sub="The opportunity that hasn't been touched yet" active={statsIn} delay={200} />
                <StatCard value={70} suffix="×" label="Cost reduction" sub="AI handles queries at $0.10 vs $7 for a human agent" active={statsIn} delay={300} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <StatCard value={9} suffix=".3 hrs/wk" label="Lost to repetition" sub="Average time a knowledge worker loses to tasks an agent could handle" active={statsIn} delay={400} />
                <StatCard value={3200} suffix="M" label="Messaging app users" sub="Already spending their day in Discord, Slack, Telegram, WhatsApp" active={statsIn} delay={500} />
                <StatCard value={2600} prefix="$" suffix="B" label="Productivity unlock" sub="Estimated minimum annual gains from AI across industries globally" active={statsIn} duration={2500} delay={600} />
              </div>

              <Reveal delay={700}>
                <p className="text-zinc-600 text-xs mt-8">
                  Sources:{" "}
                  <a href="https://go.forrester.com/blogs/the-global-information-worker-population-swells-to-1-25-billion-in-2018/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2 transition-colors">Forrester</a>
                  {" · "}
                  <a href="https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2 transition-colors">Gartner</a>
                  {" · "}
                  <a href="https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2 transition-colors">McKinsey Global Institute</a>
                  {" · "}
                  <a href="https://datareportal.com/global-digital-overview" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 underline underline-offset-2 transition-colors">DataReportal</a>
                </p>
              </Reveal>
            </div>
          </InsightSection>

          {/* ── Market Growth ────────────────────────────────────────── */}
          <InsightSection>
            <div className="max-w-5xl mx-auto" ref={growthRef}>
              <Reveal><SectionLabel>Market Growth</SectionLabel></Reveal>
              <Reveal delay={100}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-16">
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight">
                    $5.1B in 2024.<br />
                    $<FloatingBig to={47.1} active={growthIn} />B by 2030.
                  </h2>
                  <div className="shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-full text-zinc-400 text-sm">
                      44.8% CAGR
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="space-y-4 md:space-y-5">
                  {[
                    { label: "2024", value: 5.1, delay: 0 },
                    { label: "2025", value: 9.2, delay: 150 },
                    { label: "2026", value: 14.8, delay: 300 },
                    { label: "2027", value: 22.1, delay: 450 },
                    { label: "2028", value: 31.5, delay: 600 },
                    { label: "2030", value: 47.1, delay: 750 },
                  ].map((row) => (
                    <GrowthBar key={row.label} label={row.label} value={row.value} max={47.1} active={growthIn} delay={row.delay} />
                  ))}
                </div>
              </Reveal>

              <Reveal delay={400}>
                <p className="text-zinc-600 text-xs mt-8">
                  Sources: MarketsandMarkets · Grand View Research
                </p>
              </Reveal>
            </div>
          </InsightSection>

          {/* ── Solution ─────────────────────────────────────────────── */}
          <section className="relative border-b border-zinc-800 py-16 md:py-24 lg:py-32">
            <div className="absolute bottom-0 left-0 translate-y-[20%] hidden sm:block pointer-events-none scale-x-[-1]">
              <Image
                src="/insight-2.png"
                alt=""
                width={900}
                height={640}
                className="w-[500px] md:w-[700px] lg:w-[900px] h-auto"
              />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 md:px-16">
              <Reveal><SectionLabel>What we built</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  Your agent,<br />running in 5 minutes.
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed mb-10 md:mb-16">
                  Kredo is a self-hostable cloud platform that gives anyone a
                  persistent, skills-enabled AI agent with zero infrastructure
                  knowledge required.
                </p>
              </Reveal>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { step: "01", title: "Name your agent", desc: "Set a name, personality, and purpose. Your agent maintains full memory across every conversation. It never forgets who you are." },
                  { step: "02", title: "Install skills from ClawHub", desc: "Drop in pre-built skill packs: coding help, research, business analysis, and more. Or write your own in plain Markdown." },
                  { step: "03", title: "Connect your messengers", desc: "Discord, Slack, Telegram, WhatsApp, Matrix. One deployment, all your platforms. Meet your agent where you already spend time." },
                  { step: "04", title: "It runs 24/7", desc: "Persistent uptime and full context continuity. Send a message at 3am, pick up the thread at noon. It's always there." },
                ].map((s, i) => (
                  <Reveal key={s.step} delay={300 + i * 100} className="h-full">
                    <Card className="flex gap-4 h-full">
                      <div className="text-xl font-bold text-zinc-700 shrink-0 font-mono w-8">{s.step}</div>
                      <div>
                        <h3 className="text-white font-semibold text-sm md:text-base mb-2">{s.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                      </div>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ── Market Opportunity ───────────────────────────────────── */}
          <InsightSection className="relative z-10 bg-zinc-950">
            <div className="max-w-5xl mx-auto" ref={tamRef}>
              <Reveal><SectionLabel>Market Opportunity</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  A $47B market,<br />barely scratched.
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
                  We focus on the segment nobody else is serving: developers, power
                  users, and small teams who need a real AI agent but don&apos;t have
                  an IT department.
                </p>
              </Reveal>

              <div className="grid sm:grid-cols-3 gap-4">
                <TamCard label="TAM" amount="$47.1B" sub="Total AI Agent Market by 2030" active={tamIn} delay={300} />
                <TamCard label="SAM" amount="$8.2B" sub="SMB + Prosumer Segment" active={tamIn} delay={450} />
                <TamCard label="SOM" amount="$1.4B" sub="Developer + Power User Target" active={tamIn} delay={600} />
              </div>
            </div>
          </InsightSection>

          {/* ── Business Model ───────────────────────────────────────── */}
          <InsightSection>
            <div className="max-w-5xl mx-auto">
              <Reveal><SectionLabel>Business Model</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  Pay for what you use.<br />Nothing more.
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
                  No monthly subscriptions. Credits bought with USDC on Solana,
                  spent as you go.
                </p>
              </Reveal>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <Reveal delay={300} className="h-full">
                  <Card className="h-full">
                    <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-5">
                      How credits work
                    </div>
                    <ul className="space-y-4">
                      {[
                        { label: "0.1 credits", desc: "per chat message sent to your agent" },
                        { label: "5 credits", desc: "per day your agent instance is running" },
                        { label: "USDC on Solana", desc: "how you buy credits, via Helio. No bank required." },
                        { label: "No lock-in", desc: "self-host for free, or top up anytime on cloud" },
                      ].map((row) => (
                        <li key={row.label} className="flex flex-col sm:flex-row sm:gap-4 gap-0.5">
                          <span className="text-white font-semibold text-sm shrink-0 sm:w-28">{row.label}</span>
                          <span className="text-zinc-500 text-sm">{row.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>

                <Reveal delay={400} className="h-full">
                  <Card className="h-full">
                    <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-5">
                      Revenue streams
                    </div>
                    <ul className="space-y-5">
                      {[
                        { title: "Cloud credits", desc: "Managed hosting for users who don't want to self-host. Pay only for what's consumed." },
                        { title: "Enterprise self-hosted", desc: "Custom pricing for teams deploying at scale with SLAs and dedicated infra." },
                      ].map((s) => (
                        <li key={s.title}>
                          <div className="text-white font-semibold text-sm mb-1">{s.title}</div>
                          <div className="text-zinc-500 text-xs leading-relaxed">{s.desc}</div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>
              </div>

              <Reveal delay={500}>
                <Card className="flex items-start sm:items-center gap-4">
                  <div className="shrink-0 mt-0.5 sm:mt-0">
                    <SolanaIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm mb-1">Built on Solana</div>
                    <div className="text-zinc-500 text-sm leading-relaxed">
                      Payments settle via Helio using USDC. Fast, permissionless,
                      global. Anyone can top up without a bank account.
                    </div>
                  </div>
                </Card>
              </Reveal>
            </div>
          </InsightSection>

          {/* ── Open Source ──────────────────────────────────────────── */}
          <InsightSection>
            <div className="max-w-5xl mx-auto">
              <Reveal><SectionLabel>Open Source</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  Built in the open.<br />Nothing to hide.
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
                  The entire platform is open source. Read the code, audit it,
                  fork it, or self-host it for free. Trust shouldn&apos;t require
                  taking anyone&apos;s word for it.
                </p>
              </Reveal>

              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                {[
                  {
                    icon: "⌥",
                    title: "Fully auditable",
                    desc: "Every line of code that runs your agent is public. Security researchers, skeptics, and curious developers are all welcome.",
                  },
                  {
                    icon: "⇣",
                    title: "Self-host for free",
                    desc: "Don't want to pay for cloud? Run the entire stack yourself. Your agent, your server, your rules.",
                  },
                  {
                    icon: "⊕",
                    title: "Community-driven",
                    desc: "Skills, integrations, and improvements come from contributors worldwide. No vendor lock-in, no hidden roadmap.",
                  },
                ].map((item, i) => (
                  <Reveal key={item.title} delay={300 + i * 100} className="h-full">
                    <Card className="h-full">
                      <div className="text-xl text-zinc-500 mb-4 font-mono">{item.icon}</div>
                      <h3 className="text-white font-semibold text-sm md:text-base mb-2">{item.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                    </Card>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={600}>
                <a
                  href="https://github.com/kredo-agents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:border-zinc-500 hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  View on GitHub
                </a>
              </Reveal>
            </div>
          </InsightSection>

          {/* ── Vision ───────────────────────────────────────────────── */}
          <InsightSection>
            <div className="max-w-5xl mx-auto" ref={visionRef}>
              <Reveal><SectionLabel>The Vision</SectionLabel></Reveal>
              <Reveal delay={100}>
                <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 md:mb-8 leading-tight">
                  By 2030, {visionCount} billion<br />people will have<br />an AI agent.
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed mb-10 md:mb-16">
                  The smartphone put a computer in every pocket. We&apos;re doing the
                  same for AI agents: open, portable, and owned by the person using
                  it, not the platform hosting it.
                </p>
              </Reveal>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {[
                  { year: "2026", milestone: "100K agents deployed" },
                  { year: "2028", milestone: "10M daily active agents" },
                  { year: "2030", milestone: "1 in 3 people has one" },
                ].map((m, i) => (
                  <Reveal key={m.year} delay={300 + i * 100} className="h-full">
                    <Card className="h-full">
                      <div className="text-lg md:text-2xl font-bold text-white mb-2">{m.year}</div>
                      <div className="text-zinc-400 text-xs md:text-sm leading-snug">{m.milestone}</div>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          </InsightSection>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <InsightSection className="border-b-0 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 hidden sm:block pointer-events-none">
              <Image
                src="/insight-3.png"
                alt=""
                width={900}
                height={640}
                className="w-[500px] md:w-[700px] lg:w-[900px] h-auto"
              />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
              <Reveal>
                <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 leading-[0.9] tracking-tight">
                  Claim your<br />AI agent today.
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="text-zinc-400 text-sm md:text-base max-w-md leading-relaxed mb-8 md:mb-10">
                  Join builders, founders, and power users already running their
                  agents in the cloud. Pay with USDC, use what you need.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <Link
                  href="/setup"
                  className="inline-flex px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
                >
                  Get Started →
                </Link>
              </Reveal>
              <Reveal delay={350}>
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 mt-10 md:mt-12 text-zinc-600 text-xs">
                  <span>◎ Pay with USDC on Solana</span>
                  <span>· Self-host for free</span>
                  <span>· Open source</span>
                </div>
              </Reveal>
            </div>
          </InsightSection>

        </div>
      )}
    </main>
  );
}
