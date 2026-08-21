import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-client';

export const metadata = {
  title: 'Settings & Backup Center | SW30 Prop Firm Journal',
  description: 'Manage user profile, preferences, timezone, database exports, and GitHub Gist sync.',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  let user: any = null;
  let accounts: any[] = [];

  try {
    const [fetchedUser, fetchedAccounts] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          timezone: true,
          createdAt: true,
          userSettings: true,
        },
      }),
      db.account.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true, propFirm: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    user = fetchedUser;
    accounts = fetchedAccounts;
  } catch (err) {
    console.warn('Settings DB query warning (using dev fallback):', err);
  }

  const fallbackUser = user || {
    id: session.user.id,
    name: session.user.name || 'Demo User',
    email: session.user.email || 'user@sw30journal.com',
    role: (session.user as any).role || 'USER',
    timezone: 'Asia/Kolkata',
    createdAt: new Date().toISOString(),
    userSettings: null,
  };

  return (
    <SettingsClient
      user={{
        ...fallbackUser,
        settings: fallbackUser.userSettings
          ? {
              ...fallbackUser.userSettings,
              defaultRisk: fallbackUser.userSettings.defaultRisk
                ? Number(fallbackUser.userSettings.defaultRisk)
                : 1.0,
            }
          : null,
      }}
      accounts={accounts}
    />
  );
}
