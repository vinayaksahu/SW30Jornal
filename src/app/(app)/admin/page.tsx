import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSystemStats, getAuditLogs } from '@/actions/admin';
import AdminOverviewClient from './admin-overview-client';

export const metadata = {
  title: 'Admin Console | SW30 Prop Firm Journal',
  description: 'Administrator dashboard, user role controls, news blackout events, and audit logs.',
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  let stats = {
    totalUsers: 1,
    totalAccounts: 1,
    totalTrades: 0,
    totalViolations: 0,
    activeNewsEvents: 0,
    recentAuditLogsCount: 0,
    totalVolumeTraded: 0,
    totalGrossPnL: 0,
  };
  let logs: any[] = [];

  try {
    const [fetchedStats, auditData] = await Promise.all([
      getSystemStats(),
      getAuditLogs({ limit: 10 }),
    ]);
    stats = fetchedStats;
    logs = auditData.logs;
  } catch (err) {
    console.warn('Admin Overview DB query warning (using dev fallback):', err);
  }

  return <AdminOverviewClient stats={stats} recentLogs={logs} />;
}
