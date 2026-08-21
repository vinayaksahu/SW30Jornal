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

  const [user, accounts] = await Promise.all([
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

  if (!user) {
    redirect('/login');
  }

  return (
    <SettingsClient
      user={{
        ...user,
        settings: user.userSettings
          ? {
              ...user.userSettings,
              defaultRisk: user.userSettings.defaultRisk
                ? Number(user.userSettings.defaultRisk)
                : 1.0,
            }
          : null,
      }}
      accounts={accounts}
    />
  );
}
