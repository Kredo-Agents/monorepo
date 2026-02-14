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
    <div className="max-w-4xl mx-auto px-6 py-12 mt-4">
      {/* Balance */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">Credits</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Credits are used for chat messages (0.1 per message) and running instances (5 per day).
        </p>
        <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 px-6 py-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paymentConfig.tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-6 text-center transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{tier.credits}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">credits</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                  ${tier.priceUsd}
                </div>
                <div className="text-xs text-zinc-400 mb-4">USDC</div>
                <button
                  onClick={() => handlePurchase(tier)}
                  className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!paymentConfig?.enabled && (
        <div className="mb-10 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Buy Credits</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Credit purchases are not yet configured. Contact the administrator.
          </p>
        </div>
      )}

      {/* Helio Checkout Modal */}
      {showCheckout && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
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
              className="mt-4 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
          <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden">
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
                {transactions.map((tx) => (
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
        ) : (
          <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            No transactions yet.
          </div>
        )}
      </div>
    </div>
  );
}
