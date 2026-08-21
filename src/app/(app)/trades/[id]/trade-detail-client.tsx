'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Radio,
  FileImage,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { deleteTrade, addTradeEvidence, deleteTradeEvidence } from '@/actions/trades';
import { toast } from 'sonner';

function formatDuration(seconds: number | null) {
  if (!seconds) return '-';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatISTDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function TradeDetailClient({ trade }: { trade: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'info' | 'evidence' | 'rules'>('info');
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [isUploadingMore, setIsUploadingMore] = React.useState(false);

  const pl = trade.profitLoss ?? 0;
  const isProfit = pl > 0;
  const isLoss = pl < 0;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    try {
      await deleteTrade(trade.id);
      toast.success('Trade deleted');
      router.push('/trades');
    } catch {
      toast.error('Failed to delete trade');
    }
  };

  const handleUploadExtraEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMore(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const result = await uploadRes.json();
          await addTradeEvidence(trade.id, {
            storageUrl: result.url,
            originalFilename: result.originalFilename,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            caption: 'Additional Chart Evidence',
            displayOrder: (trade.chartEvidence?.length || 0) + i,
          });
        }
      }
      toast.success('Added new chart screenshot(s)');
      router.refresh();
    } catch {
      toast.error('Failed to upload screenshot');
    } finally {
      setIsUploadingMore(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm('Delete this chart screenshot?')) return;
    try {
      await deleteTradeEvidence(evidenceId);
      toast.success('Screenshot deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete screenshot');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/trades"
          className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Trade Log
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Trade
          </button>
        </div>
      </div>

      {/* Trade Hero Card */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                trade.direction === 'BUY'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {trade.direction}
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
                  {trade.symbol}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                  {trade.account?.name || 'Account'}
                </span>
                {trade.strategy?.name && (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {trade.strategy.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Executed: {formatISTDate(trade.entryTime)} IST
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-zinc-500 font-medium">Net Profit / Loss</span>
            <p
              className={`text-3xl font-extrabold font-mono ${
                isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-zinc-300'
              }`}
            >
              {isProfit ? '+' : ''}
              {trade.profitLoss !== null ? `$${trade.profitLoss.toLocaleString()}` : '-'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'info'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Execution Metrics
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileImage className="h-3.5 w-3.5" />
            Evidence & Charts (
            {(trade.mt5Evidence?.length || 0) + (trade.chartEvidence?.length || 0)})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Rule Compliance ({trade.ruleViolations?.length || 0})
          </button>
        </div>
      </div>

      {/* TAB 1: Execution Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Metrics Grid */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">
              Order Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500">Ticket #</span>
                <p className="font-mono font-medium text-zinc-200 mt-0.5">
                  {trade.ticketNumber || '-'}
                </p>
              </div>

              <div>
                <span className="text-zinc-500">Volume (Lots)</span>
                <p className="font-mono font-medium text-zinc-200 mt-0.5">{trade.volume}</p>
              </div>

              <div>
                <span className="text-zinc-500">Entry Price</span>
                <p className="font-mono font-semibold text-zinc-100 mt-0.5">{trade.entryPrice}</p>
              </div>

              <div>
                <span className="text-zinc-500">Exit Price</span>
                <p className="font-mono font-semibold text-zinc-100 mt-0.5">
                  {trade.exitPrice || '-'}
                </p>
              </div>

              <div>
                <span className="text-zinc-500">Stop Loss</span>
                <p className="font-mono text-zinc-300 mt-0.5">{trade.stopLoss || '-'}</p>
              </div>

              <div>
                <span className="text-zinc-500">Take Profit</span>
                <p className="font-mono text-zinc-300 mt-0.5">{trade.takeProfit || '-'}</p>
              </div>

              <div>
                <span className="text-zinc-500">Risk-to-Reward (RR)</span>
                <p className="font-mono text-zinc-300 mt-0.5">
                  {trade.rrRatio ? `1:${trade.rrRatio}` : '-'}
                </p>
              </div>

              <div>
                <span className="text-zinc-500">Trade Duration</span>
                <p className="text-zinc-300 mt-0.5">{formatDuration(trade.durationSeconds)}</p>
              </div>

              <div>
                <span className="text-zinc-500">Commission</span>
                <p className="font-mono text-zinc-400 mt-0.5">${trade.commission || 0}</p>
              </div>

              <div>
                <span className="text-zinc-500">Swap</span>
                <p className="font-mono text-zinc-400 mt-0.5">${trade.swap || 0}</p>
              </div>
            </div>
          </div>

          {/* Context & Notes */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">
                Trading Context & Notes
              </h3>

              {trade.tradingviewUrl && (
                <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-zinc-400">TradingView Chart Link</span>
                  <a
                    href={trade.tradingviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Open Live Chart <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="mt-4">
                <span className="text-xs text-zinc-500 font-medium">Notes:</span>
                <p className="text-xs text-zinc-300 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 mt-1 whitespace-pre-wrap">
                  {trade.notes || 'No notes added for this trade.'}
                </p>
              </div>
            </div>

            {/* News Protection Info */}
            <div className="mt-4 p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-3">
              <Radio className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-zinc-200">News Protection Engine</span>
                <p className="text-zinc-400 mt-0.5">
                  {trade.newsStatus === 'RESTRICTED'
                    ? 'Trade executed during an active high-impact news window.'
                    : 'Trade was executed outside restricted high-impact news windows.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Evidence & Unlimited Charts */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          {/* MT5 Execution Screenshot */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">MT5 Execution Screenshot</h3>
              <span className="text-xs text-zinc-500">
                {trade.mt5Evidence?.length || 0} file(s) attached
              </span>
            </div>

            {trade.mt5Evidence && trade.mt5Evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trade.mt5Evidence.map((item: any) => (
                  <div
                    key={item.id}
                    className="relative group bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden"
                  >
                    <img
                      src={item.storageUrl}
                      alt="MT5 Screenshot"
                      className="w-full h-48 object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                      onClick={() => setLightboxImage(item.storageUrl)}
                    />
                    <div className="p-3 flex items-center justify-between text-xs text-zinc-400">
                      <span className="truncate">{item.originalFilename}</span>
                      <button
                        onClick={() => setLightboxImage(item.storageUrl)}
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-zinc-800 rounded-xl bg-zinc-950/40 text-center text-xs text-zinc-500">
                No MT5 screenshot was uploaded during trade creation.
              </div>
            )}
          </div>

          {/* TradingView Chart Evidence Gallery (Unlimited) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  TradingView Chart Gallery (Unlimited Screenshots)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pre-trade setup, in-trade management, and post-trade review charts.
                </p>
              </div>

              <div>
                <label
                  htmlFor="extraEvidence"
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isUploadingMore ? 'Uploading...' : 'Add Screenshot'}
                </label>
                <input
                  type="file"
                  id="extraEvidence"
                  multiple
                  accept="image/*"
                  onChange={handleUploadExtraEvidence}
                  className="hidden"
                />
              </div>
            </div>

            {trade.chartEvidence && trade.chartEvidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trade.chartEvidence.map((item: any) => (
                  <div
                    key={item.id}
                    className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative group">
                      <img
                        src={item.storageUrl}
                        alt="Chart Evidence"
                        className="w-full h-44 object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImage(item.storageUrl)}
                      />
                      <button
                        onClick={() => setLightboxImage(item.storageUrl)}
                        className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-3 border-t border-zinc-850 flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <p className="font-medium text-zinc-200 truncate">
                          {item.caption || item.originalFilename}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {formatISTDate(item.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteEvidence(item.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                        title="Delete screenshot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-zinc-800 rounded-xl bg-zinc-950/40 text-center text-xs text-zinc-500">
                No TradingView chart screenshots attached yet. Click &quot;Add Screenshot&quot; above to attach analysis images anytime.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Rule Compliance */}
      {activeTab === 'rules' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Rule Violations & Audit</h3>
            <span className="text-xs text-zinc-400">
              Evaluated by Prop Firm Rule Engine
            </span>
          </div>

          {trade.ruleViolations && trade.ruleViolations.length > 0 ? (
            <div className="space-y-3">
              {trade.ruleViolations.map((rv: any) => (
                <div
                  key={rv.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                    rv.status === 'VIOLATED'
                      ? 'bg-red-500/10 border-red-500/30'
                      : rv.status === 'WARNING'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rv.status === 'VIOLATED' ? (
                      <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    ) : rv.status === 'WARNING' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">
                        {rv.rule?.name || 'Trading Rule'}
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5">{rv.message}</p>
                      {(rv.actualValue || rv.expectedValue) && (
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2 font-mono">
                          {rv.actualValue && <span>Actual: {rv.actualValue}</span>}
                          {rv.expectedValue && <span>Limit: {rv.expectedValue}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      rv.status === 'VIOLATED'
                        ? 'bg-red-500 text-white'
                        : rv.status === 'WARNING'
                        ? 'bg-amber-500 text-black'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {rv.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-zinc-800 rounded-xl bg-zinc-950/40 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> 100% Compliant — No rule violations detected for this execution.
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-zinc-300 hover:text-white p-1"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Lightbox view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-zinc-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
