'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Clock,
  Globe,
  Zap,
  TrendingUp,
  Activity,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SessionDef {
  id: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  openUtc: number; // e.g. 8.0 for 08:00
  closeUtc: number; // e.g. 16.5 for 16:30
  crossesMidnight?: boolean;
  localHoursStr: string;
  istHoursStr: string;
  flag: string;
  recommendedPairs: string[];
  description: string;
}

const SESSIONS: SessionDef[] = [
  {
    id: 'london',
    name: 'London Session',
    city: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    openUtc: 8.0, // 08:00 GMT
    closeUtc: 16.5, // 16:30 GMT
    localHoursStr: '08:00 - 16:30 GMT',
    istHoursStr: '01:30 PM - 10:00 PM IST',
    flag: '🇬🇧',
    recommendedPairs: ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'GBP/JPY', 'XAU/USD'],
    description: 'Highest forex volume session globally. Creates major daily high/lows.',
  },
  {
    id: 'new_york',
    name: 'New York Session',
    city: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
    openUtc: 13.0, // 13:00 GMT / 08:00 EST
    closeUtc: 21.0, // 21:00 GMT / 16:00 EST
    localHoursStr: '08:00 - 16:00 EST',
    istHoursStr: '06:30 PM - 02:30 AM IST',
    flag: '🇺🇸',
    recommendedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'US30', 'NAS100'],
    description: 'High volatility, major economic data releases (NFP, CPI, FOMC), index moves.',
  },
  {
    id: 'tokyo',
    name: 'Tokyo / Asian Session',
    city: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    openUtc: 0.0, // 00:00 GMT / 09:00 JST
    closeUtc: 9.0, // 09:00 GMT / 18:00 JST
    localHoursStr: '09:00 - 18:00 JST',
    istHoursStr: '05:30 AM - 02:30 PM IST',
    flag: '🇯🇵',
    recommendedPairs: ['USD/JPY', 'EUR/JPY', 'AUD/JPY', 'AUD/USD', 'NZD/USD'],
    description: 'Consolidation & range-building phase. Watch for liquidity sweeps in London.',
  },
  {
    id: 'sydney',
    name: 'Sydney Session',
    city: 'Sydney',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    openUtc: 21.0, // 21:00 GMT / 07:00 AEST
    closeUtc: 6.0, // 06:00 GMT (next day) / 16:00 AEST
    crossesMidnight: true,
    localHoursStr: '07:00 - 16:00 AEST',
    istHoursStr: '02:30 AM - 11:30 AM IST',
    flag: '🇦🇺',
    recommendedPairs: ['AUD/USD', 'NZD/USD', 'AUD/JPY', 'AUD/NZD'],
    description: 'Opens the weekly trading cycle on Sunday night. Lower liquidity.',
  },
];

