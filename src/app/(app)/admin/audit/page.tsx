import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAuditLogs } from '@/actions/admin';
import AuditClient from './audit-client';

export const metadata = {
  title: 'Audit Logs | SW30 Admin Console',
  description: 'Compliance audit trail, administrative overrides, and system changes ledger.',
};

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  let logs: any[] = [];
  let total = 0;

  try {
    const data = await getAuditLogs({ limit: 100 });
    logs = data.logs;
    total = data.total;
  } catch (err) {
    console.warn('Admin audit page DB fallback:', err);
  }

  return <AuditClient initialLogs={logs} total={total} />;
}
