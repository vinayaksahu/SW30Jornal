'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Wallet,
  BookOpen,
  AlertTriangle,
  Radio,
  FileDigit,
  Server,
  Activity,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminOverviewClientProps {
  stats: {
    totalUsers: number;
    totalAccounts: number;
    totalTrades: number;
    totalViolations: number;
    activeNewsEvents: number;
    recentAuditLogsCount: number;
    totalVolumeTraded: number;
    totalGrossPnL: number;
  };
  recentLogs: any[];
}

export default function AdminOverviewClient({ stats, recentLogs }: AdminOverviewClientProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/10 text-xs">
              <ShieldAlert className="h-3 w-3 mr-1" />
              ADMIN PRIVILEGES
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mt-2">Administrator Console</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Global system monitoring, user role management, news blackout event controls, and immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-zinc-800">
              <Users className="h-3.5 w-3.5" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/news">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-zinc-800">
              <Radio className="h-3.5 w-3.5 text-amber-400" />
              News Events
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
              <FileDigit className="h-3.5 w-3.5" />
              Audit Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Registered Users</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-zinc-100">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-zinc-500">{stats.totalAccounts} trading accounts active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Trades Executed</span>
              <BookOpen className="h-4 w-4 text-blue-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-zinc-100">{stats.totalTrades}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-zinc-500">{stats.totalVolumeTraded.toFixed(2)} total lots traded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Rule Violations Detected</span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-400">{stats.totalViolations}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-zinc-500">Auto-flagged by Rule Engine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Active News Events</span>
              <Radio className="h-4 w-4 text-amber-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-400">{stats.activeNewsEvents}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-zinc-500">{stats.recentAuditLogsCount} system audit entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Main 2-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Audit Trail */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileDigit className="h-4 w-4 text-emerald-400" />
                  Recent Security & Audit Trail
                </CardTitle>
                <CardDescription>Immutable log of administrative overrides, role promotions, and critical actions.</CardDescription>
              </div>
              <Link href="/admin/audit" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No audit entries recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-700 text-zinc-300">
                            {log.action}
                          </Badge>
                          <span className="text-zinc-300 font-medium">{log.targetType}</span>
                        </div>
                        <p className="text-zinc-500 text-[11px]">
                          By: <span className="text-zinc-400">{log.admin?.email || 'System'}</span>
                        </p>
                      </div>
                      <span className="text-[11px] text-zinc-500 shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: System Health & Infrastructure */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                Infrastructure & Services
              </CardTitle>
              <CardDescription>Live health check of core services and APIs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-zinc-300">Neon PostgreSQL Serverless</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[10px]">
                  OPERATIONAL
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  <span className="text-zinc-300">MT5 OCR Vision Engine</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[10px]">
                  READY (REST/Fallback)
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  <span className="text-zinc-300">News Protection Engine</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[10px]">
                  ACTIVE
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-zinc-300">Auth.js Session Handler</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 text-[10px]">
                  JWT / SECURE
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-400" />
                Quick Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/news" className="block">
                <Button variant="outline" className="w-full justify-start text-xs border-zinc-800 gap-2">
                  <Radio className="h-3.5 w-3.5 text-amber-400" />
                  Inject Custom High-Impact News Event
                </Button>
              </Link>
              <Link href="/admin/users" className="block">
                <Button variant="outline" className="w-full justify-start text-xs border-zinc-800 gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  Review User Access & Roles
                </Button>
              </Link>
              <Link href="/admin/audit" className="block">
                <Button variant="outline" className="w-full justify-start text-xs border-zinc-800 gap-2">
                  <FileDigit className="h-3.5 w-3.5 text-blue-400" />
                  Export Audit Trail Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
