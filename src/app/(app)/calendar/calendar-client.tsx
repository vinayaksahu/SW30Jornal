'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Plus,
  ExternalLink,
  X,
  Clock,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AccountSwitcher } from '@/components/accounts/account-switcher';
import {
  TradeRecord,
  AccountRecord,
  getTradeNetProfit,
  formatISTDateKey,
  formatISTDateTime,
} from '@/lib/services/trading-calculator';
import { cn } from '@/lib/utils';

interface CalendarClientProps {
  accounts: AccountRecord[];
  activeAccount: AccountRecord | null;
  trades: TradeRecord[];
}

export default function CalendarClient({
  accounts,
  activeAccount,
  trades,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = React.useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Group trades by date key (YYYY-MM-DD in IST)
  const tradesByDay = React.useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; losses: number; be: number; trades: TradeRecord[] }> = {};
    for (const t of trades) {
      const key = formatISTDateKey(t.entryTime);
      const pnl = getTradeNetProfit(t);
      if (!map[key]) {
        map[key] = { pnl: 0, wins: 0, losses: 0, be: 0, trades: [] };
      }
      map[key].pnl += pnl;
      map[key].trades.push(t);
      if (pnl > 0.001) map[key].wins += 1;
      else if (pnl < -0.001) map[key].losses += 1;
      else map[key].be += 1;
    }
    return map;
  }, [trades]);

  // Calculate Month Summary Statistics
  const monthStats = React.useMemo(() => {
    let monthPnL = 0;
    let monthTradesCount = 0;
    let monthWins = 0;
    let monthLosses = 0;
    let greenDays = 0;
    let redDays = 0;
    let beDays = 0;
    let bestDay: { date: string; pnl: number } | null = null;
    let worstDay: { date: string; pnl: number } | null = null;

    // Filter trades in this month
    for (const [dayKey, dayData] of Object.entries(tradesByDay)) {
      const [dYear, dMonth] = dayKey.split('-').map(Number);
      if (dYear === year && dMonth === month + 1) {
        monthPnL += dayData.pnl;
        monthTradesCount += dayData.trades.length;
        monthWins += dayData.wins;
        monthLosses += dayData.losses;

        if (dayData.pnl > 0.001) {
          greenDays++;
          if (!bestDay || dayData.pnl > bestDay.pnl) {
            bestDay = { date: dayKey, pnl: dayData.pnl };
          }
        } else if (dayData.pnl < -0.001) {
          redDays++;
          if (!worstDay || dayData.pnl < worstDay.pnl) {
            worstDay = { date: dayKey, pnl: dayData.pnl };
          }
        } else if (dayData.trades.length > 0) {
          beDays++;
        }
      }
    }

    const closed = monthWins + monthLosses;
    const winRate = closed > 0 ? (monthWins / closed) * 100 : 0;
    const totalDaysTraded = greenDays + redDays + beDays;
    const dayWinRate = totalDaysTraded > 0 ? (greenDays / totalDaysTraded) * 100 : 0;

    return {
      monthPnL: Math.round(monthPnL * 100) / 100,
      monthTradesCount,
      monthWins,
      monthLosses,
      greenDays,
      redDays,
      beDays,
      totalDaysTraded,
      winRate: Math.round(winRate * 10) / 10,
      dayWinRate: Math.round(dayWinRate * 10) / 10,
      bestDay,
      worstDay,
    };
  }, [tradesByDay, year, month]);

  // Generate calendar days grid (Monday start)
  const calendarGrid = React.useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // In JS, 0 is Sunday, 1 is Monday ... 6 is Saturday
    // We want Monday = 0, Tuesday = 1 ... Sunday = 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
      isToday: boolean;
    }> = [];

    const todayISTKey = formatISTDateKey(new Date());

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dNum);
      const dateKey = formatISTDateKey(d);
      days.push({
        date: d,
        dayNumber: dNum,
        isCurrentMonth: false,
        dateKey,
        isToday: dateKey === todayISTKey,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateKey = formatISTDateKey(d);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        dateKey,
        isToday: dateKey === todayISTKey,
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = formatISTDateKey(d);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        dateKey,
        isToday: dateKey === todayISTKey,
      });
    }

    return days;
  }, [year, month]);

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month, 1));

  // Selected Day Trades for Modal / Drawer
  const selectedDayData = selectedDayKey ? tradesByDay[selectedDayKey] : null;

  const fmtCurrency = (val: number) => {
    const prefix = val < 0 ? '-$' : '+$';
    return `${prefix}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-emerald-500" />
              Trading Calendar
            </h1>
            {activeAccount && (
              <Badge variant="outline" className="text-xs border-zinc-800 text-zinc-300">
                {activeAccount.name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monthly P/L breakdown, winning/losing days, and daily trade logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {accounts.length > 0 && (
            <AccountSwitcher
              accounts={accounts as any}
              activeAccountId={activeAccount?.id || null}
            />
          )}

          {/* Month Navigation Buttons */}
          <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={jumpToToday}
              className="h-8 text-xs font-semibold px-2.5 text-zinc-300 hover:text-zinc-100"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Month Year Banner & Monthly KPI Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Card 1: Month P/L */}
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Month Net P/L</span>
            {monthStats.monthPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div
            className={cn(
              'mt-2 text-lg font-bold font-mono',
              monthStats.monthPnL > 0
                ? 'text-emerald-400'
                : monthStats.monthPnL < 0
                ? 'text-red-400'
                : 'text-zinc-300'
            )}
          >
            {monthStats.monthPnL !== 0 ? fmtCurrency(monthStats.monthPnL) : '$0.00'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {monthName} {year}
          </div>
        </Card>

        {/* Card 2: Green vs Red Days */}
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Day Win / Loss</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100 flex items-center gap-1.5">
            <span className="text-emerald-400">{monthStats.greenDays}W</span>
            <span className="text-zinc-500">/</span>
            <span className="text-red-400">{monthStats.redDays}L</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {monthStats.dayWinRate}% Day Win Rate
          </div>
        </Card>

        {/* Card 3: Trade Win Rate */}
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Trade Win Rate</span>
            <Percent className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {monthStats.winRate}%
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {monthStats.monthWins}W • {monthStats.monthLosses}L
          </div>
        </Card>

        {/* Card 4: Total Trades */}
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Trades</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-zinc-100">
            {monthStats.monthTradesCount}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Across {monthStats.totalDaysTraded} trading days
          </div>
        </Card>

        {/* Card 5: Best Day */}
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Best Day</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-emerald-400 truncate">
            {monthStats.bestDay ? fmtCurrency(monthStats.bestDay.pnl) : '-'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 truncate">
            {monthStats.bestDay ? monthStats.bestDay.date : 'No trades'}
          </div>
        </Card>

        {/* Card 6: Worst Day */}
        <Card className="border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Worst Day</span>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-red-400 truncate">
            {monthStats.worstDay ? fmtCurrency(monthStats.worstDay.pnl) : '-'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 truncate">
            {monthStats.worstDay ? monthStats.worstDay.date : 'No trades'}
          </div>
        </Card>
      </div>

      {/* Calendar Header Month Title */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-mono">
          {monthName} {year}
        </h2>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
            <span>Green Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-red-500/30 border border-red-500/50" />
            <span>Red Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-zinc-800 border border-zinc-700" />
            <span>No Trades</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-2xl">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/90 text-center text-xs font-semibold text-zinc-400">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
            <div
              key={dayName}
              className={cn(
                'py-3 border-r border-zinc-800/60 last:border-r-0',
                idx >= 5 ? 'text-zinc-500' : 'text-zinc-300'
              )}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-zinc-800/60">
          {calendarGrid.map((day, index) => {
            const dayData = tradesByDay[day.dateKey];
            const hasTrades = dayData && dayData.trades.length > 0;
            const isGreen = hasTrades && dayData.pnl > 0.001;
            const isRed = hasTrades && dayData.pnl < -0.001;
            const isBE = hasTrades && !isGreen && !isRed;

            return (
              <div
                key={`${day.dateKey}-${index}`}
                onClick={() => hasTrades && setSelectedDayKey(day.dateKey)}
                className={cn(
                  'min-h-[100px] p-2 sm:p-2.5 transition-all relative flex flex-col justify-between select-none',
                  !day.isCurrentMonth
                    ? 'bg-zinc-950/30 text-zinc-600 opacity-40'
                    : hasTrades
                    ? 'cursor-pointer hover:ring-1 hover:ring-emerald-500/50 hover:bg-zinc-900/90'
                    : 'bg-zinc-950/60 text-zinc-400',
                  isGreen && day.isCurrentMonth && 'bg-emerald-950/15 border-emerald-900/30',
                  isRed && day.isCurrentMonth && 'bg-red-950/15 border-red-900/30',
                  day.isToday && 'ring-1 ring-emerald-500 ring-inset'
                )}
              >
                {/* Top Row: Day Number & Today indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-semibold font-mono',
                      day.isToday
                        ? 'flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 font-bold'
                        : day.isCurrentMonth
                        ? 'text-zinc-300'
                        : 'text-zinc-600'
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {hasTrades && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {dayData.trades.length} {dayData.trades.length === 1 ? 'trade' : 'trades'}
                    </span>
                  )}
                </div>

                {/* Middle / Bottom: P/L badge and trade breakdown */}
                {hasTrades ? (
                  <div className="mt-2 space-y-1">
                    <div
                      className={cn(
                        'text-xs sm:text-sm font-bold font-mono rounded px-1.5 py-0.5 inline-block',
                        isGreen
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : isRed
                          ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                          : 'text-zinc-300 bg-zinc-800'
                      )}
                    >
                      {fmtCurrency(dayData.pnl)}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                      <span className="text-emerald-400">{dayData.wins}W</span>
                      <span>/</span>
                      <span className="text-red-400">{dayData.losses}L</span>
                      {dayData.be > 0 && <span>/ {dayData.be}BE</span>}
                    </div>
                  </div>
                ) : (
                  <div className="h-6" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal / Slide-over Drawer */}
      {selectedDayKey && selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg font-bold font-mono text-sm',
                    selectedDayData.pnl > 0.001
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : selectedDayData.pnl < -0.001
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-zinc-800 text-zinc-300'
                  )}
                >
                  {selectedDayData.pnl > 0.001 ? 'WIN' : selectedDayData.pnl < -0.001 ? 'LOSS' : 'BE'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span>{selectedDayKey}</span>
                    <span className="text-xs text-zinc-400 font-normal">
                      ({selectedDayData.trades.length} {selectedDayData.trades.length === 1 ? 'trade' : 'trades'})
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
                    <span
                      className={cn(
                        'font-semibold',
                        selectedDayData.pnl > 0
                          ? 'text-emerald-400'
                          : selectedDayData.pnl < 0
                          ? 'text-red-400'
                          : 'text-zinc-400'
                      )}
                    >
                      Day Net P/L: {fmtCurrency(selectedDayData.pnl)}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">
                      {selectedDayData.wins} Wins / {selectedDayData.losses} Losses
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDayKey(null)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Trades List */}
            <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-3">
              {selectedDayData.trades.map((trade) => {
                const pl = getTradeNetProfit(trade);
                const isWin = pl > 0.001;
                const isBE = Math.abs(pl) <= 0.001;

                return (
                  <div
                    key={trade.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold shrink-0',
                          trade.direction === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        )}
                      >
                        {trade.direction}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-100">
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
                          {trade.strategy?.name && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-800 text-zinc-400">
                              {trade.strategy.name}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span>Entry: {Number(trade.entryPrice).toFixed(trade.entryPrice > 100 ? 2 : 5)}</span>
                          {trade.exitPrice && (
                            <span>Exit: {Number(trade.exitPrice).toFixed(trade.entryPrice > 100 ? 2 : 5)}</span>
                          )}
                          <span>Time: {formatISTDateTime(trade.entryTime).split(',')[1] || ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-zinc-800/60 sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right">
                        <div
                          className={cn(
                            'font-mono font-bold text-base',
                            isBE ? 'text-zinc-400' : isWin ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {fmtCurrency(pl)}
                        </div>
                        {trade.rrRatio != null && (
                          <div className="text-[11px] text-zinc-400 font-mono">
                            RR: 1:{Number(trade.rrRatio).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <Link href={`/trades/${trade.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-zinc-800 bg-zinc-950/60">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDayKey(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
