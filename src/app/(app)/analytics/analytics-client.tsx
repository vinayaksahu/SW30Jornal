'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Layers,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Activity,
  Award,
  ChevronRight,
  Scale,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AccountSwitcher } from '@/components/accounts/account-switcher';
import {
  calculateAccountStats,
  AccountStats,
  TradeRecord,
  AccountRecord,
  formatISTDateTime,
} from '@/lib/services/trading-calculator';
import { cn } from '@/lib/utils';

interface AnalyticsClientProps {
  accounts: AccountRecord[];
  activeAccount: AccountRecord | null;
  trades: TradeRecord[];
}

export default function AnalyticsClient({
  accounts,
  activeAccount,
  trades,
}: AnalyticsClientProps) {
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>(
    activeAccount?.id || 'ALL'
  );
  const [dateRange, setDateRange] = React.useState<'ALL' | 'YEAR' | 'MONTH' | '30D' | 'WEEK'>('ALL');
  const [activeTab, setActiveTab] = React.useState<string>('equity');

  // Filter trades by selected account
  const accountTrades = React.useMemo(() => {
    if (selectedAccountId === 'ALL') return trades;
    return trades.filter((t) => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  // Account object for calculator
  const currentAccount = React.useMemo(() => {
    if (selectedAccountId === 'ALL') {
      // Synthesize an aggregated account
      const totalSize = accounts.reduce((acc, a) => acc + Number(a.accountSize), 0) || 100000;
      return {
        accountSize: totalSize,
        startingBalance: totalSize,
        currentBalance: totalSize,
        equity: totalSize,
        profitTarget: totalSize * 0.1,
        dailyDrawdownLimit: totalSize * 0.05,
        maxDrawdownLimit: totalSize * 0.1,
        minTradingDays: 5,
        status: 'ACTIVE',
      };
    }
    return accounts.find((a) => a.id === selectedAccountId) || activeAccount;
  }, [accounts, selectedAccountId, activeAccount]);

  // Filter trades by date range
  const filteredTrades = React.useMemo(() => {
    const now = new Date();
    return accountTrades.filter((t) => {
      const d = new Date(t.entryTime);
      if (dateRange === 'ALL') return true;
      if (dateRange === 'WEEK') {
        const diffMs = now.getTime() - d.getTime();
        return diffMs <= 7 * 24 * 60 * 60 * 1000;
      }
      if (dateRange === '30D') {
        const diffMs = now.getTime() - d.getTime();
        return diffMs <= 30 * 24 * 60 * 60 * 1000;
      }
      if (dateRange === 'MONTH') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'YEAR') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [accountTrades, dateRange]);

  // Compute stats
  const stats: AccountStats = React.useMemo(() => {
    return calculateAccountStats(filteredTrades, currentAccount);
  }, [filteredTrades, currentAccount]);

  // Consistency & Risk calculations
  const riskStats = React.useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        avgLotSize: 0,
        minLotSize: 0,
        maxLotSize: 0,
        lotStdDev: 0,
        ruleComplianceRate: 100,
        winLossRatio: 0,
        expectancy: 0,
      };
    }

    const volumes = filteredTrades.map((t) => Number(t.volume) || 0);
    const avgLotSize = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const minLotSize = Math.min(...volumes);
    const maxLotSize = Math.max(...volumes);

    const variance =
      volumes.reduce((acc, v) => acc + Math.pow(v - avgLotSize, 2), 0) / volumes.length;
    const lotStdDev = Math.sqrt(variance);

    // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
    const winRateDec = stats.winRate / 100;
    const lossRateDec = stats.lossRate / 100;
    const expectancy = winRateDec * stats.avgWin - lossRateDec * stats.avgLoss;

    return {
      avgLotSize: Math.round(avgLotSize * 100) / 100,
      minLotSize: Math.round(minLotSize * 100) / 100,
      maxLotSize: Math.round(maxLotSize * 100) / 100,
      lotStdDev: Math.round(lotStdDev * 100) / 100,
      ruleComplianceRate: stats.complianceRate,
      winLossRatio: stats.winLossRatio,
      expectancy: Math.round(expectancy * 100) / 100,
    };
  }, [filteredTrades, stats]);

  const fmtCurrency = (val: number) => {
    const prefix = val < 0 ? '-$' : '$';
    return `${prefix}${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <LineChartIcon className="h-6 w-6 text-emerald-500" />
            Trading Analytics & Deep Performance
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Institutional metrics, edge verification, drawdown curve, session breakdowns, and strategy comparison.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Account Filter Select */}
          <div className="flex items-center gap-2">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="h-9 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-zinc-100 border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Accounts Combined</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.propFirm})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            {(
              [
                { label: 'All', value: 'ALL' },
                { label: 'Year', value: 'YEAR' },
                { label: 'Month', value: 'MONTH' },
                { label: '30D', value: '30D' },
                { label: '7D', value: 'WEEK' },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                onClick={() => setDateRange(item.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  dateRange === item.value
                    ? 'bg-zinc-800 text-emerald-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Total Net P/L</div>
          <div
            className={cn(
              'mt-1.5 text-lg font-bold font-mono',
              stats.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {fmtCurrency(stats.netPnL)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Vol: {stats.totalVolume.toFixed(1)} lots
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Win Rate</div>
          <div className="mt-1.5 text-lg font-bold font-mono text-zinc-100">
            {stats.winRate}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {stats.wins}W / {stats.losses}L / {stats.breakEvens}BE
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Profit Factor</div>
          <div className="mt-1.5 text-lg font-bold font-mono text-zinc-100">
            {stats.profitFactor >= 900 ? '∞' : stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Win/Loss Ratio: {stats.winLossRatio.toFixed(2)}
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Trade Expectancy</div>
          <div
            className={cn(
              'mt-1.5 text-lg font-bold font-mono',
              riskStats.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {fmtCurrency(riskStats.expectancy)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Per trade average</div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Max Drawdown</div>
          <div className="mt-1.5 text-lg font-bold font-mono text-purple-400">
            {stats.maxDrawdownPercent}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {fmtCurrency(stats.maxDrawdown)} peak-to-trough
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Max Win Streak</div>
          <div className="mt-1.5 text-lg font-bold font-mono text-emerald-400">
            {stats.maxConsecutiveWins} trades
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Max Loss Streak: {stats.maxConsecutiveLosses}
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900/90 border-zinc-800 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="equity" className="text-xs">
            <LineChartIcon className="h-3.5 w-3.5 mr-1.5" />
            Equity & Drawdown
          </TabsTrigger>
          <TabsTrigger value="symbols" className="text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Symbol Performance
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Sessions & Days
          </TabsTrigger>
          <TabsTrigger value="strategies" className="text-xs">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Strategies & Setups
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Risk & Consistency
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* SECTION 1: Equity Curve & Drawdown */}
        {/* ======================================================== */}
        <TabsContent value="equity" className="space-y-6">
          {/* Equity Chart */}
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Cumulative Balance Growth Curve
              </CardTitle>
              <CardDescription>
                Chronological balance progression after every closed trade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.equityCurve.length <= 1 ? (
                <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                  No trade data for this period.
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.equityCurve}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="equityGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#27272a' }}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#27272a' }}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09090b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          color: '#f4f4f5',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Balance']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return payload[0].payload.fullDate || label;
                          }
                          return label;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#equityGradAnalytics)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Underwater Drawdown Chart */}
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-purple-400" />
                Underwater Drawdown (%) Chart
              </CardTitle>
              <CardDescription>
                Drawdown depth from all-time peak equity to identify recovery durations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.equityCurve.length <= 1 ? (
                <div className="h-56 flex items-center justify-center text-zinc-500 text-sm">
                  No trade data available.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.equityCurve.map((pt) => ({
                        ...pt,
                        negativeDD: -Math.abs(pt.drawdownPercent),
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.0} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#27272a' }}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#27272a' }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09090b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          color: '#f4f4f5',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${Math.abs(Number(val))}%`, 'Drawdown']}
                      />
                      <Area
                        type="monotone"
                        dataKey="negativeDD"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#ddGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* SECTION 2: Symbol Performance */}
        {/* ======================================================== */}
        <TabsContent value="symbols" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Bar Chart PnL by Symbol */}
            <Card className="border-zinc-800 bg-zinc-900/70 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  Net P/L by Symbol ($)
                </CardTitle>
                <CardDescription>Profitability distribution across traded currency pairs and assets.</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.symbolBreakdown.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                    No symbols traded in this timeframe.
                  </div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.symbolBreakdown}
                        margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                          dataKey="symbol"
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090b',
                            borderColor: '#27272a',
                            borderRadius: '8px',
                            color: '#f4f4f5',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Net P/L']}
                        />
                        <Bar dataKey="netPnL" radius={[4, 4, 0, 0]}>
                          {stats.symbolBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.netPnL >= 0 ? '#10b981' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Best/Worst Asset Card */}
            <Card className="border-zinc-800 bg-zinc-900/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  Symbol Insights
                </CardTitle>
                <CardDescription>Top contributors and risk outliers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {stats.symbolBreakdown.length > 0 ? (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                      <div className="text-emerald-400 font-semibold flex items-center justify-between">
                        <span>Top Asset</span>
                        <span>{fmtCurrency(stats.symbolBreakdown[0].netPnL)}</span>
                      </div>
                      <div className="text-zinc-200 font-bold text-sm mt-1">
                        {stats.symbolBreakdown[0].symbol}
                      </div>
                      <div className="text-zinc-400 mt-0.5">
                        {stats.symbolBreakdown[0].tradesCount} trades • {stats.symbolBreakdown[0].winRate}% WR
                      </div>
                    </div>

                    {stats.symbolBreakdown[stats.symbolBreakdown.length - 1].netPnL < 0 && (
                      <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40">
                        <div className="text-red-400 font-semibold flex items-center justify-between">
                          <span>Worst Performer</span>
                          <span>
                            {fmtCurrency(stats.symbolBreakdown[stats.symbolBreakdown.length - 1].netPnL)}
                          </span>
                        </div>
                        <div className="text-zinc-200 font-bold text-sm mt-1">
                          {stats.symbolBreakdown[stats.symbolBreakdown.length - 1].symbol}
                        </div>
                        <div className="text-zinc-400 mt-0.5">
                          {stats.symbolBreakdown[stats.symbolBreakdown.length - 1].tradesCount} trades •{' '}
                          {stats.symbolBreakdown[stats.symbolBreakdown.length - 1].winRate}% WR
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-zinc-500">No symbol data available.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Symbols Table */}
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comprehensive Asset Table</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Volume (Lots)</th>
                    <th className="py-3 px-4">Profit Factor</th>
                    <th className="py-3 px-4">Avg Win / Loss</th>
                    <th className="py-3 px-4 text-right">Net P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {stats.symbolBreakdown.map((s) => (
                    <tr key={s.symbol} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-zinc-100">{s.symbol}</td>
                      <td className="py-3 px-4 text-zinc-300">
                        {s.tradesCount} <span className="text-zinc-500">({s.wins}W / {s.losses}L)</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-200">{s.winRate}%</td>
                      <td className="py-3 px-4 text-zinc-300">{s.totalVolume}</td>
                      <td className="py-3 px-4 text-zinc-200">
                        {s.profitFactor >= 900 ? '∞' : s.profitFactor.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        <span className="text-emerald-400">${s.avgWin}</span> /{' '}
                        <span className="text-red-400">${s.avgLoss}</span>
                      </td>
                      <td
                        className={cn(
                          'py-3 px-4 text-right font-bold',
                          s.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {fmtCurrency(s.netPnL)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* SECTION 3: Sessions & Days */}
        {/* ======================================================== */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Session Breakdown */}
            <Card className="border-zinc-800 bg-zinc-900/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Trading Session Breakdown
                </CardTitle>
                <CardDescription>Performance segmented by global market sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {stats.sessionBreakdown.map((s) => (
                    <div
                      key={s.session}
                      className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                        <span>{s.session}</span>
                        <span
                          className={cn(
                            'font-mono',
                            s.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {fmtCurrency(s.netPnL)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{s.tradesCount} trades</span>
                        <span>{s.winRate}% WR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Day of Week Breakdown */}
            <Card className="border-zinc-800 bg-zinc-900/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  Day of Week Profitability
                </CardTitle>
                <CardDescription>Identify your most profitable trading days.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.dayOfWeekBreakdown.filter((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(d.day))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09090b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          color: '#f4f4f5',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Net P/L']}
                      />
                      <Bar dataKey="netPnL" radius={[4, 4, 0, 0]}>
                        {stats.dayOfWeekBreakdown.map((entry, index) => (
                          <Cell
                            key={`dow-cell-${index}`}
                            fill={entry.netPnL >= 0 ? '#10b981' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* SECTION 4: Strategies */}
        {/* ======================================================== */}
        <TabsContent value="strategies" className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    Strategy Performance Comparison
                  </CardTitle>
                  <CardDescription>
                    Benchmark edge across all your defined playbooks and execution models.
                  </CardDescription>
                </div>
                <Link href="/strategies">
                  <Button variant="outline" size="sm" className="text-xs border-zinc-700">
                    Strategy Maker
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Strategy Model</th>
                    <th className="py-3 px-4">Trades</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Avg RR</th>
                    <th className="py-3 px-4">Profit Factor</th>
                    <th className="py-3 px-4 text-right">Net P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {stats.strategyBreakdown.map((st) => (
                    <tr key={st.strategyId} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-zinc-100">{st.strategyName}</td>
                      <td className="py-3 px-4 text-zinc-300">
                        {st.tradesCount} <span className="text-zinc-500">({st.wins}W / {st.losses}L)</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-200">{st.winRate}%</td>
                      <td className="py-3 px-4 text-cyan-400">
                        {st.avgRR > 0 ? `1:${st.avgRR.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-zinc-200">
                        {st.profitFactor >= 900 ? '∞' : st.profitFactor.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          'py-3 px-4 text-right font-bold',
                          st.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        {fmtCurrency(st.netPnL)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* SECTION 5: Risk & Consistency */}
        {/* ======================================================== */}
        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Lot Size Consistency */}
            <Card className="border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-500" />
                  Lot Size Consistency
                </span>
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">
                  Disciplined
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Average Volume:</span>
                  <span className="font-bold text-zinc-100">{riskStats.avgLotSize} lots</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Min / Max Volume:</span>
                  <span className="text-zinc-300">
                    {riskStats.minLotSize} - {riskStats.maxLotSize} lots
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Volume Std Deviation:</span>
                  <span className="text-zinc-300">±{riskStats.lotStdDev}</span>
                </div>
              </div>
            </Card>

            {/* Card 2: Streak Analysis */}
            <Card className="border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Streak Analysis
                </span>
                <span className="font-mono text-zinc-400">Current: {stats.currentStreak.count} {stats.currentStreak.type}</span>
              </div>
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Max Consecutive Wins:</span>
                  <span className="font-bold text-emerald-400">{stats.maxConsecutiveWins} trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Max Consecutive Losses:</span>
                  <span className="font-bold text-red-400">{stats.maxConsecutiveLosses} trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Win Rate (%):</span>
                  <span className="text-zinc-200">{stats.winRate}%</span>
                </div>
              </div>
            </Card>

            {/* Card 3: Rule Compliance */}
            <Card className="border-zinc-800 bg-zinc-900/70 p-5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Rule Compliance Score
                </span>
                <span className="font-mono font-bold text-cyan-400">{stats.complianceRate}%</span>
              </div>
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Max Drawdown Used:</span>
                  <span className="text-purple-400">{stats.maxDrawdownPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Best Trade:</span>
                  <span className="text-emerald-400">{fmtCurrency(stats.bestTrade)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Worst Trade:</span>
                  <span className="text-red-400">{fmtCurrency(stats.worstTrade)}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
