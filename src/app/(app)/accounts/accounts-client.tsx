'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeStatus } from '@/types/enums';
import { Plus, Wallet, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Archive, Edit2, Trash2, Check } from 'lucide-react';
import { AccountFormModal } from '@/components/accounts/account-form-modal';
import { deleteAccount, setActiveAccount } from '@/actions/accounts';
import { toast } from 'sonner';

interface AccountsClientProps {
  accounts: any[];
  activeAccountId: string | null;
}

export default function AccountsClient({ accounts, activeAccountId }: AccountsClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<any | null>(null);
  const [filter, setFilter] = React.useState<string>('ALL');

  const filteredAccounts = React.useMemo(() => {
    if (filter === 'ALL') return accounts;
    return accounts.filter((a) => a.status === filter);
  }, [accounts, filter]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" and all associated trades?`)) return;

    try {
      await deleteAccount(id);
      toast.success('Account deleted successfully');
      router.refresh();
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const handleSelectActive = async (id: string) => {
    try {
      await setActiveAccount(id);
      toast.success('Active account updated');
      router.refresh();
    } catch {
      toast.error('Failed to set active account');
    }
  };

  const getStatusBadge = (status: ChallengeStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            ACTIVE
          </span>
        );
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            PASSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="h-3.5 w-3.5" />
            FAILED
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <Archive className="h-3.5 w-3.5" />
            ARCHIVED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'PASSED', 'FAILED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === st
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-900 hover:text-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Account / Challenge
        </button>
      </div>

      {/* Account Cards Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/40 border border-zinc-800 rounded-xl text-center">
          <Wallet className="h-12 w-12 text-zinc-600 mb-3" />
          <h4 className="text-base font-medium text-zinc-200">No accounts found</h4>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            Create your first prop firm account or challenge profile to start tracking trades and rules.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 text-xs font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
          >
            Create First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => {
            const startBal = Number(account.startingBalance);
            const currBal = Number(account.currentBalance);
            const profit = currBal - startBal;
            const profitPercent = startBal > 0 ? (profit / startBal) * 100 : 0;
            const isActive = (activeAccountId ? activeAccountId === account.id : accounts[0]?.id === account.id);

            return (
              <div
                key={account.id}
                className={`relative bg-zinc-900/60 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isActive ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/20' : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                          {account.propFirm}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-zinc-100 mt-1.5">{account.name}</h3>
                    </div>
                    <div>{getStatusBadge(account.status)}</div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800/60">
                    <div>
                      <span className="text-xs text-zinc-500">Account Size</span>
                      <p className="text-sm font-semibold text-zinc-200">
                        ${Number(account.accountSize).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Current Balance</span>
                      <p className="text-sm font-semibold text-zinc-100">
                        ${currBal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">P/L</span>
                      <p
                        className={`text-sm font-semibold ${
                          profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {profit >= 0 ? '+' : ''}${profit.toLocaleString()} ({profitPercent.toFixed(2)}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Profit Target</span>
                      <p className="text-sm font-semibold text-zinc-300">
                        ${Number(account.profitTarget).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Drawdowns & Safeguards */}
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-zinc-800/60 text-xs">
                    <div>
                      <span className="text-zinc-500">Daily DD Limit:</span>{' '}
                      <span className="text-zinc-300 font-medium">${Number(account.dailyDrawdownLimit).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Max DD Limit:</span>{' '}
                      <span className="text-zinc-300 font-medium">${Number(account.maxDrawdownLimit).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Restriction badges */}
                  <div className="flex items-center gap-2 mt-3 pt-2 text-[11px] text-zinc-400">
                    {account.newsRestrictions && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                        News Protection ON
                      </span>
                    )}
                    {account.weekendRestrictions && (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                        No Weekend Hold
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-zinc-800/80">
                  <button
                    onClick={() => handleSelectActive(account.id)}
                    disabled={isActive}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Active Account
                      </>
                    ) : (
                      'Set as Active'
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(account)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id, account.name)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        account={editingAccount}
      />
    </div>
  );
}
