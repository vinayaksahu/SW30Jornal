'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Account, ChallengeStatus } from '@prisma/client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setActiveAccount } from '@/actions/accounts';
import { toast } from 'sonner';

interface AccountSwitcherProps {
  accounts: Account[];
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

  const onSelectAccount = async (id: string) => {
    setOpen(false);
    if (id === activeAccount?.id) return;
    try {
      await setActiveAccount(id);
      toast.success('Active account updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to switch account');
    }
  };

  const getStatusColor = (status: ChallengeStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PASSED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'ARCHIVED': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      default: return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        onClick={() => setOpen(!open)}
        className="w-[280px] justify-between bg-zinc-950 border-zinc-800 text-zinc-100 hover:bg-zinc-900 hover:text-zinc-50"
      >
        {activeAccount ? (
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold">{activeAccount.name}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4 rounded-sm", getStatusColor(activeAccount.status))}>
              {activeAccount.status}
            </Badge>
          </div>
        ) : (
          <span className="text-zinc-500">Select account...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-[280px] bg-zinc-950 border border-zinc-800 rounded-md shadow-lg z-50 overflow-hidden">
          {accounts.length === 0 ? (
            <div className="p-4 text-sm text-center text-zinc-500">
              No accounts found.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto p-1">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => onSelectAccount(account.id)}
                  className="flex flex-col items-start gap-1 p-2 rounded-sm cursor-pointer hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-zinc-100 text-sm">{account.name}</span>
                    {activeAccount?.id === account.id && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{account.propFirm}</span>
                    <span>•</span>
                    <span>${Number(account.accountSize).toLocaleString()}</span>
                    <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4 rounded-sm border-0 bg-transparent", getStatusColor(account.status))}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

