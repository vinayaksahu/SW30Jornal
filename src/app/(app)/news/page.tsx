import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getNewsEvents, getAccountNewsSettings } from '@/actions/news';
import NewsClient from './news-client';

export const metadata = {
  title: 'Economic News Center | SW30 Trading Journal',
  description: 'Live Prop Firm Economic News Calendar & Blackout Protection System',
};

export default async function NewsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get user's accounts
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, propFirm: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get active or default account
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  const activeAccountId = userSettings?.defaultAccountId || accounts[0]?.id;

  // Initial news events & account settings
  const [initialNews, initialSettings] = await Promise.all([
    getNewsEvents(),
    activeAccountId ? getAccountNewsSettings(activeAccountId) : Promise.resolve([]),
  ]);

  return (
    <NewsClient
      initialNews={initialNews}
      accounts={accounts}
      activeAccountId={activeAccountId}
      initialSettings={initialSettings}
      userRole={session.user.role || 'USER'}
    />
  );
}
