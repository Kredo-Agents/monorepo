'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Lock,
  Flame,
  TrendingUp,
  ArrowRightLeft,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* -- Skeleton bar chart ------------------------------------------------- */

function SkeletonBarChart({ count = 28 }: { count?: number }) {
  return (
    <div className="flex items-end gap-[3px] h-28 sm:h-32 w-full">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
          <div
            className="w-full rounded-t-sm bg-zinc-200/60 dark:bg-zinc-700/40 animate-pulse"
            style={{
              height: `${30 + Math.sin(i * 0.4) * 25 + Math.cos(i * 0.7) * 15}%`,
              animationDelay: `${i * 30}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* -- Skeleton pill ------------------------------------------------------- */

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block rounded-md bg-zinc-200/60 dark:bg-zinc-700/40 animate-pulse ${className}`} />
  );
}

/* -- Supply bar ---------------------------------------------------------- */

function SupplyBar({
  segments,
}: {
  segments: { label: string; color: string; pct: number }[];
}) {
  return (
    <div>
      <div className="flex h-5 w-full rounded-md overflow-hidden border border-zinc-200/50 dark:border-zinc-700/40">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} animate-pulse`}
            style={{ width: `${s.pct}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.color}`} />
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label}</span>
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Period selector ----------------------------------------------------- */

const periods = ['1W', '1M', '3M', '6M'] as const;

function PeriodTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (p: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {periods.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            active === p
              ? 'bg-zinc-200/80 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-100'
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* -- Main page ----------------------------------------------------------- */

export default function TokensPage() {
  const [kredoPeriod, setKredoPeriod] = useState('1M');
  const [sigilPeriod, setSigilPeriod] = useState('1M');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-2 pb-6 md:py-12 md:mt-4 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Tokens
          </h1>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500 tracking-wide uppercase">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-2xl">
          Own your AI compute. KREDO is the base asset &mdash; stake and lock to mint SIGIL,
          the token you burn for AI credits. No subscriptions, no expiration.
        </p>
      </div>

      {/* Token cards grid */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 mb-6">
        {/* -- KREDO card -------------------------------------------------- */}
        <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* Token header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <img src="/logo-footer.png" alt="KREDO" className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">KREDO</h2>
                    <a
                      href="https://kredo.cc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    The base asset. Stake to mint SIGIL.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-[#9945FF] flex items-center justify-center" title="Solana">
                  <span className="text-[9px] font-bold text-white">S</span>
                </span>
              </div>
            </div>

            {/* Price row */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium mb-1">
                  KREDO Price
                </div>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-7 w-20 sm:h-8 sm:w-24" />
                  <span className="text-sm font-medium text-zinc-400">USD</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium mb-1">
                  Market Cap
                </div>
                <Skeleton className="h-5 w-16 sm:h-6 sm:w-20" />
              </div>
            </div>

            {/* Chart skeleton */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Supply
                </span>
                <PeriodTabs active={kredoPeriod} onChange={setKredoPeriod} />
              </div>
              <SkeletonBarChart />
            </div>

            {/* Supply breakdown */}
            <div className="pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  KREDO Token Supply
                </span>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Total: 1B
                </span>
              </div>
              <SupplyBar
                segments={[
                  { label: 'Locked', color: 'bg-amber-500/60', pct: 10 },
                  { label: 'Staked', color: 'bg-amber-300/40', pct: 35 },
                  { label: 'Circulating', color: 'bg-zinc-400/30 dark:bg-zinc-600/40', pct: 55 },
                ]}
              />
            </div>
          </div>
        </div>

        {/* -- SIGIL card -------------------------------------------------- */}
        <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* Token header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <img src="/sigil-icon.png" alt="SIGIL" className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">SIGIL</h2>
                    <a
                      href="https://kredo.cc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    AI compute credits. Burn for credits on Kredo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-[#9945FF] flex items-center justify-center" title="Solana">
                  <span className="text-[9px] font-bold text-white">S</span>
                </span>
              </div>
            </div>

            {/* Price row */}
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium mb-1">
                  SIGIL Price
                </div>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-7 w-20 sm:h-8 sm:w-24" />
                  <span className="text-sm font-medium text-zinc-400">USD</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium mb-1">
                  Market Cap
                </div>
                <Skeleton className="h-5 w-16 sm:h-6 sm:w-20" />
              </div>
            </div>

            {/* Chart skeleton */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Usage
                </span>
                <PeriodTabs active={sigilPeriod} onChange={setSigilPeriod} />
              </div>
              <SkeletonBarChart />
            </div>

            {/* Supply breakdown */}
            <div className="pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  SIGIL Token Supply
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Total:</span>
                  <Skeleton className="h-3.5 w-10" />
                </div>
              </div>
              <SupplyBar
                segments={[
                  { label: 'Staked', color: 'bg-sky-400/50', pct: 70 },
                  { label: 'Circulating', color: 'bg-zinc-400/30 dark:bg-zinc-600/40', pct: 30 },
                ]}
              />
              <div className="mt-3 flex items-center justify-end gap-1.5">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Mint Rate: 1 sKREDO =
                </span>
                <Skeleton className="h-3 w-12" />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">SIGIL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works -- collapsible */}
      <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setShowHowItWorks((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
        >
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              How It Works
            </span>
          </div>
          {showHowItWorks ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>

        {showHowItWorks && (
          <div className="px-5 pb-5 border-t border-zinc-200/70 dark:border-zinc-800/70 pt-4 space-y-4 animate-fade-in">
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    1. Stake & Lock
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Stake KREDO on kredo.cc. Lock your staked tokens (sKREDO) to mint SIGIL.
                  Your KREDO keeps earning yield while locked.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    2. Burn SIGIL
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Burn SIGIL to purchase AI credits. Use credits for chat, agents, workflows,
                  multi-model access, and API. Burned SIGIL is permanently destroyed.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    3. Trade or Hold
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  SIGIL is a Solana SPL token, tradeable on any DEX. Sell SIGIL you minted, or buy
                  SIGIL from the market to burn for credits without holding KREDO.
                </p>
              </div>
            </div>

            {/* Paths table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/70 dark:border-zinc-800/70">
                    <th className="text-left py-2 pr-4 text-zinc-500 dark:text-zinc-400 font-medium">Path</th>
                    <th className="text-left py-2 pr-4 text-zinc-500 dark:text-zinc-400 font-medium">How</th>
                    <th className="text-left py-2 text-zinc-500 dark:text-zinc-400 font-medium">For</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-700 dark:text-zinc-300">
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-2 pr-4 font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">Lock KREDO</td>
                    <td className="py-2 pr-4">Stake &rarr; Lock &rarr; Mint SIGIL &rarr; Burn or Sell</td>
                    <td className="py-2">KREDO holders</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-2 pr-4 font-medium text-sky-600 dark:text-sky-400 whitespace-nowrap">Buy SIGIL</td>
                    <td className="py-2 pr-4">Buy on DEX &rarr; Burn for credits</td>
                    <td className="py-2">Users wanting AI without KREDO</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Buy Credits</td>
                    <td className="py-2 pr-4">Pay USDC on kredo.cc</td>
                    <td className="py-2">Users who just want AI</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions -- all coming soon */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-dashed border-zinc-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/20 p-5 opacity-60">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Buy KREDO</span>
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-auto">Soon</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Available on Jupiter, Raydium, and Pump.fun
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/20 p-5 opacity-60">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-5 w-5 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Stake & Lock</span>
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-auto">Soon</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Lock sKREDO to mint SIGIL tokens
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/20 p-5 opacity-60">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="h-5 w-5 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Burn SIGIL</span>
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-auto">Soon</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Burn SIGIL for AI credits on Kredo
          </p>
        </div>
      </div>
    </div>
  );
}
