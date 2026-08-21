'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sliders, RefreshCw, Save, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NewsImpact, NewsProtectionMode } from '@prisma/client';
import { updateAccountNewsSettings } from '@/actions/news';
import { SYMBOL_MAPPINGS } from '@/lib/services/news-service';
import { CurrencyBadge } from './currency-badge';
import { NewsImpactBadge } from './news-impact-badge';
import { toast } from 'sonner';

interface NewsSettingsTabProps {
  accounts: { id: string; name: string; propFirm: string }[];
  initialAccountId?: string;
  initialSettings: any[];
}

export function NewsSettingsTab({
  accounts,
  initialAccountId,
  initialSettings,
}: NewsSettingsTabProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccountId || accounts[0]?.id || ''
  );

  const [settings, setSettings] = useState<
    Record<
      NewsImpact,
      { beforeMinutes: number; afterMinutes: number; mode: NewsProtectionMode }
    >
  >(() => {
    const map: Record<
      NewsImpact,
      { beforeMinutes: number; afterMinutes: number; mode: NewsProtectionMode }
    > = {
      HIGH: { beforeMinutes: 15, afterMinutes: 15, mode: NewsProtectionMode.PROTECTION },
      MEDIUM: { beforeMinutes: 5, afterMinutes: 5, mode: NewsProtectionMode.WARNING_ONLY },
      LOW: { beforeMinutes: 0, afterMinutes: 0, mode: NewsProtectionMode.DISABLED },
    };

    for (const s of initialSettings) {
      if (s.impactLevel && map[s.impactLevel as NewsImpact]) {
        map[s.impactLevel as NewsImpact] = {
          beforeMinutes: s.beforeMinutes,
          afterMinutes: s.afterMinutes,
          mode: s.mode,
        };
      }
    }

    return map;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');

  const handleModeChange = (impact: NewsImpact, mode: NewsProtectionMode) => {
    setSettings((prev) => ({
      ...prev,
      [impact]: {
        ...prev[impact],
        mode,
      },
    }));
  };

  const handleTimeChange = (
    impact: NewsImpact,
    field: 'beforeMinutes' | 'afterMinutes',
    value: number
  ) => {
    const val = Math.max(0, Math.min(360, isNaN(value) ? 0 : value));
    setSettings((prev) => ({
      ...prev,
      [impact]: {
        ...prev[impact],
        [field]: val,
      },
    }));
  };

  const handleResetDefaults = () => {
    setSettings({
      HIGH: { beforeMinutes: 15, afterMinutes: 15, mode: NewsProtectionMode.PROTECTION },
      MEDIUM: { beforeMinutes: 5, afterMinutes: 5, mode: NewsProtectionMode.WARNING_ONLY },
      LOW: { beforeMinutes: 0, afterMinutes: 0, mode: NewsProtectionMode.DISABLED },
    });
    toast.info('Restored default prop firm protection values');
  };

  const handleSave = async () => {
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    setIsSaving(true);
    try {
      const payload = (['HIGH', 'MEDIUM', 'LOW'] as NewsImpact[]).map((lvl) => ({
        impactLevel: lvl,
        beforeMinutes: settings[lvl].beforeMinutes,
        afterMinutes: settings[lvl].afterMinutes,
        mode: settings[lvl].mode,
      }));

      await updateAccountNewsSettings(selectedAccountId, payload);
      toast.success('News protection settings updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSymbols = SYMBOL_MAPPINGS.filter(
    (m) =>
      m.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      m.displayName.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      m.currencies.some((c) => c.toLowerCase().includes(symbolSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Account Selector and Actions Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-zinc-100">Account News Safeguard Policy</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Define pre-event & post-event blackout windows and enforcement mode for each news tier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.propFirm})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-lg transition-colors shadow-lg shadow-emerald-950/20"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* 3 Impact Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* HIGH IMPACT */}
        <div className="bg-zinc-900/60 border border-red-500/30 rounded-xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-red-500" />
          <div className="flex items-center justify-between">
            <NewsImpactBadge impact="HIGH" showIcon pulse size="md" />
            <span className="text-[11px] font-mono text-zinc-400">Tier 1 Events</span>
          </div>

          <p className="text-xs text-zinc-400">
            e.g. Non-Farm Payrolls (NFP), CPI, FOMC, Fed Rate Decision, ECB/BOE Decisions.
          </p>

          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Enforcement Mode</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
                {(['PROTECTION', 'WARNING_ONLY', 'DISABLED'] as NewsProtectionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange('HIGH', mode)}
                    className={`py-1.5 px-2 rounded font-medium transition-colors ${
                      settings.HIGH.mode === mode
                        ? mode === 'PROTECTION'
                          ? 'bg-red-500 text-white font-bold'
                          : mode === 'WARNING_ONLY'
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-700 text-zinc-100 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode === 'PROTECTION' ? 'Lock' : mode === 'WARNING_ONLY' ? 'Warn' : 'Off'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Before Release</label>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={settings.HIGH.beforeMinutes}
                    onChange={(e) =>
                      handleTimeChange('HIGH', 'beforeMinutes', parseInt(e.target.value))
                    }
                    className="w-full bg-transparent text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">min</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">After Release</label>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={settings.HIGH.afterMinutes}
                    onChange={(e) =>
                      handleTimeChange('HIGH', 'afterMinutes', parseInt(e.target.value))
                    }
                    className="w-full bg-transparent text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MEDIUM IMPACT */}
        <div className="bg-zinc-900/60 border border-amber-500/30 rounded-xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <NewsImpactBadge impact="MEDIUM" showIcon size="md" />
            <span className="text-[11px] font-mono text-zinc-400">Tier 2 Events</span>
          </div>

          <p className="text-xs text-zinc-400">
            e.g. Flash PMIs, Retail Sales, Producer Price Index (PPI), Crude Inventories.
          </p>

          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Enforcement Mode</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
                {(['PROTECTION', 'WARNING_ONLY', 'DISABLED'] as NewsProtectionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange('MEDIUM', mode)}
                    className={`py-1.5 px-2 rounded font-medium transition-colors ${
                      settings.MEDIUM.mode === mode
                        ? mode === 'PROTECTION'
                          ? 'bg-red-500 text-white font-bold'
                          : mode === 'WARNING_ONLY'
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-700 text-zinc-100 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode === 'PROTECTION' ? 'Lock' : mode === 'WARNING_ONLY' ? 'Warn' : 'Off'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Before Release</label>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={settings.MEDIUM.beforeMinutes}
                    onChange={(e) =>
                      handleTimeChange('MEDIUM', 'beforeMinutes', parseInt(e.target.value))
                    }
                    className="w-full bg-transparent text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">min</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">After Release</label>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={settings.MEDIUM.afterMinutes}
                    onChange={(e) =>
                      handleTimeChange('MEDIUM', 'afterMinutes', parseInt(e.target.value))
                    }
                    className="w-full bg-transparent text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOW IMPACT */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-zinc-600" />
          <div className="flex items-center justify-between">
            <NewsImpactBadge impact="LOW" showIcon size="md" />
            <span className="text-[11px] font-mono text-zinc-400">Tier 3 Events</span>
          </div>

          <p className="text-xs text-zinc-400">
            e.g. Minor speeches, trade balance, wholesale inventories, weekly auction results.
          </p>

          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Enforcement Mode</label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
                {(['PROTECTION', 'WARNING_ONLY', 'DISABLED'] as NewsProtectionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange('LOW', mode)}
                    className={`py-1.5 px-2 rounded font-medium transition-colors ${
                      settings.LOW.mode === mode
                        ? mode === 'PROTECTION'
                          ? 'bg-red-500 text-white font-bold'
                          : mode === 'WARNING_ONLY'
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-700 text-zinc-100 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mode === 'PROTECTION' ? 'Lock' : mode === 'WARNING_ONLY' ? 'Warn' : 'Off'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Before Release</label>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={settings.LOW.beforeMinutes}
                    onChange={(e) =>
                      handleTimeChange('LOW', 'beforeMinutes', parseInt(e.target.value))
                    }
                    className="w-full bg-transparent text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">min</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">After Release</label>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={settings.LOW.afterMinutes}
                    onChange={(e) =>
                      handleTimeChange('LOW', 'afterMinutes', parseInt(e.target.value))
                    }
                    className="w-full bg-transparent text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Symbol Currency Mapping Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-zinc-100">
                Instrument & Currency News Association Map
              </h4>
            </div>
            <p className="text-xs text-zinc-400">
              When an economic event is published for a currency, any mapped trading symbol is
              automatically guarded.
            </p>
          </div>

          <input
            type="text"
            placeholder="Filter symbols (e.g. XAU, US30, EUR)..."
            value={symbolSearch}
            onChange={(e) => setSymbolSearch(e.target.value)}
            className="w-full sm:w-64 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800 font-medium">
              <tr>
                <th className="px-5 py-3">Symbol Code</th>
                <th className="px-5 py-3">Instrument Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Triggered Economic Currencies</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredSymbols.map((item) => (
                <tr key={item.symbol} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-zinc-100">{item.symbol}</td>
                  <td className="px-5 py-3.5 text-zinc-300">{item.displayName}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.currencies.map((curr) => (
                        <CurrencyBadge key={curr} country={curr} size="sm" />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Protected
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