export default function ClocksClient() {
  const [mounted, setMounted] = React.useState(false);
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const currentUtcDec = utcHours + utcMinutes / 60 + utcSeconds / 3600;

  // Format time for a specific timezone
  const getTimeInTz = (tz: string) => {
    try {
      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: '2-digit',
      }).format(now);

      return { timeStr, dateStr };
    } catch {
      return { timeStr: '00:00:00', dateStr: '...' };
    }
  };

  // Local IST time
  const istInfo = getTimeInTz('Asia/Kolkata');

  // Compute status & countdown for each session
  const getSessionState = (session: SessionDef) => {
    let isOpen = false;
    let progress = 0;
    let countdownStr = '';

    if (session.crossesMidnight) {
      // e.g. 21.0 to 6.0 UTC
      if (currentUtcDec >= session.openUtc || currentUtcDec < session.closeUtc) {
        isOpen = true;
        const totalDuration = (24 - session.openUtc) + session.closeUtc; // e.g. 3 + 6 = 9 hrs
        const elapsed = currentUtcDec >= session.openUtc
          ? currentUtcDec - session.openUtc
          : (24 - session.openUtc) + currentUtcDec;
        progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

        // Time until close
        let remainingHours = session.closeUtc > currentUtcDec
          ? session.closeUtc - currentUtcDec
          : (24 - currentUtcDec) + session.closeUtc;
        const rHours = Math.floor(remainingHours);
        const rMins = Math.floor((remainingHours - rHours) * 60);
        const rSecs = Math.floor(((remainingHours - rHours) * 60 - rMins) * 60);
        countdownStr = `Closes in ${rHours}h ${rMins}m ${rSecs}s`;
      } else {
        isOpen = false;
        let untilOpen = session.openUtc - currentUtcDec;
        const rHours = Math.floor(untilOpen);
        const rMins = Math.floor((untilOpen - rHours) * 60);
        const rSecs = Math.floor(((untilOpen - rHours) * 60 - rMins) * 60);
        countdownStr = `Opens in ${rHours}h ${rMins}m ${rSecs}s`;
      }
    } else {
      if (currentUtcDec >= session.openUtc && currentUtcDec < session.closeUtc) {
        isOpen = true;
        const totalDuration = session.closeUtc - session.openUtc;
        const elapsed = currentUtcDec - session.openUtc;
        progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

        const remainingHours = session.closeUtc - currentUtcDec;
        const rHours = Math.floor(remainingHours);
        const rMins = Math.floor((remainingHours - rHours) * 60);
        const rSecs = Math.floor(((remainingHours - rHours) * 60 - rMins) * 60);
        countdownStr = `Closes in ${rHours}h ${rMins}m ${rSecs}s`;
      } else {
        isOpen = false;
        let untilOpen = session.openUtc > currentUtcDec
          ? session.openUtc - currentUtcDec
          : (24 - currentUtcDec) + session.openUtc;
        const rHours = Math.floor(untilOpen);
        const rMins = Math.floor((untilOpen - rHours) * 60);
        const rSecs = Math.floor(((untilOpen - rHours) * 60 - rMins) * 60);
        countdownStr = `Opens in ${rHours}h ${rMins}m ${rSecs}s`;
      }
    }

    return { isOpen, progress: Math.round(progress), countdownStr };
  };

  // London-New York Overlap: 13:00 - 16:30 UTC
  const overlapOpenUtc = 13.0;
  const overlapCloseUtc = 16.5; // 4:30 PM GMT / 10:00 PM IST
  const isOverlapActive = currentUtcDec >= overlapOpenUtc && currentUtcDec < overlapCloseUtc;

  let overlapCountdownStr = '';
  let overlapProgress = 0;
  if (isOverlapActive) {
    const elapsed = currentUtcDec - overlapOpenUtc;
    overlapProgress = Math.min(100, Math.max(0, (elapsed / (overlapCloseUtc - overlapOpenUtc)) * 100));
    const remaining = overlapCloseUtc - currentUtcDec;
    const rH = Math.floor(remaining);
    const rM = Math.floor((remaining - rH) * 60);
    const rS = Math.floor(((remaining - rH) * 60 - rM) * 60);
    overlapCountdownStr = `Ends in ${rH}h ${rM}m ${rS}s`;
  } else {
    let untilOverlap = overlapOpenUtc > currentUtcDec
      ? overlapOpenUtc - currentUtcDec
      : (24 - currentUtcDec) + overlapOpenUtc;
    const rH = Math.floor(untilOverlap);
    const rM = Math.floor((untilOverlap - rH) * 60);
    const rS = Math.floor(((untilOverlap - rH) * 60 - rM) * 60);
    overlapCountdownStr = `Starts in ${rH}h ${rM}m ${rS}s`;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-500" />
            Global Market Clocks & Sessions
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time multi-market trading clocks, volatility overlap radar, and session schedules.
          </p>
        </div>

        {/* Primary IST Clock Display */}
        <div className="flex items-center gap-3 rounded-xl bg-zinc-900/90 border border-zinc-800 p-3 shadow-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Globe className="h-5 w-5 animate-spin" style={{ animationDuration: '60s' }} />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Local Time (Asia/Kolkata)</div>
            <div className="text-lg font-bold font-mono text-zinc-100">
              {mounted ? istInfo.timeStr : '00:00:00'}{' '}
              <span className="text-xs font-normal text-emerald-400">IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* London-NY Overlap Special Volatility Banner */}
      <Card
        className={cn(
          'relative overflow-hidden border transition-all',
          isOverlapActive
            ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-zinc-950/80 shadow-lg shadow-emerald-950/30'
            : 'border-zinc-800 bg-zinc-900/40'
        )}
      >
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                isOverlapActive
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400'
              )}
            >
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-100">
                  London - New York Overlap Window
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5',
                    isOverlapActive
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 animate-pulse'
                      : 'border-zinc-700 text-zinc-400 bg-zinc-800'
                  )}
                >
                  {isOverlapActive ? '🔥 PEAK VOLATILITY ACTIVE' : 'UPCOMING'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                Highest liquidity & explosive order flow period (01:00 PM - 04:30 PM GMT / 06:30 PM - 10:00 PM IST). 
                Optimal window for breakouts, trend extensions, and prop firm execution.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0">
            <div className="text-xs font-mono font-semibold text-emerald-400">
              {overlapCountdownStr}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              13:00 - 16:30 GMT • 6:30 PM - 10:00 PM IST
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Major Financial Center Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SESSIONS.map((session) => {
          const tzData = getTimeInTz(session.timezone);
          const state = getSessionState(session);

          return (
            <Card
              key={session.id}
              className={cn(
                'relative overflow-hidden border transition-all',
                state.isOpen
                  ? 'border-emerald-500/40 bg-zinc-900/90 shadow-md shadow-emerald-950/20'
                  : 'border-zinc-800 bg-zinc-900/50 opacity-85 hover:opacity-100'
              )}
            >
              {/* Top Accent Line */}
              <div
                className={cn(
                  'h-1.5 w-full',
                  state.isOpen
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-zinc-800'
                )}
              />

              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{session.flag}</span>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-100">
                        {session.city}
                      </CardTitle>
                      <div className="text-[11px] text-zinc-400">{session.country}</div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5',
                      state.isOpen
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-500'
                    )}
                  >
                    {state.isOpen ? 'OPEN' : 'CLOSED'}
                  </Badge>
                </div>

                {/* Digital Clock */}
                <div className="mt-3 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-center">
                  <div className="text-2xl font-bold font-mono text-zinc-100 tracking-wider">
                    {mounted ? tzData.timeStr : '00:00:00'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {mounted ? tzData.dateStr : '...'}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 text-xs">
                {/* Progress / Countdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Session Progress</span>
                    <span className="font-mono text-zinc-300">
                      {state.isOpen ? `${state.progress}%` : 'Off-market'}
                    </span>
                  </div>
                  <Progress
                    value={state.isOpen ? state.progress : 0}
                    max={100}
                    className="h-1.5 bg-zinc-800"
                    indicatorClassName="bg-emerald-500"
                  />
                  <div className="text-[11px] font-mono text-emerald-400 font-medium pt-0.5">
                    {state.countdownStr}
                  </div>
                </div>

                {/* Trading Hours Info */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Local Hours:</span>
                    <span className="font-mono text-zinc-300">{session.localHoursStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">IST Timing:</span>
                    <span className="font-mono text-zinc-300">{session.istHoursStr}</span>
                  </div>
                </div>

                {/* Recommended Pairs */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1.5">
                    Primary Assets:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {session.recommendedPairs.map((pair) => (
                      <span
                        key={pair}
                        className="rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 border border-zinc-800"
                      >
                        {pair}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 24-Hour Visual Timeline / Gantt Schedule */}
      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            24-Hour Global Market Overlap Radar
          </CardTitle>
          <CardDescription>
            Live UTC progression across all 4 sessions with overlap markers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time axis header */}
          <div className="relative">
            {/* Hours scale (00:00 to 24:00 UTC) */}
            <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 text-center pb-2 border-b border-zinc-800">
              {['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(
                (h) => (
                  <div key={h}>{h}</div>
                )
              )}
            </div>

            {/* Session Gantt Bars */}
            <div className="relative mt-4 space-y-3">
              {/* Current Time Cursor Line */}
              <div
                className="absolute top-0 bottom-0 z-20 w-0.5 bg-emerald-400 shadow-md shadow-emerald-400/50"
                style={{
                  left: `${(currentUtcDec / 24) * 100}%`,
                }}
              >
                <div className="absolute -top-3.5 -left-8 bg-emerald-500 text-zinc-950 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                  NOW {Math.floor(utcHours).toString().padStart(2, '0')}:{Math.floor(utcMinutes).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Sydney: 21:00 - 06:00 UTC */}
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-zinc-400 shrink-0">Sydney</span>
                <div className="relative h-6 flex-1 rounded bg-zinc-950/80 border border-zinc-800 overflow-hidden">
                  {/* Sydney spans 21:00 to 24:00 and 00:00 to 06:00 */}
                  <div
                    className="absolute top-1 bottom-1 rounded bg-amber-500/30 border border-amber-500/60"
                    style={{ left: '0%', width: `${(6 / 24) * 100}%` }}
                  />
                  <div
                    className="absolute top-1 bottom-1 rounded bg-amber-500/30 border border-amber-500/60"
                    style={{ left: `${(21 / 24) * 100}%`, width: `${(3 / 24) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tokyo: 00:00 - 09:00 UTC */}
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-zinc-400 shrink-0">Tokyo</span>
                <div className="relative h-6 flex-1 rounded bg-zinc-950/80 border border-zinc-800 overflow-hidden">
                  <div
                    className="absolute top-1 bottom-1 rounded bg-purple-500/30 border border-purple-500/60"
                    style={{ left: '0%', width: `${(9 / 24) * 100}%` }}
                  />
                </div>
              </div>

              {/* London: 08:00 - 16:30 UTC */}
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-zinc-400 shrink-0">London</span>
                <div className="relative h-6 flex-1 rounded bg-zinc-950/80 border border-zinc-800 overflow-hidden">
                  <div
                    className="absolute top-1 bottom-1 rounded bg-blue-500/30 border border-blue-500/60"
                    style={{ left: `${(8 / 24) * 100}%`, width: `${(8.5 / 24) * 100}%` }}
                  />
                </div>
              </div>

              {/* New York: 13:00 - 21:00 UTC */}
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-zinc-400 shrink-0">New York</span>
                <div className="relative h-6 flex-1 rounded bg-zinc-950/80 border border-zinc-800 overflow-hidden">
                  <div
                    className="absolute top-1 bottom-1 rounded bg-emerald-500/30 border border-emerald-500/60"
                    style={{ left: `${(13 / 24) * 100}%`, width: `${(8 / 24) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
