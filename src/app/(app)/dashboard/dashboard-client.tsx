'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Award,
  Clock,
  PlusCircle,
  BarChart3,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AccountSwitcher } from '@/components/accounts/account-switcher';
import {
  calculateAccountStats,
  AccountStats,
  TradeRecord,
  AccountRecord,
  formatISTDateTime,
} from '@/lib/services/trading-calculator';
import { cn } from '@/lib/utils';

interface DashboardClientProps {
  accounts: AccountRecord[];
  activeAccount: AccountRecord | null;
  trades: TradeRecord[];
  rules: any[];
  strategies: any[];
}

export default function DashboardClient({
  accounts,
  activeAccount,
  trades,
  rules,
  strategies,
}: DashboardClientProps) {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = React.useState<'ALL' | '30D' | '7D' | 'TODAY'>('ALL');
  const [currentTime, setCurrentTime] = React.useState<string>('');

  // Live IST Clock update
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter trades based on time filter
  const filteredTrades = React.useMemo(() => {
    if (timeFilter === 'ALL') return trades;
    const now = new Date();
    return trades.filter((t) => {
      const tradeDate = new Date(t.entryTime);
      const diffMs = now.getTime() - tradeDate.getTime();
      if (timeFilter === 'TODAY') {
        const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
        const tIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(tradeDate);
        return todayIST === tIST;
      }
      if (timeFilter === '7D') return diffMs <= 7 * 24 * 60 * 60 * 1000;
      if (timeFilter === '30D') return diffMs <= 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [trades, timeFilter]);

  // Compute stats
  const stats: AccountStats = React.useMemo(() => {
    return calculateAccountStats(filteredTrades, activeAccount);
  }, [filteredTrades, activeAccount]);

  const recentTrades = React.useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      .slice(0, 7);
  }, [trades]);

  const challenge = stats.challengeMetrics;

  // Session statuses for the compact clock widget
  const getSessionStatuses = () => {
    const now = new Date();
    const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
    
    // London: 08:00 - 16:30 GMT
    const londonOpen = utcHour >= 8 && utcHour < 16.5;
    // New York: 13:00 - 21:00 GMT
    const nyOpen = utcHour >= 13 && utcHour < 21;
    // Tokyo: 00:00 - 09:00 GMT
    const tokyoOpen = utcHour >= 0 && utcHour < 9;
    // Sydney: 21:00 - 06:00 GMT (crosses midnight)
    const sydneyOpen = utcHour >= 21 || utcHour < 6;
    
    const overlapLondonNY = londonOpen && nyOpen;

    return { londonOpen, nyOpen, tokyoOpen, sydneyOpen, overlapLondonNY };
  };

  const sessions = getSessionStatuses();

  // Helper for formatting currency
  const fmtCurrency = (val: number) => {
    const prefix = val < 0 ? '-$' : '$';
    return `${prefix}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isNetPositive = stats.netPnL >= 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Account Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Trading Dashboard</h1>
            {activeAccount && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2 py-0.5 font-semibold',
                  activeAccount.status === 'PASSED'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : activeAccount.status === 'FAILED'
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                )}
              >
                {activeAccount.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time prop firm metrics, risk rules compliance & equity curve.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {accounts.length > 0 && (
            <AccountSwitcher
              accounts={accounts as any}
              activeAccountId={activeAccount?.id || null}
            />
          )}

          <Link href="/trades/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold gap-1.5 shadow-lg shadow-emerald-950/40">
              <PlusCircle className="h-4 w-4" />
              <span>Log Trade</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* No Account State */}
      {!activeAccount && (
        <Card className="border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <div className="mx-auto max-w-md space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">No Active Account Selected</h3>
            <p className="text-sm text-zinc-400">
              Create a funded challenge or account to track your targets, drawdowns, and trading performance.
            </p>
            <Link href="/accounts" className="inline-block mt-2">
              <Button variant="default">Go to Accounts</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Prop Firm Challenge Progress Cards (When account exists) */}
      {activeAccount && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Profit Target */}
          <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/70 backdrop-blur-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  Profit Target
                </span>
                <span className="font-mono text-zinc-300">
                  {challenge.targetProgress >= 100 ? 'Target Met!' : `${challenge.targetProgress}%`}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="text-xl font-bold font-mono text-zinc-100">
                  {fmtCurrency(challenge.currentProfit)}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Target: {fmtCurrency(challenge.profitTargetAmount)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={Math.max(0, challenge.targetProgress)}
                max={100}
                className="h-2 bg-zinc-800"
                indicatorClassName={cn(
                  challenge.targetProgress >= 100
                    ? 'bg-emerald-400'
                    : challenge.targetProgress > 50
                    ? 'bg-emerald-500'
                    : 'bg-emerald-600'
                )}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Start: {fmtCurrency(challenge.startingBalance)}</span>
                <span>Bal: {fmtCurrency(challenge.currentBalance)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Daily Drawdown */}
          <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/70 backdrop-blur-xs">
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                challenge.dailyDDUsedPercent > 80
                  ? 'from-red-500 to-rose-600'
                  : challenge.dailyDDUsedPercent > 50
                  ? 'from-amber-500 to-orange-500'
                  : 'from-blue-500 to-cyan-400'
              )}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  Daily Drawdown
                </span>
                <span
                  className={cn(
                    'font-mono font-medium',
                    challenge.dailyDDUsedPercent > 80 ? 'text-red-400' : 'text-zinc-300'
                  )}
                >
                  {challenge.dailyDDUsedPercent}% used
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div
                  className={cn(
                    'text-xl font-bold font-mono',
                    challenge.dailyDDUsed > 0 ? 'text-amber-400' : 'text-zinc-100'
                  )}
                >
                  {fmtCurrency(challenge.dailyDDUsed)}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Limit: {fmtCurrency(challenge.dailyDrawdownLimit)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={challenge.dailyDDUsedPercent}
                max={100}
                className="h-2 bg-zinc-800"
                indicatorClassName={cn(
                  challenge.dailyDDUsedPercent > 80
                    ? 'bg-red-500'
                    : challenge.dailyDDUsedPercent > 50
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                )}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Left: {fmtCurrency(challenge.dailyDDRemaining)}</span>
                <span className="text-[10px] text-zinc-400">Resets 00:00 IST</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Max Drawdown */}
          <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/70 backdrop-blur-xs">
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                challenge.maxDDUsedPercent > 80
                  ? 'from-red-500 to-rose-600'
                  : challenge.maxDDUsedPercent > 50
                  ? 'from-amber-500 to-orange-500'
                  : 'from-purple-500 to-indigo-400'
              )}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
                  Max Drawdown Limit
                </span>
                <span
                  className={cn(
                    'font-mono font-medium',
                    challenge.maxDDUsedPercent > 80 ? 'text-red-400' : 'text-zinc-300'
                  )}
                >
                  {challenge.maxDDUsedPercent}% used
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div
                  className={cn(
                    'text-xl font-bold font-mono',
                    challenge.maxDDUsed > 0 ? 'text-purple-300' : 'text-zinc-100'
                  )}
                >
                  {fmtCurrency(challenge.maxDDUsed)}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Limit: {fmtCurrency(challenge.maxDrawdownLimit)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={challenge.maxDDUsedPercent}
                max={100}
                className="h-2 bg-zinc-800"
                indicatorClassName={cn(
                  challenge.maxDDUsedPercent > 80
                    ? 'bg-red-500'
                    : challenge.maxDDUsedPercent > 50
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                )}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Buffer: {fmtCurrency(challenge.maxDDRemaining)}</span>
                <span>Max DD: {stats.maxDrawdownPercent}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Min Trading Days */}
          <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/70 backdrop-blur-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  Trading Days
                </span>
                <span className="font-mono text-zinc-300">
                  {challenge.tradingDaysPassed} / {challenge.minTradingDays} days
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="text-xl font-bold font-mono text-zinc-100">
                  {challenge.tradingDaysPassed >= challenge.minTradingDays ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-5 w-5" /> Completed
                    </span>
                  ) : (
                    <span>{challenge.minTradingDays - challenge.tradingDaysPassed} Left</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Min: {challenge.minTradingDays} days
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={challenge.tradingDaysProgress}
                max={100}
                className="h-2 bg-zinc-800"
                indicatorClassName="bg-amber-500"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Prop Firm: {activeAccount.propFirm}</span>
                <span>${Number(activeAccount.accountSize).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* KPI 1: Net P/L */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Net P/L</span>
            {isNetPositive ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div
            className={cn(
              'mt-2 text-lg font-bold font-mono',
              isNetPositive ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {fmtCurrency(stats.netPnL)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {stats.totalProfit > 0 && <span className="text-emerald-500">+${stats.totalProfit}</span>}
            {stats.totalProfit > 0 && stats.totalLoss > 0 && <span> / </span>}
            {stats.totalLoss > 0 && <span className="text-red-500">-${stats.totalLoss}</span>}
          </div>
        </Card>

        {/* KPI 2: Win Rate */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Win Rate</span>
            <Percent className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {stats.winRate}%
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">{stats.wins}W</span>
            <span>•</span>
            <span className="text-red-400 font-medium">{stats.losses}L</span>
            <span>•</span>
            <span>{stats.breakEvens}BE</span>
          </div>
        </Card>

        {/* KPI 3: Profit Factor */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Profit Factor</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {stats.profitFactor >= 900 ? '∞' : stats.profitFactor.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {stats.profitFactor >= 2.0 ? (
              <span className="text-emerald-400 font-medium">Elite System</span>
            ) : stats.profitFactor >= 1.5 ? (
              <span className="text-teal-400 font-medium">Good Profitability</span>
            ) : stats.profitFactor >= 1.0 ? (
              <span className="text-amber-400 font-medium">Break-even Zone</span>
            ) : (
              <span className="text-zinc-400">Needs Refinement</span>
            )}
          </div>
        </Card>

        {/* KPI 4: Total Trades */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Trades</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {stats.totalTrades}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            <span>{stats.longTradesCount} Long</span>
            <span className="mx-1">•</span>
            <span>{stats.shortTradesCount} Short</span>
          </div>
        </Card>

        {/* KPI 5: Avg RR */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Avg Risk:Reward</span>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {stats.avgRR > 0 ? `1:${stats.avgRR.toFixed(2)}` : '-'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Avg Win: <span className="text-emerald-400">${stats.avgWin}</span>
          </div>
        </Card>

        {/* KPI 6: Avg Duration */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Avg Hold Time</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {stats.avgDurationSeconds > 0 ? (
              stats.avgDurationSeconds >= 3600 ? (
                `${Math.floor(stats.avgDurationSeconds / 3600)}h ${Math.floor(
                  (stats.avgDurationSeconds % 3600) / 60
                )}m`
              ) : (
                `${Math.floor(stats.avgDurationSeconds / 60)}m`
              )
            ) : (
              'Intraday'
            )}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Avg Loss: <span className="text-red-400">${stats.avgLoss}</span>
          </div>
        </Card>
      </div>

      {/* Equity Curve Area Chart Section */}
      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Cumulative Equity & Balance Curve
              </CardTitle>
              <CardDescription>
                Chronological equity trajectory with peak high-water mark and drawdown tracking.
              </CardDescription>
            </div>

            {/* Time Filter Buttons */}
            <div className="flex items-center gap-1 rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              {(['ALL', '30D', '7D', 'TODAY'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    timeFilter === filter
                      ? 'bg-zinc-800 text-emerald-400 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.equityCurve.length <= 1 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
              <div className="text-zinc-500 text-sm">
                No trade data available for this timeframe to plot equity curve.
              </div>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.equityCurve}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
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
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                    formatter={(value: any, name: any) => [
                      `$${Number(value).toLocaleString()}`,
                      name === 'balance' ? 'Account Balance' : name,
                    ]}
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
                    fillOpacity={1}
                    fill="url(#equityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Column Section: Recent Trades vs Clocks & Rules */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2/3): Recent Trades */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Recent Trades
                  </CardTitle>
                  <CardDescription>Latest trade executions on this account.</CardDescription>
                </div>
                <Link
                  href="/trades"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <span>View All Trades</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentTrades.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  No trades logged yet. Click "Log Trade" above to get started.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {recentTrades.map((trade) => {
                    const pl = (Number(trade.profitLoss) || 0) - (Number(trade.commission) || 0) - (Number(trade.swap) || 0);
                    const isWin = pl > 0;
                    const isBE = Math.abs(pl) <= 0.001;

                    return (
                      <Link
                        key={trade.id}
                        href={`/trades/${trade.id}`}
                        className="flex items-center justify-between p-4 hover:bg-zinc-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
                              trade.direction === 'BUY'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            )}
                          >
                            {trade.direction}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors">
                                {trade.symbol}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {trade.volume} lots
                              </span>
                              {trade.ticketNumber && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  #{trade.ticketNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {formatISTDateTime(trade.entryTime)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={cn(
                              'font-mono font-semibold text-sm',
                              isBE
                                ? 'text-zinc-400'
                                : isWin
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            )}
                          >
                            {fmtCurrency(pl)}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            @ {Number(trade.entryPrice).toFixed(trade.entryPrice > 100 ? 2 : 5)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Market Sessions & Rules Status */}
        <div className="space-y-6 lg:col-span-1">
          {/* Widget 1: Market Clocks Status */}
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  Live Market Sessions
                </CardTitle>
                <Link
                  href="/clocks"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
                >
                  Full Clocks <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Local IST: <span className="text-zinc-200 font-semibold">{currentTime || '...'}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Overlap Banner */}
              {sessions.overlapLondonNY && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                  <Zap className="h-4 w-4 shrink-0 animate-pulse text-emerald-400" />
                  <span>London / New York Overlap Active (Peak Volume)</span>
                </div>
              )}

              {/* Sessions List */}
              <div className="space-y-2 text-xs">
                {/* London */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="font-medium text-zinc-200">London (08:00 - 16:30 GMT)</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 font-medium',
                      sessions.londonOpen
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 text-zinc-500 bg-zinc-900'
                    )}
                  >
                    {sessions.londonOpen ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>

                {/* New York */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="font-medium text-zinc-200">New York (13:00 - 21:00 GMT)</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 font-medium',
                      sessions.nyOpen
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 text-zinc-500 bg-zinc-900'
                    )}
                  >
                    {sessions.nyOpen ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>

                {/* Tokyo */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="font-medium text-zinc-200">Tokyo / Asian (00:00 - 09:00 GMT)</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 font-medium',
                      sessions.tokyoOpen
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 text-zinc-500 bg-zinc-900'
                    )}
                  >
                    {sessions.tokyoOpen ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>

                {/* Sydney */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="font-medium text-zinc-200">Sydney (21:00 - 06:00 GMT)</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 font-medium',
                      sessions.sydneyOpen
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 text-zinc-500 bg-zinc-900'
                    )}
                  >
                    {sessions.sydneyOpen ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget 2: Rules & Safeguards */}
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Active Rules ({rules.length})
                </CardTitle>
                <Link
                  href="/rules"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
                >
                  Manage <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <CardDescription>Execution limits configured for this account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {rules.length === 0 ? (
                <div className="py-4 text-center text-zinc-500">
                  No rules configured yet.
                  <Link href="/rules" className="block text-emerald-400 mt-1">
                    Add custom rules
                  </Link>
                </div>
              ) : (
                rules.slice(0, 4).map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-zinc-200 truncate">{rule.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{rule.ruleType}</div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0">
                      ACTIVE
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/trades/new" className="block">
          <Card className="border-zinc-800 bg-zinc-900/40 p-4 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  Log Trade
                </div>
                <div className="text-xs text-zinc-400">OCR & Manual upload</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/analytics" className="block">
          <Card className="border-zinc-800 bg-zinc-900/40 p-4 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors">
                  Deep Analytics
                </div>
                <div className="text-xs text-zinc-400">Symbols, Sessions, Edge</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/calendar" className="block">
          <Card className="border-zinc-800 bg-zinc-900/40 p-4 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">
                  Monthly Calendar
                </div>
                <div className="text-xs text-zinc-400">Day PnL & trade logs</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/rules" className="block">
          <Card className="border-zinc-800 bg-zinc-900/40 p-4 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors">
                  Manage Rules
                </div>
                <div className="text-xs text-zinc-400">Risk & Prop guardrails</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
