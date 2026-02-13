"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/* Hooks                                                                 */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
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
  }, [threshold]);
  return { ref, inView };
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

/* ------------------------------------------------------------------ */
/* Layout primitives                                                     */
/* ------------------------------------------------------------------ */

function Section({
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
/* Stat counter card                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  value,
  suffix = "",
  prefix = "",
  label,
  sub,
  active,
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sub: string;
  active: boolean;
  duration?: number;
}) {
  const count = useCounter(value, duration, active);
  return (
    <Card>
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tabular-nums tracking-tight">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm font-semibold text-zinc-300 mb-1">{label}</div>
      <div className="text-xs text-zinc-500 leading-relaxed">{sub}</div>
    </Card>
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
    <Card
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
        {label}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">{amount}</div>
      <div className="text-sm text-zinc-400">{sub}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default function InsightPage() {
  const { ref: statsRef, inView: statsIn } = useInView();
  const { ref: growthRef, inView: growthIn } = useInView();
  const { ref: tamRef, inView: tamIn } = useInView();

  return (
    <div className="bg-zinc-950 text-white min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative border-b border-zinc-800 min-h-[85vh] flex flex-col justify-end px-6 sm:px-8 md:px-16 py-16 md:py-24">
        {/* Text */}
        <div className="max-w-xl relative z-10">
          <SectionLabel>Business Insight · 2025</SectionLabel>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tight mb-6 md:mb-8">
            The AI Agent<br />Revolution<br />Has Begun.
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-sm leading-relaxed mb-8 md:mb-12">
            Most people are watching from the outside.
            We&apos;re building the door.
          </p>
          <div className="flex flex-wrap gap-3">
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

        {/* Image: bottom-right, bleeds into next section */}
        <div className="absolute bottom-0 right-0 w-[240px] sm:w-[340px] md:w-[480px] translate-y-[18%] hidden sm:block">
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
      <Section id="problem" className="relative z-10 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            AI is only for<br />the privileged.
          </h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
            Despite the hype, running your own AI agent is locked behind
            engineering teams and enterprise budgets.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                title: "You need a dev team",
                desc: "Standing up an AI agent requires cloud infra, API keys, and months of iteration. That rules out most of the world.",
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
              <Card key={item.title} active={i === 0}>
                <h3 className="text-white font-semibold text-base md:text-lg mb-3">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Market Reality ───────────────────────────────────────── */}
      <Section>
        <div className="max-w-5xl mx-auto" ref={statsRef}>
          <SectionLabel>Market Reality</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-10 md:mb-16 leading-tight">
            The numbers<br />don&apos;t lie.
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
            <StatCard value={300} suffix="M+" label="Knowledge workers" sub="who could benefit from a personal AI agent right now" active={statsIn} />
            <StatCard value={12} suffix="%" label="Have AI agents" sub="Only 1 in 8 companies has deployed anything beyond a basic chatbot" active={statsIn} />
            <StatCard value={93} suffix="%" label="Market gap" sub="The opportunity that hasn't been touched yet" active={statsIn} />
            <StatCard value={70} suffix="×" label="Cost reduction" sub="AI handles queries at $0.10 vs $7 for a human agent" active={statsIn} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <StatCard value={9} suffix=".3 hrs/wk" label="Lost to repetition" sub="Average time a knowledge worker loses to tasks an agent could handle" active={statsIn} />
            <StatCard value={4800} suffix="M" label="Messaging app users" sub="Already spending their day in Discord, Slack, Telegram, WhatsApp" active={statsIn} />
            <StatCard value={2100} prefix="$" suffix="B" label="Productivity unlock" sub="Estimated annual gains from AI agents globally by 2030" active={statsIn} duration={2500} />
          </div>
        </div>
      </Section>

      {/* ── Market Growth ────────────────────────────────────────── */}
      <Section>
        <div className="max-w-5xl mx-auto" ref={growthRef}>
          <SectionLabel>Market Growth</SectionLabel>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight">
              $5.1B today.<br />
              $<FloatingBig to={47.1} active={growthIn} />B by 2030.
            </h2>
            <div className="shrink-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-full text-zinc-400 text-sm">
                44.8% CAGR
              </div>
            </div>
          </div>

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

          <p className="text-zinc-600 text-xs mt-8">
            Sources: MarketsandMarkets · Grand View Research · McKinsey Global Institute
          </p>
        </div>
      </Section>

      {/* ── Solution ─────────────────────────────────────────────── */}
      <section className="relative border-b border-zinc-800 py-16 md:py-24 lg:py-32">
        {/* Image: bottom-left, flipped, partially cut by next section */}
        <div className="absolute bottom-0 left-0 translate-y-[20%] hidden sm:block pointer-events-none scale-x-[-1]">
          <Image
            src="/insight-2.png"
            alt=""
            width={900}
            height={640}
            className="w-[500px] md:w-[700px] lg:w-[900px] h-auto"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 md:px-16">
          <SectionLabel>What we built</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Your agent,<br />running in 5 minutes.
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed mb-10 md:mb-16">
            Kredo is a self-hostable cloud platform that gives anyone a
            persistent, skills-enabled AI agent with zero infrastructure
            knowledge required.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Name your agent",
                desc: "Set a name, personality, and purpose. Your agent maintains full memory across every conversation. It never forgets who you are.",
              },
              {
                step: "02",
                title: "Install skills from ClawHub",
                desc: "Drop in pre-built skill packs: coding help, research, business analysis, and more. Or write your own in plain Markdown.",
              },
              {
                step: "03",
                title: "Connect your messengers",
                desc: "Discord, Slack, Telegram, WhatsApp, Matrix. One deployment, all your platforms. Meet your agent where you already spend time.",
              },
              {
                step: "04",
                title: "It runs 24/7",
                desc: "Persistent uptime and full context continuity. Send a message at 3am, pick up the thread at noon. It's always there.",
              },
            ].map((s) => (
              <Card key={s.step} className="flex gap-4">
                <div className="text-xl font-bold text-zinc-700 shrink-0 font-mono w-8">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm md:text-base mb-2">
                    {s.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Market Opportunity ───────────────────────────────────── */}
      <Section className="relative z-10 bg-zinc-950">
        <div className="max-w-5xl mx-auto" ref={tamRef}>
          <SectionLabel>Market Opportunity</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            A $47B market,<br />barely scratched.
          </h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
            We focus on the segment nobody else is serving: developers, power
            users, and small teams who need a real AI agent but don&apos;t have
            an IT department.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <TamCard label="TAM" amount="$47.1B" sub="Total AI Agent Market by 2030" active={tamIn} delay={0} />
            <TamCard label="SAM" amount="$8.2B" sub="SMB + Prosumer Segment" active={tamIn} delay={150} />
            <TamCard label="SOM" amount="$1.4B" sub="Developer + Power User Target" active={tamIn} delay={300} />
          </div>
        </div>
      </Section>

      {/* ── Business Model ───────────────────────────────────────── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Business Model</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Pay for what you use.<br />Nothing more.
          </h2>
          <p className="text-zinc-500 text-sm md:text-base mb-10 md:mb-16 max-w-lg leading-relaxed">
            No monthly subscriptions. Credits bought with USDC on Solana,
            spent as you go.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Card>
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
                    <span className="text-white font-semibold text-sm shrink-0 sm:w-28">
                      {row.label}
                    </span>
                    <span className="text-zinc-500 text-sm">{row.desc}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-5">
                Revenue streams
              </div>
              <ul className="space-y-5">
                {[
                  {
                    title: "Cloud credits",
                    desc: "Managed hosting for users who don't want to self-host. Pay only for what's consumed.",
                  },
                  {
                    title: "ClawHub marketplace",
                    desc: "30% cut on paid skill packs sold by third-party developers.",
                  },
                  {
                    title: "Enterprise self-hosted",
                    desc: "Custom pricing for teams deploying at scale with SLAs and dedicated infra.",
                  },
                ].map((s) => (
                  <li key={s.title}>
                    <div className="text-white font-semibold text-sm mb-1">{s.title}</div>
                    <div className="text-zinc-500 text-xs leading-relaxed">{s.desc}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="flex items-start sm:items-center gap-4">
            <div className="text-xl shrink-0 text-zinc-400 mt-0.5 sm:mt-0">◎</div>
            <div>
              <div className="text-white font-semibold text-sm mb-1">Built on Solana</div>
              <div className="text-zinc-500 text-sm leading-relaxed">
                Payments settle via Helio using USDC. Fast, permissionless,
                global. Anyone can top up without a bank account.
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Vision ───────────────────────────────────────────────── */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <SectionLabel>The Vision</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 md:mb-8 leading-tight">
            By 2030, 8 billion<br />people will have<br />an AI agent.
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed mb-10 md:mb-16">
            The smartphone put a computer in every pocket. We&apos;re doing the
            same for AI agents: open, portable, and owned by the person using
            it, not the platform hosting it.
          </p>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { year: "2025", milestone: "1M agents deployed" },
              { year: "2027", milestone: "50M daily active agents" },
              { year: "2030", milestone: "Everyone has one" },
            ].map((m) => (
              <Card key={m.year}>
                <div className="text-lg md:text-2xl font-bold text-white mb-2">{m.year}</div>
                <div className="text-zinc-400 text-xs md:text-sm leading-snug">{m.milestone}</div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <Section className="border-b-0 relative overflow-hidden">
        {/* Image: bottom-right */}
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
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 leading-[0.9] tracking-tight">
            Claim your<br />AI agent today.
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-md leading-relaxed mb-8 md:mb-10">
            Join builders, founders, and power users already running their
            agents in the cloud. Pay with USDC, use what you need.
          </p>

          <Link
            href="/setup"
            className="inline-flex px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
          >
            Get Started →
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 mt-10 md:mt-12 text-zinc-600 text-xs">
            <span>◎ Pay with USDC on Solana</span>
            <span>· Self-host for free</span>
            <span>· Open source</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
