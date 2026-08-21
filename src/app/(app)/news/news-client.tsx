'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Newspaper,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Sliders,
  ShieldAlert,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { NewsItem } from '@/lib/services/news-service';
import { syncNewsEvents, importNewsFromJson, syncDirectFeedUrl } from '@/actions/news';
import { CurrencyBadge } from '@/components/news/currency-badge';
import { NewsImpactBadge } from '@/components/news/news-impact-badge';
import { NewsProtectionBanner } from '@/components/news/news-protection-banner';
import { NewsSettingsTab } from '@/components/news/news-settings-tab';
import { toast } from 'sonner';

interface NewsClientProps {
  initialNews: NewsItem[];
  accounts: any[];
  activeAccountId?: string;
  initialSettings: any[];
  userRole?: string;
}

export default function NewsClient({
  initialNews,
  accounts,
  activeAccountId,
  initialSettings,
  userRole = 'USER',
}: NewsClientProps) {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'SETTINGS'>('CALENDAR');
  const [newsList, setNewsList] = useState<NewsItem[]>(initialNews);
  const [isSyncing, startSync] = useTransition();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, startImport] = useTransition();

  // Filters
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'NEXT_WEEK' | 'ALL'>('THIS_WEEK');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Live IST Clock
  const [currentTimeIST, setCurrentTimeIST] = useState<string>('');
  const [currentDateIST, setCurrentDateIST] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeIST(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDateIST(
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncNews = () => {
    startSync(async () => {
      try {
        const res = await syncNewsEvents();
        toast.success(`Economic news synchronized! (${res.count} events updated)`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to sync news events');
      }
    });
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) {
      toast.error('Please paste valid JSON news data');
      return;
    }
    startImport(async () => {
      const res = await importNewsFromJson(jsonInput);
      if (res.success) {
        toast.success(`Successfully imported ${res.count} economic news events!`);
        setIsJsonModalOpen(false);
        setJsonInput('');
      } else {
        toast.error(res.error || 'Failed to import JSON data');
      }
    });
  };

  // Direct Forex Factory & Multi-Source Card State & Handlers
  const [activeFeedUrl, setActiveFeedUrl] = useState('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
  const [selectedSourceName, setSelectedSourceName] = useState('ForexFactory');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [inlineJsonInput, setInlineJsonInput] = useState('');
  const [isDirectSyncing, startDirectSync] = useTransition();

  const handleDirectSync = (url: string, sourceName: string) => {
    setActiveFeedUrl(url);
    setSelectedSourceName(sourceName);
    setSyncErrorMessage(null);

    startDirectSync(async () => {
      const res = await syncDirectFeedUrl(url, sourceName);
      if (res.success && 'count' in res) {
        toast.success(`Successfully synced ${sourceName} calendar (${res.count} events updated)!`);
        setSyncErrorMessage(null);
      } else {
        setSyncErrorMessage('error' in res ? res.error : 'Failed to fetch news feed.');
      }
    });
  };

  const handleInlineImport = () => {
    if (!inlineJsonInput.trim()) {
      toast.error('Please paste JSON text into the box');
      return;
    }
    startImport(async () => {
      const res = await importNewsFromJson(inlineJsonInput);
      if (res.success) {
        toast.success(`Successfully imported ${res.count} events!`);
        setInlineJsonInput('');
        setSyncErrorMessage(null);
      } else {
        toast.error(res.error || 'Failed to import JSON data');
      }
    });
  };

  // Filter Logic
  const filteredEvents = useMemo(() => {
    const now = new Date();

    // Get today start and end in IST
    // Helper to get IST day bounds
    const getISTBounds = (dayOffset: number) => {
      const d = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };

    // Calculate this week start (Monday) and end (Sunday)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    startOfNextWeek.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    return newsList.filter((item) => {
      const eventD = new Date(item.time);

      // 1. Impact filter
      if (impactFilter !== 'ALL' && item.impact !== impactFilter) {
        return false;
      }

      // 2. Currency filter
      if (currencyFilter !== 'ALL' && item.country.toUpperCase() !== currencyFilter.toUpperCase()) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCountry = item.country.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCountry) return false;
      }

      // 4. Date filter
      if (dateFilter === 'TODAY') {
        const { start, end } = getISTBounds(0);
        return eventD >= start && eventD <= end;
      }
      if (dateFilter === 'TOMORROW') {
        const { start, end } = getISTBounds(1);
        return eventD >= start && eventD <= end;
      }
      if (dateFilter === 'THIS_WEEK') {
        return eventD >= startOfWeek && eventD <= endOfWeek;
      }
      if (dateFilter === 'NEXT_WEEK') {
        return eventD >= startOfNextWeek && eventD <= endOfNextWeek;
      }

      return true;
    });
  }, [newsList, impactFilter, dateFilter, currencyFilter, searchQuery]);

  // Format IST time
  const formatEventTimeIST = (time: Date) => {
    const d = new Date(time);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatEventDateIST = (time: Date) => {
    const d = new Date(time);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventRelativeStatus = (time: Date) => {
    const now = new Date().getTime();
    const eventMs = new Date(time).getTime();
    const diffMins = Math.round((eventMs - now) / (60 * 1000));

    if (diffMins < -60) return { label: 'Passed', color: 'text-zinc-500' };
    if (diffMins >= -60 && diffMins <= 0)
      return { label: `Released ${Math.abs(diffMins)}m ago`, color: 'text-amber-400 font-semibold' };
    if (diffMins > 0 && diffMins <= 60)
      return { label: `In ${diffMins} min`, color: 'text-red-400 font-bold animate-pulse' };
    if (diffMins > 60 && diffMins <= 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return { label: `In ${hours}h ${diffMins % 60}m`, color: 'text-zinc-300' };
    }
    return { label: 'Upcoming', color: 'text-zinc-400' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Live Time in IST */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">Economic News Center</h1>
              <p className="text-xs text-zinc-400">
                Institutional Prop Firm High-Impact Blackout & Volatility Safeguard
              </p>
            </div>
          </div>
        </div>

        {/* Live IST Clock & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-lg font-mono">
            <Clock className="h-4 w-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                IST (Asia/Kolkata · UTC+05:30)
              </div>
              <div className="text-xs font-bold text-zinc-100">
                {currentDateIST} <span className="text-emerald-400">{currentTimeIST}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncNews}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors border border-zinc-700 shadow"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Live Feed'}
          </button>

          <button
            type="button"
            onClick={() => setIsJsonModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800 rounded-lg transition-colors shadow"
          >
            <Newspaper className="h-3.5 w-3.5 text-emerald-400" />
            Manual JSON Sync
          </button>
        </div>
      </div>

      {/* Manual JSON Sync Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-emerald-400" />
                  Manual JSON Economic News Sync
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Paste JSON feed data from ForexFactory, Investing.com, DailyFX, FXStreet, or custom sources.
                </p>
              </div>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Paste JSON Data below:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setJsonInput(
                        JSON.stringify(
                          [
                            {
                              title: 'USD Non-Farm Employment Change (NFP)',
                              country: 'USD',
                              date: new Date().toISOString(),
                              impact: 'High',
                              forecast: '180K',
                              previous: '206K',
                            },
                            {
                              title: 'EUR Consumer Price Index (CPI)',
                              country: 'EUR',
                              date: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
                              impact: 'High',
                              forecast: '2.6%',
                              previous: '2.5%',
                            },
                          ],
                          null,
                          2
                        )
                      )
                    }
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-2 py-0.5 rounded border border-zinc-700"
                  >
                    Load Sample ForexFactory JSON
                  </button>
                </div>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"title":"USD NFP","country":"USD","date":"2026-08-21T12:30:00Z","impact":"High"}]'
                rows={10}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-3">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                disabled={isImporting || !jsonInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors shadow"
              >
                {isImporting ? 'Importing Events...' : 'Import JSON News Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Forex Factory & Multi-Source Auto-Sync Card (Matching user screenshot) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber-400" />
            Forex Factory Auto-Sync & Multi-Source JSON
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">
            Active Source: <strong className="text-amber-400">{selectedSourceName}</strong>
          </span>
        </div>

        {/* Dedicated Primary Sync Action Buttons for all Major News Portals */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleDirectSync('https://nfs.faireconomy.media/ff_calendar_thisweek.json', 'ForexFactory')}
            disabled={isDirectSyncing}
            className="flex-1 min-w-[180px] py-2.5 px-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-950/40 flex items-center justify-center gap-1.5 border border-amber-400/40 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDirectSyncing && selectedSourceName === 'ForexFactory' ? 'animate-spin' : ''}`} />
            Forex Factory (This Week)
          </button>

          <button
            type="button"
            onClick={() => handleDirectSync('https://nfs.faireconomy.media/ff_calendar_nextweek.json', 'ForexFactory')}
            disabled={isDirectSyncing}
            className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors"
          >
            📅 + Next Week
          </button>

          <button
            type="button"
            onClick={() => handleDirectSync('https://api.investing.com/economic-calendar/events', 'Investing.com')}
            disabled={isDirectSyncing}
            className="px-3.5 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-semibold text-xs rounded-lg border border-emerald-800/60 flex items-center gap-1.5 transition-colors"
          >
            📊 Investing.com
          </button>

          <button
            type="button"
            onClick={() => handleDirectSync('https://www.dailyfx.com/economic-calendar/events', 'DailyFX')}
            disabled={isDirectSyncing}
            className="px-3.5 py-2.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-semibold text-xs rounded-lg border border-purple-800/60 flex items-center gap-1.5 transition-colors"
          >
            📈 DailyFX
          </button>

          <button
            type="button"
            onClick={() => handleDirectSync('https://calendar-api.fxstreet.com/en/api/v1/eventDates', 'FXStreet')}
            disabled={isDirectSyncing}
            className="px-3.5 py-2.5 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 font-semibold text-xs rounded-lg border border-blue-800/60 flex items-center gap-1.5 transition-colors"
          >
            🏷️ FXStreet
          </button>
        </div>

        {/* Display Sync Error Box if network fetch fails (Matching user uploaded screenshot) */}
        {syncErrorMessage && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
              <span>✕</span> {syncErrorMessage}
            </div>
            <p className="text-[11px] text-zinc-400">
              This is typically caused by browser CORS security restrictions when loading the feed, or public API rate-limiting.
            </p>

            {/* Manual Sync Fallback (100% Works) Section */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                💡 Manual Sync Fallback (100% Works):
              </div>
              <ol className="list-decimal list-inside text-zinc-300 space-y-1.5 text-[11px] leading-relaxed">
                <li>
                  Open the JSON feed link in a new tab:{' '}
                  <a
                    href={activeFeedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline font-mono font-semibold"
                  >
                    Open {selectedSourceName} Calendar JSON ↗
                  </a>
                </li>
                <li>Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono">Ctrl + A</kbd> then <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono">Ctrl + C</kbd> on that page to copy the entire JSON text.</li>
                <li>Paste it into the text box below and click the <strong>Import Data</strong> button.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Manual JSON Paste Input Box */}
        <div className="space-y-2 pt-2 border-t border-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">Paste JSON text here (Forex Factory, Investing.com, DailyFX, FXStreet, Myfxbook):</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setInlineJsonInput(
                    JSON.stringify(
                      [
                        {
                          title: 'USD Non-Farm Employment Change (NFP)',
                          country: 'USD',
                          date: new Date().toISOString(),
                          impact: 'High',
                          forecast: '180K',
                          previous: '206K',
                        },
                        {
                          title: 'EUR Consumer Price Index (CPI)',
                          country: 'EUR',
                          date: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
                          impact: 'High',
                          forecast: '2.6%',
                          previous: '2.5%',
                        },
                      ],
                      null,
                      2
                    )
                  )
                }
                className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-mono"
              >
                + ForexFactory Sample
              </button>

              <button
                type="button"
                onClick={() =>
                  setInlineJsonInput(
                    JSON.stringify(
                      [
                        {
                          event: 'GBP Interest Rate Decision',
                          currency: 'GBP',
                          date: new Date().toISOString(),
                          importance: 'high',
                          forecast: '5.00%',
                          previous: '5.25%',
                        },
                        {
                          event: 'USD ISM Manufacturing PMI',
                          currency: 'USD',
                          date: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
                          importance: 'high',
                          forecast: '49.0',
                          previous: '48.5',
                        },
                      ],
                      null,
                      2
                    )
                  )
                }
                className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono"
              >
                + Investing.com Sample
              </button>

              <button
                type="button"
                onClick={() =>
                  setInlineJsonInput(
                    JSON.stringify(
                      [
                        {
                          name: 'USD Federal Reserve Rate Decision',
                          currencyCode: 'USD',
                          dateUtc: new Date().toISOString(),
                          volatility: 'volatility_high',
                          forecast: '5.50%',
                          previous: '5.50%',
                        },
                      ],
                      null,
                      2
                    )
                  )
                }
                className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-mono"
              >
                + FXStreet Sample
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <textarea
              value={inlineJsonInput}
              onChange={(e) => setInlineJsonInput(e.target.value)}
              placeholder='Paste JSON text here (e.g. [{ "title": "USD NFP", "country": "USD", "date": "2026-08-21T12:30:00Z", "impact": "High" }])'
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleInlineImport}
              disabled={isImporting || !inlineJsonInput.trim()}
              className="py-3 px-6 text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 rounded-lg transition-colors shadow-lg shadow-amber-950/30 whitespace-nowrap flex sm:flex-col items-center justify-center gap-1.5"
            >
              <Newspaper className="h-4 w-4" />
              Import Data
            </button>
          </div>
        </div>
      </div>

      {/* Live News Protection Window Active Banner */}
      <NewsProtectionBanner
        symbol="USD"
        accountId={activeAccountId || accounts[0]?.id}
        isAdmin={userRole === 'ADMIN'}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('CALENDAR')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'CALENDAR'
              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Economic Calendar ({filteredEvents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'SETTINGS'
              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Protection Rules & Symbol Mapping
        </button>
      </div>

      {/* TAB 1: CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3 shadow-md">
            {/* Top row: Date quick buttons & Impact filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Date Filters */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {(
                  [
                    { id: 'TODAY', label: 'Today' },
                    { id: 'TOMORROW', label: 'Tomorrow' },
                    { id: 'THIS_WEEK', label: 'This Week' },
                    { id: 'NEXT_WEEK', label: 'Next Week' },
                    { id: 'ALL', label: 'All Dates' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDateFilter(d.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      dateFilter === d.id
                        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Impact Filters */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setImpactFilter('ALL')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    impactFilter === 'ALL'
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Impacts
                </button>
                <button
                  type="button"
                  onClick={() => setImpactFilter('HIGH')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    impactFilter === 'HIGH'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-zinc-400 hover:text-red-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  High Impact Only
                </button>
                <button
                  type="button"
                  onClick={() => setImpactFilter('MEDIUM')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    impactFilter === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-amber-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setImpactFilter('LOW')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    impactFilter === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-emerald-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Low
                </button>
              </div>
            </div>

            {/* Bottom row: Currency pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
              {/* Currency Badges Quick Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'NZD', 'CHF', 'XAU'].map(
                  (curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrencyFilter(curr)}
                      className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors whitespace-nowrap ${
                        currencyFilter === curr
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {curr === 'ALL' ? '🌐 All Currencies' : curr}
                    </button>
                  )
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search events or currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Calendar Table Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-2">
                <Newspaper className="h-10 w-10 mx-auto text-zinc-600 mb-2" />
                <h4 className="text-sm font-semibold text-zinc-300">No economic events match filters</h4>
                <p className="text-xs text-zinc-500">
                  Try switching the date range to &quot;This Week&quot; or clearing impact/currency filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setImpactFilter('ALL');
                    setDateFilter('ALL');
                    setCurrencyFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-medium">
                    <tr>
                      <th className="px-5 py-3.5">Time (IST)</th>
                      <th className="px-5 py-3.5">Currency</th>
                      <th className="px-5 py-3.5">Impact</th>
                      <th className="px-5 py-3.5 min-w-[240px]">Economic Event</th>
                      <th className="px-5 py-3.5 text-center">Actual</th>
                      <th className="px-5 py-3.5 text-center">Forecast</th>
                      <th className="px-5 py-3.5 text-center">Previous</th>
                      <th className="px-5 py-3.5 text-right">Window Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredEvents.map((item) => {
                      const rel = getEventRelativeStatus(item.time);
                      const isHigh = item.impact === 'HIGH';

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isHigh ? 'hover:bg-red-950/10' : 'hover:bg-zinc-800/30'
                          }`}
                        >
                          {/* Time */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-mono font-bold text-zinc-100">
                              {formatEventTimeIST(item.time)}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {formatEventDateIST(item.time)}
                            </div>
                          </td>

                          {/* Currency */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <CurrencyBadge country={item.country} size="sm" />
                          </td>

                          {/* Impact */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <NewsImpactBadge impact={item.impact} size="sm" />
                          </td>

                          {/* Title */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-zinc-100">{item.title}</div>
                            <div className="text-[10px] text-zinc-400 flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-zinc-500">Sources:</span>
                              {(item.source || 'ForexFactory').split(',').map((src) => {
                                const s = src.trim();
                                const isFF = s.toLowerCase().includes('forexfactory') || s.toLowerCase().includes('ff');
                                const isInv = s.toLowerCase().includes('investing');
                                const isDaily = s.toLowerCase().includes('dailyfx');
                                const isStreet = s.toLowerCase().includes('fxstreet');

                                const badgeColor = isFF
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : isInv
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isDaily
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  : isStreet
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700';

                                return (
                                  <span
                                    key={s}
                                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${badgeColor}`}
                                  >
                                    🏷️ {s}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Actual */}
                          <td className="px-5 py-3.5 text-center whitespace-nowrap font-mono font-semibold text-zinc-100">
                            {item.actual ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.actual}
                              </span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>

                          {/* Forecast */}
                          <td className="px-5 py-3.5 text-center whitespace-nowrap font-mono text-zinc-300">
                            {item.forecast || <span className="text-zinc-600">-</span>}
                          </td>

                          {/* Previous */}
                          <td className="px-5 py-3.5 text-center whitespace-nowrap font-mono text-zinc-400">
                            {item.previous || <span className="text-zinc-600">-</span>}
                          </td>

                          {/* Window Status */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <span className={`text-[11px] ${rel.color}`}>{rel.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROTECTION SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <NewsSettingsTab
          accounts={accounts}
          initialAccountId={activeAccountId}
          initialSettings={initialSettings}
        />
      )}
    </div>
  );
}
