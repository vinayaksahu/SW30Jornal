'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { AlertCircle, AlertTriangle, Clock, ShieldAlert, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { checkTradeNewsStatus } from '@/actions/news';
import { NewsCheckResult } from '@/lib/services/news-service';
import { NewsImpactBadge } from './news-impact-badge';
import { CurrencyBadge } from './currency-badge';
import { AdminOverrideModal } from './admin-override-modal';

interface NewsProtectionBannerProps {
  symbol?: string;
  accountId?: string;
  isAdmin?: boolean;
  className?: string;
  onStatusChange?: (result: NewsCheckResult) => void;
}

export function NewsProtectionBanner({
  symbol = 'USD',
  accountId,
  isAdmin = false,
  className = '',
  onStatusChange,
}: NewsProtectionBannerProps) {
  const [status, setStatus] = useState<NewsCheckResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchStatus = () => {
    startTransition(async () => {
      try {
        const result = await checkTradeNewsStatus(symbol, new Date(), accountId);
        setStatus(result);
        setRemainingSeconds(result.timeRemainingSeconds);
        onStatusChange?.(result);
      } catch {
        // Ignore check error
      }
    });
  };

  // Re-fetch on symbol or account change
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [symbol, accountId]);

  // Second-by-second countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          fetchStatus(); // Re-verify with server when countdown hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  if (!status || status.activeEvents.length === 0) {
    return null;
  }

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const primaryEvent = status.activeEvents[0];
  const isLock = status.mode === 'PROTECTION' && !status.isOverridden;
  const isWarning = status.mode === 'WARNING_ONLY' || status.isOverridden;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl border p-4 shadow-lg transition-all ${
          isLock
            ? 'bg-red-950/40 border-red-500/40 text-red-100 shadow-red-950/20'
            : isWarning && status.isOverridden
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-emerald-950/20'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-100 shadow-amber-950/20'
        } ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left info */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isLock
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : status.isOverridden
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isLock ? (
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              ) : status.isOverridden ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isLock
                    ? '🔴 News Protection Window Active — Trading Prohibited'
                    : status.isOverridden
                    ? '🟢 News Protection Window Overridden by Admin'
                    : '🟡 High Volatility News Warning Window Active'}
                </span>
                {status.impact && <NewsImpactBadge impact={status.impact} pulse size="sm" />}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-zinc-100">{primaryEvent?.title}</span>
                <span className="text-zinc-400">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400">Currencies:</span>
                  {status.affectedCurrencies.map((c) => (
                    <CurrencyBadge key={c} country={c} size="sm" />
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-zinc-300">
                {isLock
                  ? `Prop firm rules prohibit opening or closing positions on ${symbol} during this release.`
                  : status.isOverridden
                  ? `Trading on ${symbol} is currently unlocked under administrator authorization.`
                  : `Caution: Major market release is underway. Expect slippage and spread expansion.`}
              </p>
            </div>
          </div>

          {/* Right Timer & Actions */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {remainingSeconds > 0 && !status.isOverridden && (
              <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-lg font-mono">
                <Clock className="h-4 w-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 uppercase leading-none">Lock Ends In</div>
                  <div className="text-sm font-bold text-zinc-100 tracking-wider">
                    {formatCountdown(remainingSeconds)}
                  </div>
                </div>
              </div>
            )}

            {isAdmin && !status.isOverridden && (
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow"
              >
                Admin Override
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Override Modal */}
      {isAdmin && (
        <AdminOverrideModal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          newsWindowId={status.newsWindowId}
          newsEventId={primaryEvent?.id}
          accountId={accountId}
          eventName={primaryEvent?.title || 'Economic News Window'}
          symbolOrCurrency={symbol}
          windowEnd={status.windowEnd}
          onSuccess={fetchStatus}
        />
      )}
    </>
  );
}
