'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useUser } from '@clerk/nextjs';
import { Coins, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type Tier = {
  id: string;
  credits: number;
  priceUsd: number;
  paylinkId: string;
};

export default function CreditsPage() {
  const { user } = useUser();
  const { data: balanceData, refetch: refetchBalance } = trpc.credits.balance.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: paymentConfig } = trpc.credits.paymentConfig.useQuery();
  const { data: transactions } = trpc.credits.transactions.useQuery({ limit: 50 });
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);

  const displayBalance = balanceData ? (balanceData.credits / 10).toFixed(1) : '...';

  const handlePurchase = (tier: Tier) => {
    setSelectedTier(tier);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    setSelectedTier(null);
    // Refetch balance after a short delay to allow webhook processing
    setTimeout(() => void refetchBalance(), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-2 pb-6 md:py-12 md:mt-4 animate-fade-in">
      {/* Balance */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">Credits</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Credits are used for chat messages (0.1–0.2 per message) and running instances (7.5 per day).
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 px-5 py-4">
          <Coins className="h-8 w-8 text-amber-500" aria-hidden="true" />
          <div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{displayBalance}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">credits remaining</div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      {paymentConfig?.enabled && paymentConfig.tiers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Buy Credits</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Pay with USDC on Solana via Helio.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {paymentConfig.tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5 sm:p-6 text-center transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{tier.credits}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">credits</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  ${tier.priceUsd}
                </div>
                <div className="text-xs text-zinc-400 mb-4">USDC</div>
                <button
                  onClick={() => handlePurchase(tier)}
                  className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 active:scale-[0.97] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all min-h-[44px]"
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!paymentConfig?.enabled && (
        <div className="mb-10 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Buy Credits</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Credit purchases are not yet enabled.
          </p>
        </div>
      )}

      {/* Helio Checkout Modal */}
      {showCheckout && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl p-6 max-w-md w-full sm:mx-4 shadow-xl safe-area-bottom">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Purchase {selectedTier.credits} Credits
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              ${selectedTier.priceUsd} USDC on Solana
            </p>
            {/*
              When @heliofi/checkout-react is installed, uncomment:

              <HelioCheckout
                config={{
                  paylinkId: selectedTier.paylinkId,
                  network: 'main',
                  onSuccess: handlePaymentSuccess,
                  onError: () => setShowCheckout(false),
                  additionalJSON: JSON.stringify({ userId: String(user?.id) }),
                }}
              />
            */}
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Helio checkout widget will appear here once HELIO_* environment variables are configured and @heliofi/checkout-react is installed.
            </div>
            <button
              onClick={() => { setShowCheckout(false); setSelectedTier(null); }}
              className="mt-4 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.97] transition-all min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          Transaction History
        </h2>
        {transactions && transactions.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                  <tr>
                    <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Description</th>
                    <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Amount</th>
                    <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                  {(showAllTx ? transactions : transactions.slice(0, 10)).map((tx) => (
                    <tr key={tx.id} className="bg-white dark:bg-zinc-900/40">
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          {tx.amount >= 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
                          )}
                          {tx.description || tx.type}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}>
                          {tx.amount >= 0 ? '+' : ''}{(tx.amount / 10).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {(tx.balance / 10).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {(showAllTx ? transactions : transactions.slice(0, 10)).map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 px-4 py-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${tx.amount >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {tx.amount >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" aria-hidden="true" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {tx.description || tx.type}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{(tx.amount / 10).toFixed(1)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        bal {(tx.balance / 10).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show more / Show less */}
            {transactions.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllTx((v) => !v)}
                className="mt-3 w-full rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 active:scale-[0.99] transition-all"
              >
                {showAllTx ? 'Show less' : `Show all ${transactions.length} transactions`}
              </button>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            No transactions yet.
          </div>
        )}
      </div>
    </div>
  );
}
