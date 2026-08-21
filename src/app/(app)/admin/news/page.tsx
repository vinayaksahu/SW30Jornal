import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminNewsClient from './admin-news-client';

export const metadata = {
  title: 'News Events Manager | SW30 Admin Console',
  description: 'Manage and inject economic blackout events across currencies.',
};

export default async function AdminNewsPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  let events: any[] = [];
  try {
    events = await db.newsEvent.findMany({
      orderBy: { eventTime: 'asc' },
    });
  } catch (err) {
    console.warn('Admin news page DB fallback:', err);
  }

  return <AdminNewsClient initialEvents={events} />;
}
