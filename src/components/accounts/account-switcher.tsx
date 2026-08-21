'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChallengeStatus } from '@/types/enums';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setActiveAccount } from '@/actions/accounts';
import { toast } from 'sonner';

interface AccountSwitcherProps {
  accounts: any[];
  activeAccountId: string | null;
}

export function AccountSwitcher({ accounts, activeAccountId }: AccountSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const activeAccount = React.useMemo(() => {
    return accounts.find((a) => a.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAccount = async (accountId: string) => {
    try {
      await setActiveAccount(accountId);
      toast.success('Active account updated');
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error('Failed to change active account');
    }
  };

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between border-zinc-800 bg-zinc-950 text-xs font-normal text-zinc-100 hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-emerald-400">{activeAccount?.name || 'Select Account'}</span>
          {activeAccount?.propFirm && (
            <span className="text-[10px] text-zinc-500 font-mono">({activeAccount.propFirm})</span>
          )}
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[240px] z-50 rounded-lg bg-zinc-950 border border-zinc-800 shadow-xl p-1.5 space-y-1 text-xs">
          <div className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider border-b border-zinc-800/80 mb-1">
            Trading Accounts ({accounts.length})
          </div>
          {accounts.map((acc) => {
            const isSelected = acc.id === activeAccount?.id;
            return (
              <button
                key={acc.id}
                onClick={() => handleSelectAccount(acc.id)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-colors text-left',
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-300 font-medium'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
                )}
              >
                <div className="flex flex-col truncate">
                  <span className="truncate">{acc.name}</span>
                  <span className="text-[10px] text-zinc-500">
                    {acc.propFirm} · ${Number(acc.accountSize || 0).toLocaleString()}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
