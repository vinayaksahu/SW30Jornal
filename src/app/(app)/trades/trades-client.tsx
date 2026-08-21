'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { deleteTrade } from '@/actions/trades';
import { toast } from 'sonner';
import { NewsProtectionBanner } from '@/components/news/news-protection-banner';

export interface TradeItem {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  profitLoss: number | null;
  entryTime: string;
  exitTime: string | null;
  durationSeconds: number | null;
  strategyId: string | null;
  strategyName?: string;
  accountId: string;
  accountName?: string;
  rrRatio: number | null;
  ruleStatus: string | null;
  newsStatus: string | null;
}

export interface Stats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  avgRR: number;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '-';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatISTDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function TradesClient({
  initialTrades,
  stats,
}: {
  initialTrades: TradeItem[];
  stats: Stats;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [directionFilter, setDirectionFilter] = React.useState<string>('ALL');
  const [winLossFilter, setWinLossFilter] = React.useState<string>('ALL');

  const filteredTrades = React.useMemo(() => {
    return initialTrades.filter((t) => {
      const matchesSearch =
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.strategyName && t.strategyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.accountName && t.accountName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDirection = directionFilter === 'ALL' || t.direction === directionFilter;

      const pl = t.profitLoss ?? 0;
      const matchesWinLoss =
        winLossFilter === 'ALL' ||
        (winLossFilter === 'WIN' && pl > 0) ||
        (winLossFilter === 'LOSS' && pl < 0) ||
        (winLossFilter === 'BE' && pl === 0);

      return matchesSearch && matchesDirection && matchesWinLoss;
    });
  }, [initialTrades, searchTerm, directionFilter, winLossFilter]);

  const handleDelete = async (id: string, symbol: string) => {
    if (!confirm(`Are you sure you want to delete trade on ${symbol}?`)) return;
    try {
      await deleteTrade(id);
      toast.success('Trade deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete trade');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Trade Log</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Complete record of all executions, OCR evidence, and rule compliance.
          </p>
        </div>

        <Link
          href="/trades/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors shadow-lg shadow-emerald-950/20"
        >
          <Plus className="h-4 w-4" />
          Log New Trade (OCR)
        </Link>
      </div>

      {/* Live News Protection Alert Banner */}
      <NewsProtectionBanner symbol="USD" />

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-500 font-medium">Total Net P/L</span>
          <p
            className={`text-2xl font-bold mt-1 ${
              stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-500 font-medium">Win Rate</span>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.winRate}%</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-500 font-medium">Profit Factor</span>
          <p className="text-2xl font-bold text-zinc-100 mt-1">
            {stats.profitFactor >= 999 ? '∞' : stats.profitFactor}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <span className="text-xs text-zinc-500 font-medium">Total Trades</span>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{stats.totalTrades}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search symbol, strategy, account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Direction filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="BUY">BUY Only</option>
            <option value="SELL">SELL Only</option>
          </select>

          {/* Win / Loss filter */}
          <select
            value={winLossFilter}
            onChange={(e) => setWinLossFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Winners</option>
            <option value="LOSS">Losses</option>
            <option value="BE">Break Even</option>
          </select>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="overflow-x-auto bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400">
              <th className="px-4 py-3 font-medium">Date (IST)</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Lots</th>
              <th className="px-4 py-3 font-medium">Entry / Exit</th>
              <th className="px-4 py-3 font-medium">SL / TP</th>
              <th className="px-4 py-3 font-medium">P/L ($)</th>
              <th className="px-4 py-3 font-medium">RR</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Strategy</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-zinc-500">
                  No trades found. Log a new trade or adjust your search filter.
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => {
                const pl = trade.profitLoss ?? 0;
                const isProfit = pl > 0;
                const isLoss = pl < 0;

                return (
                  <tr
                    key={trade.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400">
                      {formatISTDate(trade.entryTime)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-zinc-100">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          trade.direction === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {trade.direction === 'BUY' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                      {trade.volume}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-zinc-400">
                      <span>{trade.entryPrice}</span>
                      {trade.exitPrice && (
                        <span className="text-zinc-500"> → {trade.exitPrice}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-zinc-500">
                      {trade.stopLoss ? trade.stopLoss : '-'} /{' '}
                      {trade.takeProfit ? trade.takeProfit : '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-semibold font-mono">
                      <span
                        className={
                          isProfit
                            ? 'text-emerald-400'
                            : isLoss
                            ? 'text-red-400'
                            : 'text-zinc-400'
                        }
                      >
                        {isProfit ? '+' : ''}
                        {trade.profitLoss !== null ? `$${trade.profitLoss.toLocaleString()}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                      {trade.rrRatio ? `1:${trade.rrRatio}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                      {formatDuration(trade.durationSeconds)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {trade.strategyName ? (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px]">
                          {trade.strategyName}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {trade.ruleStatus === 'VIOLATED' ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] text-center font-medium">
                            Rule Violated
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] text-center font-medium">
                            Compliant
                          </span>
                        )}
                        {trade.newsStatus === 'VIOLATED' ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] text-center font-medium">
                            News Lock Violated
                          </span>
                        ) : trade.newsStatus === 'WARNING' ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] text-center font-medium">
                            News Warning
                          </span>
                        ) : trade.newsStatus === 'OVERRIDDEN' ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] text-center font-medium">
                            News Override
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/trades/${trade.id}`}
                          className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(trade.id, trade.symbol)}
                          className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Trade"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
