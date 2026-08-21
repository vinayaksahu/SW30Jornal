'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Image as ImageIcon,
  ExternalLink,
  Save,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { createTrade } from '@/actions/trades';
import { toast } from 'sonner';
import { NewsProtectionBanner } from '@/components/news/news-protection-banner';

interface TradeUploadWizardProps {
  accounts: { id: string; name: string }[];
  strategies: { id: string; name: string }[];
}

export function TradeUploadWizard({ accounts, strategies }: TradeUploadWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // MT5 Evidence
  const [mt5File, setMt5File] = React.useState<File | null>(null);
  const [mt5Preview, setMt5Preview] = React.useState<string | null>(null);
  const [mt5StorageUrl, setMt5StorageUrl] = React.useState<string | null>(null);

  // Extracted trade data
  const [formData, setFormData] = React.useState({
    accountId: accounts[0]?.id || '',
    strategyId: '',
    symbol: 'XAUUSD',
    direction: 'BUY' as 'BUY' | 'SELL',
    volume: 1.0,
    entryPrice: 2350.5,
    exitPrice: 2362.0,
    stopLoss: 2345.0,
    takeProfit: 2365.0,
    profitLoss: 1150.0,
    commission: 0,
    swap: 0,
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: new Date().toISOString().slice(0, 16),
    ticketNumber: '',
    tradingviewUrl: '',
    notes: '',
  });

  const [uncertainFields, setUncertainFields] = React.useState<string[]>([]);

  // Unlimited TradingView Screenshots
  const [chartEvidence, setChartEvidence] = React.useState<
    {
      storageUrl: string;
      originalFilename: string;
      fileSize: number;
      mimeType: string;
      caption?: string;
      notes?: string;
    }[]
  >([]);

  const handleMt5Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMt5File(file);
    setMt5Preview(URL.createObjectURL(file));
    setIsExtracting(true);

    try {
      // 1. Upload to storage
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadRes.json();
      setMt5StorageUrl(uploadResult.url);

      // 2. Run OCR extraction
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: uploadResult.url }),
      });

      if (ocrRes.ok) {
        const ocrData = await ocrRes.json();
        setFormData((prev) => ({
          ...prev,
          symbol: ocrData.symbol || prev.symbol,
          direction: (ocrData.direction as 'BUY' | 'SELL') || prev.direction,
          volume: ocrData.volume ?? prev.volume,
          entryPrice: ocrData.entryPrice ?? prev.entryPrice,
          exitPrice: ocrData.exitPrice ?? prev.exitPrice,
          stopLoss: ocrData.stopLoss ?? prev.stopLoss,
          takeProfit: ocrData.takeProfit ?? prev.takeProfit,
          profitLoss: ocrData.profitLoss ?? prev.profitLoss,
          commission: ocrData.commission ?? prev.commission,
          swap: ocrData.swap ?? prev.swap,
          ticketNumber: ocrData.ticketNumber || prev.ticketNumber,
          entryTime: ocrData.entryTime ? ocrData.entryTime.slice(0, 16) : prev.entryTime,
          exitTime: ocrData.exitTime ? ocrData.exitTime.slice(0, 16) : prev.exitTime,
        }));
        setUncertainFields(ocrData.uncertainFields || []);
        toast.success('MT5 Trade details extracted!');
      }
    } catch {
      toast.error('Could not auto-extract fields. Please verify manually.');
    } finally {
      setIsExtracting(false);
      setStep(2);
    }
  };

  const handleAddChartScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        if (res.ok) {
          const result = await res.json();
          setChartEvidence((prev) => [
            ...prev,
            {
              storageUrl: result.url,
              originalFilename: result.originalFilename,
              fileSize: result.fileSize,
              mimeType: result.mimeType,
              caption: '',
              notes: '',
            },
          ]);
          toast.success(`Uploaded ${file.name}`);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleRemoveChartEvidence = (index: number) => {
    setChartEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) {
      toast.error('Please select an account');
      return;
    }

    setIsSaving(true);
    try {
      const entryD = new Date(formData.entryTime);
      const exitD = formData.exitTime ? new Date(formData.exitTime) : undefined;
      const durationSeconds =
        exitD && entryD ? Math.max(0, Math.floor((exitD.getTime() - entryD.getTime()) / 1000)) : undefined;

      const tradeData = {
        accountId: formData.accountId,
        strategyId: formData.strategyId || undefined,
        symbol: formData.symbol.toUpperCase(),
        direction: formData.direction,
        volume: Number(formData.volume),
        entryPrice: Number(formData.entryPrice),
        exitPrice: formData.exitPrice ? Number(formData.exitPrice) : undefined,
        stopLoss: formData.stopLoss ? Number(formData.stopLoss) : undefined,
        takeProfit: formData.takeProfit ? Number(formData.takeProfit) : undefined,
        profitLoss: formData.profitLoss ? Number(formData.profitLoss) : undefined,
        commission: Number(formData.commission),
        swap: Number(formData.swap),
        entryTime: entryD,
        exitTime: exitD,
        durationSeconds,
        ticketNumber: formData.ticketNumber || undefined,
        tradingviewUrl: formData.tradingviewUrl || undefined,
        notes: formData.notes || undefined,
        mt5Evidence: mt5StorageUrl
          ? [
              {
                storageUrl: mt5StorageUrl,
                originalFilename: mt5File?.name || 'mt5_screenshot.png',
                fileSize: mt5File?.size || 0,
                mimeType: mt5File?.type || 'image/png',
              },
            ]
          : undefined,
        chartEvidence: chartEvidence.map((ce, idx) => ({
          ...ce,
          displayOrder: idx,
        })),
      };

      const result = await createTrade(tradeData);
      toast.success('Trade logged successfully! Rules and news checked.');
      router.push(`/trades/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save trade');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Wizard Step Navigator */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/40">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`text-xs font-semibold flex items-center gap-2 ${
              step === 1 ? 'text-emerald-400' : 'text-zinc-500'
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                step === 1 ? 'bg-emerald-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              1
            </span>
            MT5 OCR Upload
          </button>

          <span className="text-zinc-700">/</span>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`text-xs font-semibold flex items-center gap-2 ${
              step === 2 ? 'text-emerald-400' : 'text-zinc-500'
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                step === 2 ? 'bg-emerald-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              2
            </span>
            Execution Data
          </button>

          <span className="text-zinc-700">/</span>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`text-xs font-semibold flex items-center gap-2 ${
              step === 3 ? 'text-emerald-400' : 'text-zinc-500'
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                step === 3 ? 'bg-emerald-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              3
            </span>
            TradingView Evidence
          </button>
        </div>
      </div>

      {/* Step Contents */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Dynamic News Protection Alert Banner for the symbol & account */}
        <NewsProtectionBanner
          symbol={formData.symbol || 'USD'}
          accountId={formData.accountId}
        />

        {/* STEP 1: Upload MT5 Screenshot */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-xl p-8 text-center transition-colors bg-zinc-950/40">
              <input
                type="file"
                id="mt5File"
                accept="image/*"
                onChange={handleMt5Upload}
                className="hidden"
              />
              <label htmlFor="mt5File" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    Upload MT5 Trade or History Screenshot
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Auto-extracts symbol, direction, lots, prices, time, and P/L in milliseconds.
                  </p>
                </div>
                <span className="px-4 py-2 text-xs font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors">
                  {isExtracting ? 'Extracting trade data...' : 'Browse Screenshot'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500">Or skip screenshot extraction:</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
              >
                Manual Entry <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Execution Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Execution Data</h3>
              </div>
              {uncertainFields.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {uncertainFields.length} field(s) require review
                </span>
              )}
            </div>

            {/* Account & Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Account (Required)</label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Strategy (Optional)</label>
                <select
                  value={formData.strategyId}
                  onChange={(e) => setFormData({ ...formData, strategyId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">None / Discretionary</option>
                  {strategies.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Symbol, Direction, Lots */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Symbol</span>
                  {uncertainFields.includes('symbol') && (
                    <span className="text-[10px] text-amber-400">Review</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Type</label>
                <select
                  value={formData.direction}
                  onChange={(e) =>
                    setFormData({ ...formData, direction: e.target.value as 'BUY' | 'SELL' })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Volume (Lots)</span>
                  {uncertainFields.includes('volume') && (
                    <span className="text-[10px] text-amber-400">Review</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.entryPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, entryPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  value={formData.exitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, exitPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={formData.stopLoss}
                  onChange={(e) =>
                    setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  value={formData.takeProfit}
                  onChange={(e) =>
                    setFormData({ ...formData, takeProfit: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>
            </div>

            {/* P/L & Costs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Profit / Loss ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.profitLoss}
                  onChange={(e) =>
                    setFormData({ ...formData, profitLoss: parseFloat(e.target.value) || 0 })
                  }
                  className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold ${
                    formData.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Commission ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.commission}
                  onChange={(e) =>
                    setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Swap ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.swap}
                  onChange={(e) => setFormData({ ...formData, swap: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono"
                />
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Entry Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.entryTime}
                  onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Exit Time</label>
                <input
                  type="datetime-local"
                  value={formData.exitTime}
                  onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-lg bg-zinc-800"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg"
              >
                Next: TradingView Evidence →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TradingView Evidence & Notes */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>TradingView Chart Link (Optional)</span>
                {formData.tradingviewUrl && (
                  <a
                    href={formData.tradingviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Open Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                placeholder="https://www.tradingview.com/x/..."
                value={formData.tradingviewUrl}
                onChange={(e) => setFormData({ ...formData, tradingviewUrl: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            {/* Unlimited TradingView Screenshots Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  TradingView Chart Screenshots (Unlimited)
                </label>
                <label
                  htmlFor="tvScreenshots"
                  className="px-3 py-1.5 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  Add Screenshot(s)
                </label>
                <input
                  type="file"
                  id="tvScreenshots"
                  multiple
                  accept="image/*"
                  onChange={handleAddChartScreenshot}
                  className="hidden"
                />
              </div>

              {chartEvidence.length === 0 ? (
                <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-950/40 text-center text-xs text-zinc-500">
                  No TradingView chart screenshots added yet. Upload before/after analysis images.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {chartEvidence.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg"
                    >
                      <img
                        src={item.storageUrl}
                        alt="Chart preview"
                        className="h-14 w-20 object-cover rounded bg-zinc-900"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {item.originalFilename}
                        </p>
                        <input
                          type="text"
                          placeholder="Caption / Notes (e.g. 15m Liquidity Sweep)"
                          value={item.caption || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChartEvidence((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, caption: val } : c))
                            );
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChartEvidence(idx)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Trade Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Trade Notes / Execution Mindset</label>
              <textarea
                rows={3}
                placeholder="What was the entry trigger? Did you follow your risk plan? Any emotional impulses?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-lg bg-zinc-800"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors shadow-lg shadow-emerald-950/20 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Checking Rules & Saving...' : 'Save & Log Trade'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
