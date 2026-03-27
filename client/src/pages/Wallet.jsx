import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, ShieldCheck, Wallet as WalletIcon } from 'lucide-react';
import { walletAPI } from '../services/api';
import Loader from '../components/Loader';

const formatCurrency = (amount, currency = 'PHP') => {
  const value = Number(amount || 0);
  const symbol = currency === 'PHP' ? '₱' : `${currency} `;
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const transactionStyles = {
  'contract-credit': {
    icon: ArrowDownRight,
    iconClass: 'bg-green-100 text-green-600',
    amountClass: 'text-green-600',
    label: 'Payout received',
  },
  'platform-fee': {
    icon: ShieldCheck,
    iconClass: 'bg-amber-100 text-amber-600',
    amountClass: 'text-amber-600',
    label: 'Platform revenue',
  },
  'contract-expense': {
    icon: ArrowUpRight,
    iconClass: 'bg-rose-100 text-rose-600',
    amountClass: 'text-rose-600',
    label: 'Contract paid',
  },
};

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true);
        const response = await walletAPI.getSummary();
        setWallet(response.data.wallet);
      } catch (err) {
        console.error('Failed to load wallet', err);
        setError(err.response?.data?.message || 'Failed to load wallet details.');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  const currency = wallet?.currency || 'PHP';
  const transactions = wallet?.transactions || [];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-2xl">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:items-start lg:gap-10">
            <div className="self-start pt-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                <WalletIcon className="h-4 w-4" />
                Wallet Overview
              </div>
              <p className="mt-4 max-w-xl text-sm leading-8 text-slate-300 sm:text-base sm:leading-8">
                Completed contracts release the freelancer payout automatically. Each completed contract applies a {Math.round((wallet?.taxRate || 0) * 100)}% platform tax to the verified admin wallet.
              </p>
            </div>

            <div className="space-y-4 lg:justify-self-end lg:self-center">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Available balance</p>
                <p className="mt-3 text-4xl font-black text-white sm:text-5xl">
                  {formatCurrency(wallet?.availableBalance, currency)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Deposit
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`grid gap-4 md:grid-cols-2 ${wallet?.isVerifiedAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total earnings</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(wallet?.totalEarnings, currency)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total spent</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(wallet?.totalSpent, currency)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Contract tax</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{Math.round((wallet?.taxRate || 0) * 100)}%</p>
          </div>
          {wallet?.isVerifiedAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Admin revenue</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(wallet?.platformRevenue, currency)}</p>
              <p className="mt-2 text-xs text-slate-500">
                You are the verified admin receiving platform tax.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Wallet activity</h2>
              <p className="mt-1 text-sm text-slate-500">Every completed contract records the client spend, freelancer payout, and admin tax share.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">
              <BriefcaseBusiness className="h-4 w-4" />
              {transactions.length} entries
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No wallet activity yet. Complete a contract to create the first payout entry.
              </div>
            ) : (
              transactions.map((transaction) => {
                const style = transactionStyles[transaction.type] || transactionStyles['contract-credit'];
                const Icon = style.icon;

                return (
                  <div key={transaction._id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{transaction.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{style.label}</span>
                          <span className="text-slate-300">•</span>
                          <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                          {transaction.metadata?.contractAmount > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Contract {formatCurrency(transaction.metadata.contractAmount, transaction.currency)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className={`text-lg font-bold ${style.amountClass}`}>
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Balance after: {formatCurrency(transaction.balanceAfter, transaction.currency)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;