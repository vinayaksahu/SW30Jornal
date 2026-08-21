'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Radio,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsImpact } from '@/types/enums';
import { createCustomNewsEvent, deleteNewsEvent } from '@/actions/admin';
import { syncNewsEvents } from '@/actions/news';
import { CurrencyBadge } from '@/components/news/currency-badge';
import { NewsImpactBadge } from '@/components/news/news-impact-badge';
import { toast } from 'sonner';

interface AdminNewsClientProps {
  initialEvents: any[];
}

export default function AdminNewsClient({ initialEvents }: AdminNewsClientProps) {
  const [events, setEvents] = React.useState(initialEvents);
  const [search, setSearch] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<{
    title: string;
    country: string;
    impact: NewsImpact;
    eventTime: string;
    forecast: string;
    previous: string;
  }>({
    title: '',
    country: 'USD',
    impact: 'HIGH' as NewsImpact,
    eventTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
    forecast: '',
    previous: '',
  });

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.impact.toLowerCase().includes(q)
      );
    });
  }, [events, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const created = await createCustomNewsEvent({
        ...formData,
        eventTime: new Date(formData.eventTime),
      });
      setEvents((prev) => [created, ...prev]);
      toast.success('Custom news blackout event injected successfully!');
      setFormData({
        title: '',
        country: 'USD',
        impact: NewsImpact.HIGH,
        eventTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
        forecast: '',
        previous: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create news event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete news blackout event "${title}"?`)) return;

    try {
      await deleteNewsEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('News blackout event deleted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncNewsEvents();
      toast.success('Synchronized live economic feed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Admin Console
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Radio className="h-6 w-6 text-amber-400" />
            Admin News & Blackout Controls
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Inject custom high-impact news events (FOMC, NFP, speeches) to trigger journal protection windows.
          </p>
        </div>

        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          className="gap-1.5 text-xs border-zinc-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync ForexFactory Feed'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Custom News Event */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Inject Custom News Event
              </CardTitle>
              <CardDescription>
                Forces an active blackout window across affected currency pairs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Surprise FOMC Rate Statement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-medium">Affected Currency</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="USD">USD (United States)</option>
                      <option value="EUR">EUR (Euro Zone)</option>
                      <option value="GBP">GBP (Great Britain)</option>
                      <option value="JPY">JPY (Japan)</option>
                      <option value="AUD">AUD (Australia)</option>
                      <option value="CAD">CAD (Canada)</option>
                      <option value="NZD">NZD (New Zealand)</option>
                      <option value="CHF">CHF (Switzerland)</option>
                      <option value="XAU">XAU / GOLD</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-medium">Impact Level</label>
                    <select
                      value={formData.impact}
                      onChange={(e) => setFormData({ ...formData, impact: e.target.value as NewsImpact })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="HIGH">HIGH (🔴 Red)</option>
                      <option value="MEDIUM">MEDIUM (🟡 Yellow)</option>
                      <option value="LOW">LOW (🟢 Green)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium">Event Date & Time (Local / Device Time)</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-medium">Forecast (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5.25%"
                      value={formData.forecast}
                      onChange={(e) => setFormData({ ...formData, forecast: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-medium">Previous (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5.00%"
                      value={formData.previous}
                      onChange={(e) => setFormData({ ...formData, previous: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isCreating} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Zap className="h-4 w-4" />
                  {isCreating ? 'Injecting Event...' : 'Inject News Blackout Event'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Active & Scheduled News List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search news events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Event</th>
                      <th className="px-3 py-3 font-semibold">Currency</th>
                      <th className="px-3 py-3 font-semibold">Impact</th>
                      <th className="px-4 py-3 font-semibold">IST Time</th>
                      <th className="px-3 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                          No news events found.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-100 max-w-xs truncate">
                            {item.title}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <CurrencyBadge country={item.country} size="sm" />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <NewsImpactBadge impact={item.impact} size="sm" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-300 text-[11px]">
                            {new Date(item.eventTime).toLocaleDateString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-[10px] text-zinc-500">
                            {item.source || 'FEED'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
