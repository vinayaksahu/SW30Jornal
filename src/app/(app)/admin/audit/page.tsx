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

  const { logs, total } = await getAuditLogs({ limit: 100 });

  return <AuditClient initialLogs={logs} total={total} />;
}
