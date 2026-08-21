'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileDigit,
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  Activity,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditClientProps {
  initialLogs: any[];
  total: number;
}

export default function AuditClient({ initialLogs, total }: AuditClientProps) {
  const [logs, setLogs] = React.useState(initialLogs);
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('ALL');

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        (log.user?.email && log.user.email.toLowerCase().includes(q)) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(q);

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const exportAuditJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <FileDigit className="h-6 w-6 text-emerald-400" />
            Immutable Audit Ledger
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Complete compliance ledger tracking admin overrides, role promotions, and critical database modifications.
          </p>
        </div>

        <Button onClick={exportAuditJson} variant="outline" className="gap-1.5 text-xs border-zinc-800">
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          Export Ledger (JSON)
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search audit actions, user emails, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="NEWS_OVERRIDE">NEWS_OVERRIDE</option>
            <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
            <option value="NEWS_EVENT_CREATED">NEWS_EVENT_CREATED</option>
            <option value="NEWS_EVENT_DELETED">NEWS_EVENT_DELETED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Timestamp (IST)</th>
                  <th className="px-4 py-3.5 font-semibold">Action</th>
                  <th className="px-3 py-3.5 font-semibold">Entity</th>
                  <th className="px-4 py-3.5 font-semibold">Actor (User)</th>
                  <th className="px-4 py-3.5 font-semibold">Event Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No matching audit log records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-zinc-900 border-zinc-700 text-zinc-200 font-mono"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-zinc-300 font-medium">
                        {log.targetType}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-zinc-500" />
                          {log.admin?.email || log.adminId || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-300 max-w-md">
                        {typeof log.details === 'object' ? (
                          <pre className="text-[10px] text-zinc-400 font-mono bg-zinc-950 p-1.5 rounded border border-zinc-800/80 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span>{String(log.details)}</span>
                        )}
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
  );
}
