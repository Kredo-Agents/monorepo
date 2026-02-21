'use client';

import { useEffect, useRef, useState } from 'react';
import { Coins, HelpCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';

export default function CreditPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: planInfo } = trpc.credits.planInfo.useQuery(undefined, {
    staleTime: 30_000,
  });
  const { data: balanceData } = trpc.credits.balance.useQuery();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  const displayCredits = balanceData?.displayCredits ?? planInfo?.displayCredits ?? 0;
  const dailyRefresh = planInfo?.dailyRefreshDisplay ?? 300;

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
      >
        <Coins className="h-3.5 w-3.5" aria-hidden="true" />
        {typeof displayCredits === 'number' ? displayCredits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : '\u2014'}
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-3 z-50 animate-fade-in">
          {/* Plan row */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {planInfo?.planDisplayName ?? 'Free'}
            </span>
            <Link
              href="/dashboard/credits"
              className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Upgrade
            </Link>
          </div>

          <div className="px-4 py-3 space-y-4">
            {/* Credits row */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Credits</span>
                  <span className="group relative">
                    <HelpCircle className="h-3 w-3 text-zinc-400 cursor-help" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-48 px-2 py-1 text-xs text-white bg-zinc-900 dark:bg-zinc-700 rounded shadow-lg text-center whitespace-normal">
                      Credits are used for chat messages and running instances
                    </span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {typeof displayCredits === 'number' ? displayCredits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : '\u2014'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 ml-5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Free credits</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {typeof displayCredits === 'number' ? displayCredits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) : '\u2014'}
                </span>
              </div>
            </div>

            {/* Daily refresh row */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Daily refresh credits</span>
                  <span className="group relative">
                    <HelpCircle className="h-3 w-3 text-zinc-400 cursor-help" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-52 px-2 py-1 text-xs text-white bg-zinc-900 dark:bg-zinc-700 rounded shadow-lg text-center whitespace-normal">
                      Your credits are refreshed to this amount daily at midnight UTC
                    </span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {dailyRefresh.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                </span>
              </div>
              <div className="mt-1 ml-5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Refresh to {dailyRefresh.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} at 00:00 every day
                </span>
              </div>
            </div>
          </div>

          {/* View usage link */}
          <div className="px-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/dashboard/credits"
              className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              View usage
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
