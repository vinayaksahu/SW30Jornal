'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, CheckCircle2, Lock } from 'lucide-react';
import { overrideNewsWindow, createAndOverrideNewsWindow } from '@/actions/news';
import { toast } from 'sonner';

interface AdminOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsWindowId?: string;
  newsEventId?: string;
  accountId?: string;
  eventName: string;
  symbolOrCurrency: string;
  windowEnd?: Date | null;
  onSuccess?: () => void;
}

export function AdminOverrideModal({
  isOpen,
  onClose,
  newsWindowId,
  newsEventId,
  accountId,
  eventName,
  symbolOrCurrency,
  windowEnd,
  onSuccess,
}: AdminOverrideModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('A mandatory reason of at least 5 characters is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (newsWindowId) {
        await overrideNewsWindow(newsWindowId, reason);
      } else if (newsEventId && accountId) {
        await createAndOverrideNewsWindow(newsEventId, accountId, reason);
      } else {
        throw new Error('Missing window or event identifier');
      }

      toast.success('News restriction overridden! Audit log recorded.');
      setReason('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to override news restriction');
      toast.error(err.message || 'Failed to override');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Administrator News Override</h3>
              <p className="text-[11px] text-zinc-400">Unlock restricted trading during news window</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning Notice */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-300">Mandatory Audit Log Notice</p>
              <p>
                Overriding this protection will allow trades to be submitted on{' '}
                <span className="font-semibold text-zinc-100 uppercase">{symbolOrCurrency}</span> despite active
                high-impact volatility. This action is permanently logged to the Admin Audit Trail.
              </p>
            </div>
          </div>

          {/* Event Context */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Event:</span>
              <span className="font-medium text-zinc-200">{eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Affected Instrument:</span>
              <span className="font-mono font-semibold text-emerald-400 uppercase">{symbolOrCurrency}</span>
            </div>
            {windowEnd && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Normal Lock Ends:</span>
                <span className="font-mono text-zinc-300">
                  {new Date(windowEnd).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  IST
                </span>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-200 flex justify-between">
              <span>Reason for Override (Required)</span>
              <span className="text-[10px] text-zinc-500">Min 5 chars</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Account challenge already passed, hedge order exception, manual risk approval granted..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 5}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-red-950/20"
            >
              {isSubmitting ? (
                'Recording Override...'
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Confirm & Override Lock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
