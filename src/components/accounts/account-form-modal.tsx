'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeStatus } from '@prisma/client';
import { X, ShieldAlert, Sparkles } from 'lucide-react';
import { createAccount, updateAccount } from '@/actions/accounts';
import { toast } from 'sonner';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: any | null;
}

export function AccountFormModal({ isOpen, onClose, account }: AccountFormModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const [formData, setFormData] = React.useState<{
    name: string;
    propFirm: string;
    accountSize: number;
    startingBalance: number;
    currentBalance: number;
    equity: number;
    profitTarget: number;
    dailyDrawdownLimit: number;
    maxDrawdownLimit: number;
    maxRiskPerTrade: number;
    maxTradesPerDay: number;
    maxLotSize: number;
    minTradingDays: number;
    newsRestrictions: boolean;
    weekendRestrictions: boolean;
    status: ChallengeStatus;
  }>({
    name: '',
    propFirm: 'FTMO',
    accountSize: 50000,
    startingBalance: 50000,
    currentBalance: 50000,
    equity: 50000,
    profitTarget: 5000,
    dailyDrawdownLimit: 2500,
    maxDrawdownLimit: 5000,
    maxRiskPerTrade: 500,
    maxTradesPerDay: 5,
    maxLotSize: 5,
    minTradingDays: 5,
    newsRestrictions: true,
    weekendRestrictions: true,
    status: ChallengeStatus.ACTIVE,
  });

  React.useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        propFirm: account.propFirm || 'FTMO',
        accountSize: Number(account.accountSize) || 50000,
        startingBalance: Number(account.startingBalance) || 50000,
        currentBalance: Number(account.currentBalance) || 50000,
        equity: Number(account.equity) || 50000,
        profitTarget: Number(account.profitTarget) || 5000,
        dailyDrawdownLimit: Number(account.dailyDrawdownLimit) || 2500,
        maxDrawdownLimit: Number(account.maxDrawdownLimit) || 5000,
        maxRiskPerTrade: Number(account.maxRiskPerTrade) || 500,
        maxTradesPerDay: account.maxTradesPerDay || 5,
        maxLotSize: Number(account.maxLotSize) || 5,
        minTradingDays: account.minTradingDays || 5,
        newsRestrictions: account.newsRestrictions ?? true,
        weekendRestrictions: account.weekendRestrictions ?? true,
        status: account.status || ChallengeStatus.ACTIVE,
      });
    } else {
      setFormData({
        name: '$50K Evaluation',
        propFirm: 'FTMO',
        accountSize: 50000,
        startingBalance: 50000,
        currentBalance: 50000,
        equity: 50000,
        profitTarget: 5000,
        dailyDrawdownLimit: 2500,
        maxDrawdownLimit: 5000,
        maxRiskPerTrade: 500,
        maxTradesPerDay: 5,
        maxLotSize: 5,
        minTradingDays: 5,
        newsRestrictions: true,
        weekendRestrictions: true,
        status: ChallengeStatus.ACTIVE,
      });
    }
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (account?.id) {
        await updateAccount(account.id, formData);
        toast.success('Account updated successfully');
      } else {
        await createAccount(formData);
        toast.success('Account created successfully');
      }
      onClose();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-zinc-100">
              {account?.id ? 'Edit Account / Challenge' : 'Create New Account / Challenge'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Account / Challenge Name</label>
              <input
                type="text"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. $100K MFF Phase 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Prop Firm</label>
              <input
                type="text"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. FTMO, FundedNext, Alpha Capital"
                value={formData.propFirm}
                onChange={(e) => setFormData({ ...formData, propFirm: e.target.value })}
              />
            </div>
          </div>

          {/* Balance & Size */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Account Size ($)</label>
              <input
                type="number"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.accountSize}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    accountSize: val,
                    startingBalance: val,
                    currentBalance: val,
                    equity: val,
                  });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Starting Balance ($)</label>
              <input
                type="number"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.startingBalance}
                onChange={(e) => setFormData({ ...formData, startingBalance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Current Balance ($)</label>
              <input
                type="number"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0, equity: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Targets & Drawdowns */}
          <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Profit Target ($)</label>
              <input
                type="number"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.profitTarget}
                onChange={(e) => setFormData({ ...formData, profitTarget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Daily Drawdown Limit ($)</label>
              <input
                type="number"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.dailyDrawdownLimit}
                onChange={(e) => setFormData({ ...formData, dailyDrawdownLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Max Drawdown Limit ($)</label>
              <input
                type="number"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.maxDrawdownLimit}
                onChange={(e) => setFormData({ ...formData, maxDrawdownLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Risk & Execution Safeguards */}
          <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Max Risk / Trade ($)</label>
              <input
                type="number"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.maxRiskPerTrade}
                onChange={(e) => setFormData({ ...formData, maxRiskPerTrade: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Max Trades / Day</label>
              <input
                type="number"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.maxTradesPerDay}
                onChange={(e) => setFormData({ ...formData, maxTradesPerDay: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Max Lot Size</label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.maxLotSize}
                onChange={(e) => setFormData({ ...formData, maxLotSize: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Min Trading Days</label>
              <input
                type="number"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.minTradingDays}
                onChange={(e) => setFormData({ ...formData, minTradingDays: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Toggles & Status */}
          <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <input
                type="checkbox"
                id="newsRestrictions"
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                checked={formData.newsRestrictions}
                onChange={(e) => setFormData({ ...formData, newsRestrictions: e.target.checked })}
              />
              <label htmlFor="newsRestrictions" className="text-xs text-zinc-300 cursor-pointer">
                Enforce News Restrictions
              </label>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <input
                type="checkbox"
                id="weekendRestrictions"
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                checked={formData.weekendRestrictions}
                onChange={(e) => setFormData({ ...formData, weekendRestrictions: e.target.checked })}
              />
              <label htmlFor="weekendRestrictions" className="text-xs text-zinc-300 cursor-pointer">
                Weekend Holding Restriction
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Challenge Status</label>
              <select
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ChallengeStatus })}
              >
                <option value={ChallengeStatus.ACTIVE}>ACTIVE</option>
                <option value={ChallengeStatus.PASSED}>PASSED</option>
                <option value={ChallengeStatus.FAILED}>FAILED</option>
                <option value={ChallengeStatus.ARCHIVED}>ARCHIVED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : account?.id ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
