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

  let accounts: any[] = [];
  let activeAccountId: string | undefined = undefined;
  let initialNews: any[] = [];
  let initialSettings: any[] = [];

  try {
    // Get user's accounts
    accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, propFirm: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get active or default account
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    activeAccountId = userSettings?.defaultAccountId || accounts[0]?.id;

    // Initial news events & account settings
    const [fetchedNews, fetchedSettings] = await Promise.all([
      getNewsEvents(),
      activeAccountId ? getAccountNewsSettings(activeAccountId) : Promise.resolve([]),
    ]);

    initialNews = fetchedNews;
    initialSettings = fetchedSettings;
  } catch (err) {
    console.warn('News page DB fallback:', err);
  }

  return (
    <NewsClient
      initialNews={initialNews}
      accounts={accounts}
      activeAccountId={activeAccountId}
      initialSettings={initialSettings}
      userRole={(session.user as any).role || 'USER'}
    />
  );
}
