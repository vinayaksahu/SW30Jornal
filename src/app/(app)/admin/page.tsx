import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
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

  const [stats, auditData] = await Promise.all([
    getSystemStats(),
    getAuditLogs({ limit: 10 }),
  ]);

  return <AdminOverviewClient stats={stats} recentLogs={auditData.logs} />;
}
